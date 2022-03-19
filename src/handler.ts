import { context, SpanStatusCode, trace } from '@opentelemetry/api'
import { IncomingMessage, ServerResponse } from 'http'
import { gzipSync } from 'zlib'
import { lock, send, serveCache, unlock } from './cache-manager'
import { encodePayload } from './payload'
import Renderer, { InitArgs } from './renderer'
import { CacheAdapter, HandlerConfig, WrappedHandler } from './types'
import { filterUrl, isZipped, log, mergeConfig, serve } from './utils'
import { MeterProvider } from '@opentelemetry/sdk-metrics-base'

const tracer = trace.getTracer('next-boost')

function matchRules(conf: HandlerConfig, req: IncomingMessage) {
  const err = ['GET', 'HEAD'].indexOf(req.method ?? '') === -1
  if (err) return { matched: false, ttl: -1 }

  if (typeof conf.rules === 'function') {
    const ttl = conf.rules(req)
    if (ttl) return { matched: true, ttl }
  } else {
    for (const rule of conf.rules ?? []) {
      if (req.url && new RegExp(rule.regex).test(req.url)) {
        return { matched: true, ttl: rule.ttl }
      }
    }
  }
  return { matched: false, ttl: 0 }
}

/**
 * Wrap a http listener to serve cached response
 *
 * @param cache the cache
 * @param conf conf of next-boost
 * @param renderer the SSR renderer runs in worker thread
 * @param next pass-through handler
 *
 * @returns a request listener to use in http server
 */
const wrap: WrappedHandler = (cache, conf, renderer, next) => {
  return async (req, res, handlerSpan, counters) => {
    const serveSpan = tracer.startSpan('next-boost serve')

    // Generate the cache key and find the cache rules for it
    req.url = filterUrl(req.url ?? '', conf.paramFilter)
    const key = conf.cacheKey ? conf.cacheKey(req) : req.url
    const { matched, ttl } = matchRules(conf, req)

    serveSpan.setAttributes({ url: req.url, key, matched })
    handlerSpan.setAttributes({ url: req.url, key, matched })

    // No cache rule was found, bypass caching
    if (!matched) {
      res.setHeader('x-next-boost-status', 'bypass')
      counters.request.add(1, { url: req.url, 'next-boost.status': 'bypass' })
      serveSpan.setAttribute('next-boost.status', 'bypass')
      handlerSpan.setAttribute('next-boost.status', 'bypass')
      serveSpan.end()
      return next(req, res)
    }

    // Lookup the key in the cache
    const cacheLookupSpan = tracer.startSpan('next-boost cacheLookup')
    const state = await context.with(trace.setSpan(context.active(), cacheLookupSpan), () => {
      return serveCache(cache, key, false)
    })
    res.setHeader('x-next-boost-status', state.status)
    counters.request.add(1, { url: req.url, 'next-boost.status': state.status })
    cacheLookupSpan.setAttribute('next-boost.status', state.status)
    serveSpan.setAttribute('next-boost.status', state.status)
    handlerSpan.setAttribute('next-boost.status', state.status)
    cacheLookupSpan.end()

    // If the cache is not missing, serve it
    if (state.status === 'stale' || state.status === 'hit' || state.status === 'fulfill') {
      send(state.payload, res)
      serveSpan.end()

      // Dont need to refresh the cache, we're done
      if (state.status !== 'stale') {
        return
      }
    }

    // Refresh the cache (miss or stale)
    try {
      // Lock the cache
      const cacheLockSpan = tracer.startSpan('next-boost cacheLock')
      await context.with(trace.setSpan(context.active(), cacheLockSpan), () => {
        return lock(key, cache)
      })
      cacheLockSpan.end()

      // Render the page
      const renderSpan = tracer.startSpan('next-boost render')
      counters.pendingRenders.add(1)
      const args = { path: req.url, headers: req.headers, method: req.method }
      const rv = await renderer.render(args)
      if (ttl && rv.statusCode === 200 && conf.cacheControl) {
        rv.headers['cache-control'] = conf.cacheControl(req, ttl)
      }
      // rv.body is a Buffer in JSON format: { type: 'Buffer', data: [...] }
      const body = Buffer.from(rv.body)
      counters.pendingRenders.add(-1)
      counters.renders.add(1, { 'next.statusCode': rv.statusCode.toString() })
      renderSpan.setAttributes({ 'next.statusCode ': rv.statusCode })
      if (rv.statusCode >= 400) {
        renderSpan.setStatus({ code: SpanStatusCode.ERROR })
      }
      renderSpan.end()

      // Serve the page if not yet served via cache
      if (state.status !== 'stale') {
        serve(res, rv)
        serveSpan.end()
      }

      // Write the cache
      if (rv.statusCode === 200) {
        const cacheWriteSpan = tracer.startSpan('next-boost cacheWrite')
        await context.with(trace.setSpan(context.active(), cacheWriteSpan), () => {
          const payload = {
            headers: rv.headers,
            body: isZipped(rv.headers) ? body : gzipSync(body),
          }

          return cache.set('payload:' + key, encodePayload(payload), ttl)
        })
        cacheWriteSpan.end()
      }
    } catch (e) {
      const error = e as Error
      log('error', 'Render error', {
        key,
        errorMessage: error.message,
        errorStack: error.stack,
      })
      handlerSpan.recordException(error)
    } finally {
      // Unlock the cache
      const cacheUnlockSpan = tracer.startSpan('next-boost cacheUnlock')
      await context.with(trace.setSpan(context.active(), cacheUnlockSpan), () => {
        return unlock(key, cache)
      })
      cacheUnlockSpan.end()
    }
  }
}

export default async function CachedHandler(args: InitArgs, options?: HandlerConfig) {
  log('info', 'Preparing cache adapter')

  // merge config
  const conf = mergeConfig(options)

  // the cache
  if (!conf.cacheAdapter) {
    const { Adapter } = require('@next-boost/hybrid-disk-cache')
    conf.cacheAdapter = new Adapter() as CacheAdapter
  }
  const adapter = conf.cacheAdapter
  const cache = await adapter.init()

  log('info', 'Initializing renderer')
  const renderer = Renderer()
  await renderer.init(args)
  const plain = await require(args.script).default(args)

  const meterProvider = new MeterProvider({
    exporter: options?.openTelemetryConfig?.metricExporter,
    interval: options?.openTelemetryConfig?.metricInterval,
  })

  const meter = meterProvider.getMeter('default')

  const counters = {
    request: meter.createCounter('next_boost_requests', {
      description: 'Amount of requests handled by next-boost',
    }),
    renders: meter.createCounter('next_boost_renders', {
      description: 'Amount of requests rendered by next-boost',
    }),
    pendingRenders: meter.createUpDownCounter('next_boost_pending_renders', {
      description: 'Amount of requests currently being rendered by next-boost',
    }),
  }

  const requestHandler = wrap(cache, conf, renderer, plain)
  const requestListener = async (req: IncomingMessage, res: ServerResponse) => {
    const handlerSpan = tracer.startSpan('next-boost handler')

    await context.with(trace.setSpan(context.active(), handlerSpan), () => {
      return requestHandler(req, res, handlerSpan, counters)
    })

    handlerSpan.end()
  }

  // init the child process for revalidate and cache purge
  return {
    handler: requestListener,
    cache,
    close: async () => {
      renderer.kill()
      await adapter.shutdown()
    },
  }
}
