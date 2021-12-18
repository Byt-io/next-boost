import { IncomingMessage } from 'http'

import { PagePayload } from './payload'
import Renderer, { RequestListener } from './renderer'

export type CacheKeyBuilder = (req: IncomingMessage) => string

export type CacheStatus = 'hit' | 'stale' | 'miss'

export type Cache = {
  set(key: string, value: Buffer, ttl?: number): Promise<void>
  get(key: string, defaultValue?: Buffer): Promise<Buffer | undefined>
  has(key: string): Promise<CacheStatus>
  del(key: string): Promise<void>
  inc?(label: string): Promise<void>
  count?(labels: Array<string>): Promise<number[]>
}

export type CacheAdapter = {
  init(): Promise<Cache>
  shutdown(): Promise<void>
}

export type URLCacheRuleResolver = (req: IncomingMessage) => number

export interface HandlerConfig {
  filename?: string // config file's path
  quiet?: boolean
  rules?: Array<URLCacheRule> | URLCacheRuleResolver
  cacheAdapter?: CacheAdapter
  paramFilter?: ParamFilter
  cacheKey?: CacheKeyBuilder
}

export interface URLCacheRule {
  regex: string
  ttl: number
}

export type ParamFilter = (param: string) => boolean
type RendererType = ReturnType<typeof Renderer>

export type WrappedHandler = (
  cache: Cache,
  conf: HandlerConfig,
  renderer: RendererType,
  plainHandler: RequestListener,
) => RequestListener

export type State =
  | {
      status: 'hit' | 'fulfill'
      payload: PagePayload
    }
  | {
      status: 'stale'
      payload: PagePayload
    }
  | {
      status: 'miss'
    }
  | {
      status: 'timeout'
    }
  | {
      status: 'force'
    }
  | {
      status: 'bypass'
    }
