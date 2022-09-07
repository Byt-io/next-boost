import { IncomingMessage } from 'http'
import { gzipSync } from 'zlib'
import { lock, send, serveCache, unlock } from './cache-manager'
import { forMetrics, Metrics, serveMetrics } from './metrics'
import { encodePayload } from './payload'
import Renderer, { InitArgs } from './renderer'
import { CacheAdapter, HandlerConfig, WrappedHandler } from './types'
import { filterUrl, isZipped, mergeConfig, serve } from './utils'

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
const wrap: WrappedHandler = (cache, conf, renderer, next, metrics, log) => {
  return async (req, res) => {
    if (conf.metrics && forMetrics(req)) return serveMetrics(metrics, res)

    // Generate the cache key and find the cache rules for it
    req.url = filterUrl(req.url ?? '', conf.paramFilter)
    const key = conf.cacheKey ? conf.cacheKey(req) : req.url
    const { matched, ttl } = matchRules(conf, req)

    // No cache rule was found, bypass caching
    if (!matched) {
      metrics.inc('bypass')
      res.setHeader('x-next-boost-status', 'bypass')
      log('info', 'URL served', { url: req.url, cacheStatus: 'bypass' })
      return next(req, res)
    }

    // Lookup the key in the cache
    const lookupStart = new Date().getTime()
    const state = await serveCache(cache, key, false)
    const cacheLookupMs = new Date().getTime() - lookupStart
    res.setHeader('x-next-boost-status', state.status)
    metrics.inc(state.status)

    // If the cache is not missing, serve it
    if (state.status === 'stale' || state.status === 'hit' || state.status === 'fulfill') {
      send(state.payload, res)

      log('info', 'URL served', {
        url: req.url,
        cacheStatus: state.status,
        cacheLookupMs,
      })

      // Don't need to refresh the cache -> we're done
      if (state.status !== 'stale') {
        return
      }
    }

    // Refresh the cache (miss or stale)
    try {
      // Lock the cache
      await lock(key, cache)

      // Render the page
      const renderStart = new Date().getTime()
      const args = { path: req.url, headers: req.headers, method: req.method }
      const rv = await renderer.render(args)
      const renderMs = new Date().getTime() - renderStart

      if (ttl && rv.statusCode === 200 && conf.cacheControl) {
        rv.headers['cache-control'] = conf.cacheControl(req, ttl)
      }
      // rv.body is a Buffer in JSON format: { type: 'Buffer', data: [...] }
      const body = Buffer.from(rv.body)

      // Serve the page if not yet served via cache
      if (state.status !== 'stale') {
        serve(res, rv)
      }

      log(rv.statusCode < 400 ? 'info' : 'warn', 'URL served', {
        url: req.url,
        cacheStatus: state.status,
        cacheLookupMs,
        renderStatus: rv.statusCode,
        renderMs,
      })

      // Write the cache
      if (rv.statusCode === 200) {
        const writeStart = new Date().getTime()
        const payload = { headers: rv.headers, body: isZipped(rv.headers) ? body : gzipSync(body) }
        await cache.set('payload:' + key, encodePayload(payload), ttl)
        const cacheWriteMs = new Date().getTime() - writeStart

        log('info', 'Cache written', {
          url: req.url,
          cacheStatus: state.status,
          cacheWriteMs,
        })
      }
    } catch (e) {
      const error = e as Error
      log('error', 'Render error', {
        key,
        errorMessage: error.message,
        errorStack: error.stack,
      })
    } finally {
      await unlock(key, cache)
    }
  }
}

export default async function CachedHandler(args: InitArgs, options: HandlerConfig) {
  const log = options.log

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

  const metrics = new Metrics()

  // init the child process for revalidate and cache purge
  return {
    handler: wrap(cache, conf, renderer, plain, metrics, log),
    cache,
    close: async () => {
      renderer.kill()
      await adapter.shutdown()
    },
  }
}
