#!/usr/bin/env node
process.env.NODE_ENV = 'production'

import http from 'http'
import gracefulShutdown from 'http-graceful-shutdown'
import CachedHandler from '../handler'
import { log } from '../utils'
import { MeterConfig } from '@opentelemetry/sdk-metrics-base'

export interface ServeOptions {
  port?: number
  hostname?: string
  dir?: string
  grace?: number
  openTelemetryConfig?: {
    metricExporter: MeterConfig['exporter']
    metricInterval: MeterConfig['interval']
  }
}

export const serve = async (options: ServeOptions = {}) => {
  const port = options.port || 3000
  const hostname = options.hostname // no host binding by default, the same as `next start`
  const dir = options.dir || '.'
  const grace = options.grace || 30000

  const script = require.resolve('./init')
  const rendererArgs = { script, args: { dir, dev: false } }
  const cached = await CachedHandler(rendererArgs, {
    openTelemetryConfig: options.openTelemetryConfig,
  })

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
