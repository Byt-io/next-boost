#!/usr/bin/env node
process.env.NODE_ENV = 'production'

import http from 'http'
import gracefulShutdown from 'http-graceful-shutdown'
import CachedHandler from '../handler'
import { Logger } from '../types'

export interface ServeOptions {
  port?: number
  hostname?: string
  dir?: string
  grace?: number
  log?: Logger
}

export const serve = async (options: ServeOptions = {}) => {
  const port = options.port || 3000
  const hostname = options.hostname // no host binding by default, the same as `next start`
  const dir = options.dir || '.'
  const grace = options.grace || 30000
  const log = options.log || (() => false)

  const script = require.resolve('./init')
  const rendererArgs = { script, args: { dir, dev: false } }
  const cached = await CachedHandler(rendererArgs, { log })

  const server = new http.Server(cached.handler)
  server.listen(port, hostname, () => {
    log('info', `Serving on http://${hostname || 'localhost'}:${port}`)
  })

  gracefulShutdown(server, {
    timeout: grace,
    preShutdown: async () => log('info', 'Preparing shutdown'),
    onShutdown: async () => cached.close(),
    finally: () => log('info', 'Completed shutdown'),
  })
}
