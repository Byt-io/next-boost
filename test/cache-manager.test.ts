import { expect } from 'chai'
import http from 'http'
import { AddressInfo } from 'net'
import Manger from '../src/cache-manager'
import { mergeConfig } from '../src/utils'

describe('cache manager', () => {
  it('init and revalidate', (done) => {
    const manager = Manger()
    const url = '/aaa'
    const server = new http.Server((req, res) => {
      res.end()
      expect(req.headers['x-cache-status']).to.eq('stale')
      expect(req.url).to.eq(url)
      setTimeout(() => {
        server.close()
        manager.kill()
        done()
      }, 500)
    })
    server.listen()
    const conf = mergeConfig({ port: (server.address() as AddressInfo).port })
    conf.cache.tbd = 0.5
    manager.send({ action: 'init', payload: conf })
    manager.send({ action: 'init', payload: conf }) // ignored
    manager.send({ action: 'unknown', payload: conf }) // ignored
    manager.send({ action: 'revalidate', payload: url })
    manager.send({ action: 'revalidate', payload: url }) // ignored
  }).timeout(5000)
})
