import http from 'http'
import Cache from 'hybrid-disk-cache'
import { gzipSync } from 'zlib'
import Renderer, { InitArgs } from './renderer'
import { initPurgeTimer, stopPurgeTimer } from './cache-manager'
// import Renderer from './renderer'
import {
  filterUrl,
  isZipped,
  log,
  mergeConfig,
  ParamFilter,
  serveCache,
} from './utils'

function matchRule(conf: HandlerConfig, url: string) {
  for (const rule of conf.rules) {
    if (url && new RegExp(rule.regex).test(url)) {
      return { matched: true, ttl: rule.ttl }
    }
  }
  return { matched: false, ttl: conf.cache.ttl }
}

function toBuffer(o: any) {
  return Buffer.from(JSON.stringify(o))
}

interface URLCacheRule {
  regex: string
  ttl: number
}

export interface HandlerConfig {
  filename?: string
  quiet?: boolean
  cache?: {
    ttl?: number
    tbd?: number
    path?: string
  }
  rules?: Array<URLCacheRule>
  paramFilter?: ParamFilter
}

type RendererType = ReturnType<typeof Renderer>

function wrap(
  cache: Cache,
  conf: HandlerConfig,
  renderer: RendererType,
  plainHandler: http.RequestListener
): http.RequestListener {
  return async (req, res) => {
    req.url = filterUrl(req.url, conf.paramFilter)
    const { matched, ttl } = matchRule(conf, req.url)
    if (!matched) return plainHandler(req, res)

    const start = process.hrtime()
    const served = serveCache(cache, req, res)
    if (served === 'hit') return !conf.quiet && log(start, served, req.url)

    // send task to render in child process
    const { statusCode, headers, body: bodyAsJSON } = await renderer.render({
      url: req.url,
      headers: req.headers,
      method: req.method,
    })

    const body = Buffer.from(bodyAsJSON)
    const status = req.headers['x-cache-status']
    const isUpdating = status === 'update' || served === 'stale'
    if (!conf.quiet) log(start, isUpdating ? 'update' : 'miss', req.url)

    if (!served) {
      for (const k in headers) res.setHeader(k, headers[k])
      res.statusCode = statusCode
      res.end(body)
    }

    if (statusCode === 200 && body.length > 0) {
      // save gzipped data
      const buf = isZipped(headers) ? Buffer.from(body) : gzipSync(body)
      cache.set('body:' + req.url, buf, ttl)
      cache.set('header:' + req.url, toBuffer(headers), ttl)
    } else if (isUpdating) {
      // updating but get no result
      cache.del('body:' + req.url)
      cache.del('header:' + req.url)
    }
  }
}

export default async function CachedHandler(
  args: InitArgs,
  options?: HandlerConfig
) {
  console.log('> Preparing cached handler')

  // merge config
  const conf = mergeConfig(options)

  // the cache
  const cache = new Cache(conf.cache)
  console.log(`  Cache located at ${cache.path}`)

  // purge timer
  initPurgeTimer(cache)

  const renderer = Renderer()
  await renderer.init(args)
  const plain = await require(args.script).default(args)

  // init the child process for revalidate and cache purge
  return {
    handler: wrap(cache, conf, renderer, plain),
    cache,
    close: () => {
      stopPurgeTimer()
      renderer.kill()
    },
  }
}
