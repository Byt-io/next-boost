"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = CachedHandler;
var _zlib = require("zlib");
var _cacheManager = require("./cache-manager");
var _metrics = require("./metrics");
var _payload = require("./payload");
var _renderer = _interopRequireDefault(require("./renderer"));
var _utils = require("./utils");
function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function matchRules(conf, req) {
    var _method;
    const err = [
        'GET',
        'HEAD'
    ].indexOf((_method = req.method) != null ? _method : '') === -1;
    if (err) return {
        matched: false,
        ttl: -1
    };
    if (typeof conf.rules === 'function') {
        const ttl = conf.rules(req);
        if (ttl) return {
            matched: true,
            ttl
        };
    } else {
        var _rules;
        for (const rule of (_rules = conf.rules) != null ? _rules : []){
            if (req.url && new RegExp(rule.regex).test(req.url)) {
                return {
                    matched: true,
                    ttl: rule.ttl
                };
            }
        }
    }
    return {
        matched: false,
        ttl: 0
    };
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
 */ const wrap = (cache, conf, renderer, next, metrics, log)=>{
    return async (req, res)=>{
        if (conf.metrics && (0, _metrics).forMetrics(req)) return (0, _metrics).serveMetrics(metrics, res);
        var _url;
        // Generate the cache key and find the cache rules for it
        req.url = (0, _utils).filterUrl((_url = req.url) != null ? _url : '', conf.paramFilter);
        const key = conf.cacheKey ? conf.cacheKey(req) : req.url;
        const { matched , ttl  } = matchRules(conf, req);
        // No cache rule was found, bypass caching
        if (!matched) {
            metrics.inc('bypass');
            res.setHeader('x-next-boost-status', 'bypass');
            log('info', 'URL served', {
                url: req.url,
                cacheStatus: 'bypass'
            });
            return next(req, res);
        }
        // Lookup the key in the cache
        const lookupStart = new Date().getTime();
        const state = await (0, _cacheManager).serveCache(cache, key, false);
        const cacheLookupMs = new Date().getTime() - lookupStart;
        res.setHeader('x-next-boost-status', state.status);
        metrics.inc(state.status);
        // If the cache is not missing, serve it
        if (state.status === 'stale' || state.status === 'hit' || state.status === 'fulfill') {
            (0, _cacheManager).send(state.payload, res);
            log('info', 'URL served', {
                url: req.url,
                cacheStatus: state.status,
                cacheLookupMs
            });
            // Don't need to refresh the cache -> we're done
            if (state.status !== 'stale') {
                return;
            }
        }
        // Refresh the cache (miss or stale)
        try {
            // Lock the cache
            await (0, _cacheManager).lock(key, cache);
            // Render the page
            const renderStart = new Date().getTime();
            const args = {
                path: req.url,
                headers: req.headers,
                method: req.method
            };
            const rv = await renderer.render(args);
            const renderMs = new Date().getTime() - renderStart;
            if (ttl && rv.statusCode === 200 && conf.cacheControl) {
                rv.headers['cache-control'] = conf.cacheControl(req, ttl);
            }
            // rv.body is a Buffer in JSON format: { type: 'Buffer', data: [...] }
            const body = Buffer.from(rv.body);
            // Serve the page if not yet served via cache
            if (state.status !== 'stale') {
                (0, _utils).serve(res, rv);
            }
            log(rv.statusCode < 400 ? 'info' : 'warn', 'URL served', {
                url: req.url,
                cacheStatus: state.status,
                cacheLookupMs,
                renderStatus: rv.statusCode,
                renderMs
            });
            // Write the cache
            if (rv.statusCode === 200) {
                const writeStart = new Date().getTime();
                const payload = {
                    headers: rv.headers,
                    body: (0, _utils).isZipped(rv.headers) ? body : (0, _zlib).gzipSync(body)
                };
                await cache.set('payload:' + key, (0, _payload).encodePayload(payload), ttl);
                const cacheWriteMs = new Date().getTime() - writeStart;
                log('info', 'Cache written', {
                    url: req.url,
                    cacheStatus: state.status,
                    cacheWriteMs
                });
            }
        } catch (e) {
            const error = e;
            log('error', 'Render error', {
                key,
                errorMessage: error.message,
                errorStack: error.stack
            });
        } finally{
            await (0, _cacheManager).unlock(key, cache);
        }
    };
};
async function CachedHandler(args, options) {
    const log = options.log;
    log('info', 'Preparing cache adapter');
    // merge config
    const conf = (0, _utils).mergeConfig(options);
    // the cache
    if (!conf.cacheAdapter) {
        const { Adapter  } = require('@next-boost/hybrid-disk-cache');
        conf.cacheAdapter = new Adapter();
    }
    const adapter = conf.cacheAdapter;
    const cache = await adapter.init();
    log('info', 'Initializing renderer');
    const renderer = (0, _renderer).default();
    await renderer.init(args);
    const plain = await require(args.script).default(args);
    const metrics = new _metrics.Metrics();
    // init the child process for revalidate and cache purge
    return {
        handler: wrap(cache, conf, renderer, plain, metrics, log),
        cache,
        close: async ()=>{
            renderer.kill();
            await adapter.shutdown();
        }
    };
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9oYW5kbGVyLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEluY29taW5nTWVzc2FnZSB9IGZyb20gJ2h0dHAnXG5pbXBvcnQgeyBnemlwU3luYyB9IGZyb20gJ3psaWInXG5pbXBvcnQgeyBsb2NrLCBzZW5kLCBzZXJ2ZUNhY2hlLCB1bmxvY2sgfSBmcm9tICcuL2NhY2hlLW1hbmFnZXInXG5pbXBvcnQgeyBmb3JNZXRyaWNzLCBNZXRyaWNzLCBzZXJ2ZU1ldHJpY3MgfSBmcm9tICcuL21ldHJpY3MnXG5pbXBvcnQgeyBlbmNvZGVQYXlsb2FkIH0gZnJvbSAnLi9wYXlsb2FkJ1xuaW1wb3J0IFJlbmRlcmVyLCB7IEluaXRBcmdzIH0gZnJvbSAnLi9yZW5kZXJlcidcbmltcG9ydCB7IENhY2hlQWRhcHRlciwgSGFuZGxlckNvbmZpZywgV3JhcHBlZEhhbmRsZXIgfSBmcm9tICcuL3R5cGVzJ1xuaW1wb3J0IHsgZmlsdGVyVXJsLCBpc1ppcHBlZCwgbWVyZ2VDb25maWcsIHNlcnZlIH0gZnJvbSAnLi91dGlscydcblxuZnVuY3Rpb24gbWF0Y2hSdWxlcyhjb25mOiBIYW5kbGVyQ29uZmlnLCByZXE6IEluY29taW5nTWVzc2FnZSkge1xuICBjb25zdCBlcnIgPSBbJ0dFVCcsICdIRUFEJ10uaW5kZXhPZihyZXEubWV0aG9kID8/ICcnKSA9PT0gLTFcbiAgaWYgKGVycikgcmV0dXJuIHsgbWF0Y2hlZDogZmFsc2UsIHR0bDogLTEgfVxuXG4gIGlmICh0eXBlb2YgY29uZi5ydWxlcyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIGNvbnN0IHR0bCA9IGNvbmYucnVsZXMocmVxKVxuICAgIGlmICh0dGwpIHJldHVybiB7IG1hdGNoZWQ6IHRydWUsIHR0bCB9XG4gIH0gZWxzZSB7XG4gICAgZm9yIChjb25zdCBydWxlIG9mIGNvbmYucnVsZXMgPz8gW10pIHtcbiAgICAgIGlmIChyZXEudXJsICYmIG5ldyBSZWdFeHAocnVsZS5yZWdleCkudGVzdChyZXEudXJsKSkge1xuICAgICAgICByZXR1cm4geyBtYXRjaGVkOiB0cnVlLCB0dGw6IHJ1bGUudHRsIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIHsgbWF0Y2hlZDogZmFsc2UsIHR0bDogMCB9XG59XG5cbi8qKlxuICogV3JhcCBhIGh0dHAgbGlzdGVuZXIgdG8gc2VydmUgY2FjaGVkIHJlc3BvbnNlXG4gKlxuICogQHBhcmFtIGNhY2hlIHRoZSBjYWNoZVxuICogQHBhcmFtIGNvbmYgY29uZiBvZiBuZXh0LWJvb3N0XG4gKiBAcGFyYW0gcmVuZGVyZXIgdGhlIFNTUiByZW5kZXJlciBydW5zIGluIHdvcmtlciB0aHJlYWRcbiAqIEBwYXJhbSBuZXh0IHBhc3MtdGhyb3VnaCBoYW5kbGVyXG4gKlxuICogQHJldHVybnMgYSByZXF1ZXN0IGxpc3RlbmVyIHRvIHVzZSBpbiBodHRwIHNlcnZlclxuICovXG5jb25zdCB3cmFwOiBXcmFwcGVkSGFuZGxlciA9IChjYWNoZSwgY29uZiwgcmVuZGVyZXIsIG5leHQsIG1ldHJpY3MsIGxvZykgPT4ge1xuICByZXR1cm4gYXN5bmMgKHJlcSwgcmVzKSA9PiB7XG4gICAgaWYgKGNvbmYubWV0cmljcyAmJiBmb3JNZXRyaWNzKHJlcSkpIHJldHVybiBzZXJ2ZU1ldHJpY3MobWV0cmljcywgcmVzKVxuXG4gICAgLy8gR2VuZXJhdGUgdGhlIGNhY2hlIGtleSBhbmQgZmluZCB0aGUgY2FjaGUgcnVsZXMgZm9yIGl0XG4gICAgcmVxLnVybCA9IGZpbHRlclVybChyZXEudXJsID8/ICcnLCBjb25mLnBhcmFtRmlsdGVyKVxuICAgIGNvbnN0IGtleSA9IGNvbmYuY2FjaGVLZXkgPyBjb25mLmNhY2hlS2V5KHJlcSkgOiByZXEudXJsXG4gICAgY29uc3QgeyBtYXRjaGVkLCB0dGwgfSA9IG1hdGNoUnVsZXMoY29uZiwgcmVxKVxuXG4gICAgLy8gTm8gY2FjaGUgcnVsZSB3YXMgZm91bmQsIGJ5cGFzcyBjYWNoaW5nXG4gICAgaWYgKCFtYXRjaGVkKSB7XG4gICAgICBtZXRyaWNzLmluYygnYnlwYXNzJylcbiAgICAgIHJlcy5zZXRIZWFkZXIoJ3gtbmV4dC1ib29zdC1zdGF0dXMnLCAnYnlwYXNzJylcbiAgICAgIGxvZygnaW5mbycsICdVUkwgc2VydmVkJywgeyB1cmw6IHJlcS51cmwsIGNhY2hlU3RhdHVzOiAnYnlwYXNzJyB9KVxuICAgICAgcmV0dXJuIG5leHQocmVxLCByZXMpXG4gICAgfVxuXG4gICAgLy8gTG9va3VwIHRoZSBrZXkgaW4gdGhlIGNhY2hlXG4gICAgY29uc3QgbG9va3VwU3RhcnQgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKVxuICAgIGNvbnN0IHN0YXRlID0gYXdhaXQgc2VydmVDYWNoZShjYWNoZSwga2V5LCBmYWxzZSlcbiAgICBjb25zdCBjYWNoZUxvb2t1cE1zID0gbmV3IERhdGUoKS5nZXRUaW1lKCkgLSBsb29rdXBTdGFydFxuICAgIHJlcy5zZXRIZWFkZXIoJ3gtbmV4dC1ib29zdC1zdGF0dXMnLCBzdGF0ZS5zdGF0dXMpXG4gICAgbWV0cmljcy5pbmMoc3RhdGUuc3RhdHVzKVxuXG4gICAgLy8gSWYgdGhlIGNhY2hlIGlzIG5vdCBtaXNzaW5nLCBzZXJ2ZSBpdFxuICAgIGlmIChzdGF0ZS5zdGF0dXMgPT09ICdzdGFsZScgfHwgc3RhdGUuc3RhdHVzID09PSAnaGl0JyB8fCBzdGF0ZS5zdGF0dXMgPT09ICdmdWxmaWxsJykge1xuICAgICAgc2VuZChzdGF0ZS5wYXlsb2FkLCByZXMpXG5cbiAgICAgIGxvZygnaW5mbycsICdVUkwgc2VydmVkJywge1xuICAgICAgICB1cmw6IHJlcS51cmwsXG4gICAgICAgIGNhY2hlU3RhdHVzOiBzdGF0ZS5zdGF0dXMsXG4gICAgICAgIGNhY2hlTG9va3VwTXMsXG4gICAgICB9KVxuXG4gICAgICAvLyBEb24ndCBuZWVkIHRvIHJlZnJlc2ggdGhlIGNhY2hlIC0+IHdlJ3JlIGRvbmVcbiAgICAgIGlmIChzdGF0ZS5zdGF0dXMgIT09ICdzdGFsZScpIHtcbiAgICAgICAgcmV0dXJuXG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gUmVmcmVzaCB0aGUgY2FjaGUgKG1pc3Mgb3Igc3RhbGUpXG4gICAgdHJ5IHtcbiAgICAgIC8vIExvY2sgdGhlIGNhY2hlXG4gICAgICBhd2FpdCBsb2NrKGtleSwgY2FjaGUpXG5cbiAgICAgIC8vIFJlbmRlciB0aGUgcGFnZVxuICAgICAgY29uc3QgcmVuZGVyU3RhcnQgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKVxuICAgICAgY29uc3QgYXJncyA9IHsgcGF0aDogcmVxLnVybCwgaGVhZGVyczogcmVxLmhlYWRlcnMsIG1ldGhvZDogcmVxLm1ldGhvZCB9XG4gICAgICBjb25zdCBydiA9IGF3YWl0IHJlbmRlcmVyLnJlbmRlcihhcmdzKVxuICAgICAgY29uc3QgcmVuZGVyTXMgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKSAtIHJlbmRlclN0YXJ0XG5cbiAgICAgIGlmICh0dGwgJiYgcnYuc3RhdHVzQ29kZSA9PT0gMjAwICYmIGNvbmYuY2FjaGVDb250cm9sKSB7XG4gICAgICAgIHJ2LmhlYWRlcnNbJ2NhY2hlLWNvbnRyb2wnXSA9IGNvbmYuY2FjaGVDb250cm9sKHJlcSwgdHRsKVxuICAgICAgfVxuICAgICAgLy8gcnYuYm9keSBpcyBhIEJ1ZmZlciBpbiBKU09OIGZvcm1hdDogeyB0eXBlOiAnQnVmZmVyJywgZGF0YTogWy4uLl0gfVxuICAgICAgY29uc3QgYm9keSA9IEJ1ZmZlci5mcm9tKHJ2LmJvZHkpXG5cbiAgICAgIC8vIFNlcnZlIHRoZSBwYWdlIGlmIG5vdCB5ZXQgc2VydmVkIHZpYSBjYWNoZVxuICAgICAgaWYgKHN0YXRlLnN0YXR1cyAhPT0gJ3N0YWxlJykge1xuICAgICAgICBzZXJ2ZShyZXMsIHJ2KVxuICAgICAgfVxuXG4gICAgICBsb2cocnYuc3RhdHVzQ29kZSA8IDQwMCA/ICdpbmZvJyA6ICd3YXJuJywgJ1VSTCBzZXJ2ZWQnLCB7XG4gICAgICAgIHVybDogcmVxLnVybCxcbiAgICAgICAgY2FjaGVTdGF0dXM6IHN0YXRlLnN0YXR1cyxcbiAgICAgICAgY2FjaGVMb29rdXBNcyxcbiAgICAgICAgcmVuZGVyU3RhdHVzOiBydi5zdGF0dXNDb2RlLFxuICAgICAgICByZW5kZXJNcyxcbiAgICAgIH0pXG5cbiAgICAgIC8vIFdyaXRlIHRoZSBjYWNoZVxuICAgICAgaWYgKHJ2LnN0YXR1c0NvZGUgPT09IDIwMCkge1xuICAgICAgICBjb25zdCB3cml0ZVN0YXJ0ID0gbmV3IERhdGUoKS5nZXRUaW1lKClcbiAgICAgICAgY29uc3QgcGF5bG9hZCA9IHsgaGVhZGVyczogcnYuaGVhZGVycywgYm9keTogaXNaaXBwZWQocnYuaGVhZGVycykgPyBib2R5IDogZ3ppcFN5bmMoYm9keSkgfVxuICAgICAgICBhd2FpdCBjYWNoZS5zZXQoJ3BheWxvYWQ6JyArIGtleSwgZW5jb2RlUGF5bG9hZChwYXlsb2FkKSwgdHRsKVxuICAgICAgICBjb25zdCBjYWNoZVdyaXRlTXMgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKSAtIHdyaXRlU3RhcnRcblxuICAgICAgICBsb2coJ2luZm8nLCAnQ2FjaGUgd3JpdHRlbicsIHtcbiAgICAgICAgICB1cmw6IHJlcS51cmwsXG4gICAgICAgICAgY2FjaGVTdGF0dXM6IHN0YXRlLnN0YXR1cyxcbiAgICAgICAgICBjYWNoZVdyaXRlTXMsXG4gICAgICAgIH0pXG4gICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgY29uc3QgZXJyb3IgPSBlIGFzIEVycm9yXG4gICAgICBsb2coJ2Vycm9yJywgJ1JlbmRlciBlcnJvcicsIHtcbiAgICAgICAga2V5LFxuICAgICAgICBlcnJvck1lc3NhZ2U6IGVycm9yLm1lc3NhZ2UsXG4gICAgICAgIGVycm9yU3RhY2s6IGVycm9yLnN0YWNrLFxuICAgICAgfSlcbiAgICB9IGZpbmFsbHkge1xuICAgICAgYXdhaXQgdW5sb2NrKGtleSwgY2FjaGUpXG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IGFzeW5jIGZ1bmN0aW9uIENhY2hlZEhhbmRsZXIoYXJnczogSW5pdEFyZ3MsIG9wdGlvbnM6IEhhbmRsZXJDb25maWcpIHtcbiAgY29uc3QgbG9nID0gb3B0aW9ucy5sb2dcblxuICBsb2coJ2luZm8nLCAnUHJlcGFyaW5nIGNhY2hlIGFkYXB0ZXInKVxuXG4gIC8vIG1lcmdlIGNvbmZpZ1xuICBjb25zdCBjb25mID0gbWVyZ2VDb25maWcob3B0aW9ucylcblxuICAvLyB0aGUgY2FjaGVcbiAgaWYgKCFjb25mLmNhY2hlQWRhcHRlcikge1xuICAgIGNvbnN0IHsgQWRhcHRlciB9ID0gcmVxdWlyZSgnQG5leHQtYm9vc3QvaHlicmlkLWRpc2stY2FjaGUnKVxuICAgIGNvbmYuY2FjaGVBZGFwdGVyID0gbmV3IEFkYXB0ZXIoKSBhcyBDYWNoZUFkYXB0ZXJcbiAgfVxuICBjb25zdCBhZGFwdGVyID0gY29uZi5jYWNoZUFkYXB0ZXJcbiAgY29uc3QgY2FjaGUgPSBhd2FpdCBhZGFwdGVyLmluaXQoKVxuXG4gIGxvZygnaW5mbycsICdJbml0aWFsaXppbmcgcmVuZGVyZXInKVxuICBjb25zdCByZW5kZXJlciA9IFJlbmRlcmVyKClcbiAgYXdhaXQgcmVuZGVyZXIuaW5pdChhcmdzKVxuICBjb25zdCBwbGFpbiA9IGF3YWl0IHJlcXVpcmUoYXJncy5zY3JpcHQpLmRlZmF1bHQoYXJncylcblxuICBjb25zdCBtZXRyaWNzID0gbmV3IE1ldHJpY3MoKVxuXG4gIC8vIGluaXQgdGhlIGNoaWxkIHByb2Nlc3MgZm9yIHJldmFsaWRhdGUgYW5kIGNhY2hlIHB1cmdlXG4gIHJldHVybiB7XG4gICAgaGFuZGxlcjogd3JhcChjYWNoZSwgY29uZiwgcmVuZGVyZXIsIHBsYWluLCBtZXRyaWNzLCBsb2cpLFxuICAgIGNhY2hlLFxuICAgIGNsb3NlOiBhc3luYyAoKSA9PiB7XG4gICAgICByZW5kZXJlci5raWxsKClcbiAgICAgIGF3YWl0IGFkYXB0ZXIuc2h1dGRvd24oKVxuICAgIH0sXG4gIH1cbn1cbiJdLCJuYW1lcyI6WyJDYWNoZWRIYW5kbGVyIiwibWF0Y2hSdWxlcyIsImNvbmYiLCJyZXEiLCJlcnIiLCJpbmRleE9mIiwibWV0aG9kIiwibWF0Y2hlZCIsInR0bCIsInJ1bGVzIiwicnVsZSIsInVybCIsIlJlZ0V4cCIsInJlZ2V4IiwidGVzdCIsIndyYXAiLCJjYWNoZSIsInJlbmRlcmVyIiwibmV4dCIsIm1ldHJpY3MiLCJsb2ciLCJyZXMiLCJwYXJhbUZpbHRlciIsImtleSIsImNhY2hlS2V5IiwiaW5jIiwic2V0SGVhZGVyIiwiY2FjaGVTdGF0dXMiLCJsb29rdXBTdGFydCIsIkRhdGUiLCJnZXRUaW1lIiwic3RhdGUiLCJjYWNoZUxvb2t1cE1zIiwic3RhdHVzIiwicGF5bG9hZCIsInJlbmRlclN0YXJ0IiwiYXJncyIsInBhdGgiLCJoZWFkZXJzIiwicnYiLCJyZW5kZXIiLCJyZW5kZXJNcyIsInN0YXR1c0NvZGUiLCJjYWNoZUNvbnRyb2wiLCJib2R5IiwiQnVmZmVyIiwiZnJvbSIsInJlbmRlclN0YXR1cyIsIndyaXRlU3RhcnQiLCJzZXQiLCJjYWNoZVdyaXRlTXMiLCJlIiwiZXJyb3IiLCJlcnJvck1lc3NhZ2UiLCJtZXNzYWdlIiwiZXJyb3JTdGFjayIsInN0YWNrIiwib3B0aW9ucyIsImNhY2hlQWRhcHRlciIsIkFkYXB0ZXIiLCJyZXF1aXJlIiwiYWRhcHRlciIsImluaXQiLCJwbGFpbiIsInNjcmlwdCIsImRlZmF1bHQiLCJoYW5kbGVyIiwiY2xvc2UiLCJraWxsIiwic2h1dGRvd24iXSwibWFwcGluZ3MiOiI7Ozs7a0JBb0k4QkEsYUFBYTtBQW5JbEIsR0FBTSxDQUFOLEtBQU07QUFDZ0IsR0FBaUIsQ0FBakIsYUFBaUI7QUFDZCxHQUFXLENBQVgsUUFBVztBQUMvQixHQUFXLENBQVgsUUFBVztBQUNOLEdBQVksQ0FBWixTQUFZO0FBRVMsR0FBUyxDQUFULE1BQVM7Ozs7OztTQUV4REMsVUFBVSxDQUFDQyxJQUFtQixFQUFFQyxHQUFvQixFQUFFLENBQUM7UUFDMUJBLE9BQVU7SUFBOUMsS0FBSyxDQUFDQyxHQUFHLEdBQUcsQ0FBQztRQUFBLENBQUs7UUFBRSxDQUFNO0lBQUEsQ0FBQyxDQUFDQyxPQUFPLEVBQUNGLE9BQVUsR0FBVkEsR0FBRyxDQUFDRyxNQUFNLFlBQVZILE9BQVUsR0FBSSxDQUFFLFFBQU8sQ0FBQztJQUM1RCxFQUFFLEVBQUVDLEdBQUcsRUFBRSxNQUFNLENBQUMsQ0FBQztRQUFDRyxPQUFPLEVBQUUsS0FBSztRQUFFQyxHQUFHLEdBQUcsQ0FBQztJQUFDLENBQUM7SUFFM0MsRUFBRSxFQUFFLE1BQU0sQ0FBQ04sSUFBSSxDQUFDTyxLQUFLLEtBQUssQ0FBVSxXQUFFLENBQUM7UUFDckMsS0FBSyxDQUFDRCxHQUFHLEdBQUdOLElBQUksQ0FBQ08sS0FBSyxDQUFDTixHQUFHO1FBQzFCLEVBQUUsRUFBRUssR0FBRyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQUNELE9BQU8sRUFBRSxJQUFJO1lBQUVDLEdBQUc7UUFBQyxDQUFDO0lBQ3hDLENBQUMsTUFBTSxDQUFDO1lBQ2FOLE1BQVU7UUFBN0IsR0FBRyxFQUFFLEtBQUssQ0FBQ1EsSUFBSSxLQUFJUixNQUFVLEdBQVZBLElBQUksQ0FBQ08sS0FBSyxZQUFWUCxNQUFVLEdBQUksQ0FBQyxDQUFDLENBQUUsQ0FBQztZQUNwQyxFQUFFLEVBQUVDLEdBQUcsQ0FBQ1EsR0FBRyxJQUFJLEdBQUcsQ0FBQ0MsTUFBTSxDQUFDRixJQUFJLENBQUNHLEtBQUssRUFBRUMsSUFBSSxDQUFDWCxHQUFHLENBQUNRLEdBQUcsR0FBRyxDQUFDO2dCQUNwRCxNQUFNLENBQUMsQ0FBQztvQkFBQ0osT0FBTyxFQUFFLElBQUk7b0JBQUVDLEdBQUcsRUFBRUUsSUFBSSxDQUFDRixHQUFHO2dCQUFDLENBQUM7WUFDekMsQ0FBQztRQUNILENBQUM7SUFDSCxDQUFDO0lBQ0QsTUFBTSxDQUFDLENBQUM7UUFBQ0QsT0FBTyxFQUFFLEtBQUs7UUFBRUMsR0FBRyxFQUFFLENBQUM7SUFBQyxDQUFDO0FBQ25DLENBQUM7QUFFRCxFQVNHLEFBVEg7Ozs7Ozs7OztDQVNHLEFBVEgsRUFTRyxDQUNILEtBQUssQ0FBQ08sSUFBSSxJQUFvQkMsS0FBSyxFQUFFZCxJQUFJLEVBQUVlLFFBQVEsRUFBRUMsSUFBSSxFQUFFQyxPQUFPLEVBQUVDLEdBQUcsR0FBSyxDQUFDO0lBQzNFLE1BQU0sUUFBUWpCLEdBQUcsRUFBRWtCLEdBQUcsR0FBSyxDQUFDO1FBQzFCLEVBQUUsRUFBRW5CLElBQUksQ0FBQ2lCLE9BQU8sUUFuQzhCLFFBQVcsYUFtQzFCaEIsR0FBRyxHQUFHLE1BQU0sS0FuQ0csUUFBVyxlQW1DQWdCLE9BQU8sRUFBRUUsR0FBRztZQUdqRGxCLElBQU87UUFEM0IsRUFBeUQsQUFBekQsdURBQXlEO1FBQ3pEQSxHQUFHLENBQUNRLEdBQUcsT0FsQzZDLE1BQVMsYUFrQ3pDUixJQUFPLEdBQVBBLEdBQUcsQ0FBQ1EsR0FBRyxZQUFQUixJQUFPLEdBQUksQ0FBRSxHQUFFRCxJQUFJLENBQUNvQixXQUFXO1FBQ25ELEtBQUssQ0FBQ0MsR0FBRyxHQUFHckIsSUFBSSxDQUFDc0IsUUFBUSxHQUFHdEIsSUFBSSxDQUFDc0IsUUFBUSxDQUFDckIsR0FBRyxJQUFJQSxHQUFHLENBQUNRLEdBQUc7UUFDeEQsS0FBSyxDQUFDLENBQUMsQ0FBQ0osT0FBTyxHQUFFQyxHQUFHLEVBQUMsQ0FBQyxHQUFHUCxVQUFVLENBQUNDLElBQUksRUFBRUMsR0FBRztRQUU3QyxFQUEwQyxBQUExQyx3Q0FBMEM7UUFDMUMsRUFBRSxHQUFHSSxPQUFPLEVBQUUsQ0FBQztZQUNiWSxPQUFPLENBQUNNLEdBQUcsQ0FBQyxDQUFRO1lBQ3BCSixHQUFHLENBQUNLLFNBQVMsQ0FBQyxDQUFxQixzQkFBRSxDQUFRO1lBQzdDTixHQUFHLENBQUMsQ0FBTSxPQUFFLENBQVksYUFBRSxDQUFDO2dCQUFDVCxHQUFHLEVBQUVSLEdBQUcsQ0FBQ1EsR0FBRztnQkFBRWdCLFdBQVcsRUFBRSxDQUFRO1lBQUMsQ0FBQztZQUNqRSxNQUFNLENBQUNULElBQUksQ0FBQ2YsR0FBRyxFQUFFa0IsR0FBRztRQUN0QixDQUFDO1FBRUQsRUFBOEIsQUFBOUIsNEJBQThCO1FBQzlCLEtBQUssQ0FBQ08sV0FBVyxHQUFHLEdBQUcsQ0FBQ0MsSUFBSSxHQUFHQyxPQUFPO1FBQ3RDLEtBQUssQ0FBQ0MsS0FBSyxHQUFHLEtBQUssS0FyRHdCLGFBQWlCLGFBcUQ3QmYsS0FBSyxFQUFFTyxHQUFHLEVBQUUsS0FBSztRQUNoRCxLQUFLLENBQUNTLGFBQWEsR0FBRyxHQUFHLENBQUNILElBQUksR0FBR0MsT0FBTyxLQUFLRixXQUFXO1FBQ3hEUCxHQUFHLENBQUNLLFNBQVMsQ0FBQyxDQUFxQixzQkFBRUssS0FBSyxDQUFDRSxNQUFNO1FBQ2pEZCxPQUFPLENBQUNNLEdBQUcsQ0FBQ00sS0FBSyxDQUFDRSxNQUFNO1FBRXhCLEVBQXdDLEFBQXhDLHNDQUF3QztRQUN4QyxFQUFFLEVBQUVGLEtBQUssQ0FBQ0UsTUFBTSxLQUFLLENBQU8sVUFBSUYsS0FBSyxDQUFDRSxNQUFNLEtBQUssQ0FBSyxRQUFJRixLQUFLLENBQUNFLE1BQU0sS0FBSyxDQUFTLFVBQUUsQ0FBQztnQkEzRDVDLGFBQWlCLE9BNERyREYsS0FBSyxDQUFDRyxPQUFPLEVBQUViLEdBQUc7WUFFdkJELEdBQUcsQ0FBQyxDQUFNLE9BQUUsQ0FBWSxhQUFFLENBQUM7Z0JBQ3pCVCxHQUFHLEVBQUVSLEdBQUcsQ0FBQ1EsR0FBRztnQkFDWmdCLFdBQVcsRUFBRUksS0FBSyxDQUFDRSxNQUFNO2dCQUN6QkQsYUFBYTtZQUNmLENBQUM7WUFFRCxFQUFnRCxBQUFoRCw4Q0FBZ0Q7WUFDaEQsRUFBRSxFQUFFRCxLQUFLLENBQUNFLE1BQU0sS0FBSyxDQUFPLFFBQUUsQ0FBQztnQkFDN0IsTUFBTTtZQUNSLENBQUM7UUFDSCxDQUFDO1FBRUQsRUFBb0MsQUFBcEMsa0NBQW9DO1FBQ3BDLEdBQUcsQ0FBQyxDQUFDO1lBQ0gsRUFBaUIsQUFBakIsZUFBaUI7WUFDakIsS0FBSyxLQTdFb0MsYUFBaUIsT0E2RS9DVixHQUFHLEVBQUVQLEtBQUs7WUFFckIsRUFBa0IsQUFBbEIsZ0JBQWtCO1lBQ2xCLEtBQUssQ0FBQ21CLFdBQVcsR0FBRyxHQUFHLENBQUNOLElBQUksR0FBR0MsT0FBTztZQUN0QyxLQUFLLENBQUNNLElBQUksR0FBRyxDQUFDO2dCQUFDQyxJQUFJLEVBQUVsQyxHQUFHLENBQUNRLEdBQUc7Z0JBQUUyQixPQUFPLEVBQUVuQyxHQUFHLENBQUNtQyxPQUFPO2dCQUFFaEMsTUFBTSxFQUFFSCxHQUFHLENBQUNHLE1BQU07WUFBQyxDQUFDO1lBQ3hFLEtBQUssQ0FBQ2lDLEVBQUUsR0FBRyxLQUFLLENBQUN0QixRQUFRLENBQUN1QixNQUFNLENBQUNKLElBQUk7WUFDckMsS0FBSyxDQUFDSyxRQUFRLEdBQUcsR0FBRyxDQUFDWixJQUFJLEdBQUdDLE9BQU8sS0FBS0ssV0FBVztZQUVuRCxFQUFFLEVBQUUzQixHQUFHLElBQUkrQixFQUFFLENBQUNHLFVBQVUsS0FBSyxHQUFHLElBQUl4QyxJQUFJLENBQUN5QyxZQUFZLEVBQUUsQ0FBQztnQkFDdERKLEVBQUUsQ0FBQ0QsT0FBTyxDQUFDLENBQWUsa0JBQUlwQyxJQUFJLENBQUN5QyxZQUFZLENBQUN4QyxHQUFHLEVBQUVLLEdBQUc7WUFDMUQsQ0FBQztZQUNELEVBQXNFLEFBQXRFLG9FQUFzRTtZQUN0RSxLQUFLLENBQUNvQyxJQUFJLEdBQUdDLE1BQU0sQ0FBQ0MsSUFBSSxDQUFDUCxFQUFFLENBQUNLLElBQUk7WUFFaEMsRUFBNkMsQUFBN0MsMkNBQTZDO1lBQzdDLEVBQUUsRUFBRWIsS0FBSyxDQUFDRSxNQUFNLEtBQUssQ0FBTyxRQUFFLENBQUM7b0JBdkZtQixNQUFTLFFBd0ZuRFosR0FBRyxFQUFFa0IsRUFBRTtZQUNmLENBQUM7WUFFRG5CLEdBQUcsQ0FBQ21CLEVBQUUsQ0FBQ0csVUFBVSxHQUFHLEdBQUcsR0FBRyxDQUFNLFFBQUcsQ0FBTSxPQUFFLENBQVksYUFBRSxDQUFDO2dCQUN4RC9CLEdBQUcsRUFBRVIsR0FBRyxDQUFDUSxHQUFHO2dCQUNaZ0IsV0FBVyxFQUFFSSxLQUFLLENBQUNFLE1BQU07Z0JBQ3pCRCxhQUFhO2dCQUNiZSxZQUFZLEVBQUVSLEVBQUUsQ0FBQ0csVUFBVTtnQkFDM0JELFFBQVE7WUFDVixDQUFDO1lBRUQsRUFBa0IsQUFBbEIsZ0JBQWtCO1lBQ2xCLEVBQUUsRUFBRUYsRUFBRSxDQUFDRyxVQUFVLEtBQUssR0FBRyxFQUFFLENBQUM7Z0JBQzFCLEtBQUssQ0FBQ00sVUFBVSxHQUFHLEdBQUcsQ0FBQ25CLElBQUksR0FBR0MsT0FBTztnQkFDckMsS0FBSyxDQUFDSSxPQUFPLEdBQUcsQ0FBQztvQkFBQ0ksT0FBTyxFQUFFQyxFQUFFLENBQUNELE9BQU87b0JBQUVNLElBQUksTUF0R0ssTUFBUyxXQXNHSEwsRUFBRSxDQUFDRCxPQUFPLElBQUlNLElBQUksT0E1R3ZELEtBQU0sV0E0RzZEQSxJQUFJO2dCQUFFLENBQUM7Z0JBQzNGLEtBQUssQ0FBQzVCLEtBQUssQ0FBQ2lDLEdBQUcsQ0FBQyxDQUFVLFlBQUcxQixHQUFHLE1BMUdWLFFBQVcsZ0JBMEdlVyxPQUFPLEdBQUcxQixHQUFHO2dCQUM3RCxLQUFLLENBQUMwQyxZQUFZLEdBQUcsR0FBRyxDQUFDckIsSUFBSSxHQUFHQyxPQUFPLEtBQUtrQixVQUFVO2dCQUV0RDVCLEdBQUcsQ0FBQyxDQUFNLE9BQUUsQ0FBZSxnQkFBRSxDQUFDO29CQUM1QlQsR0FBRyxFQUFFUixHQUFHLENBQUNRLEdBQUc7b0JBQ1pnQixXQUFXLEVBQUVJLEtBQUssQ0FBQ0UsTUFBTTtvQkFDekJpQixZQUFZO2dCQUNkLENBQUM7WUFDSCxDQUFDO1FBQ0gsQ0FBQyxDQUFDLEtBQUssRUFBRUMsQ0FBQyxFQUFFLENBQUM7WUFDWCxLQUFLLENBQUNDLEtBQUssR0FBR0QsQ0FBQztZQUNmL0IsR0FBRyxDQUFDLENBQU8sUUFBRSxDQUFjLGVBQUUsQ0FBQztnQkFDNUJHLEdBQUc7Z0JBQ0g4QixZQUFZLEVBQUVELEtBQUssQ0FBQ0UsT0FBTztnQkFDM0JDLFVBQVUsRUFBRUgsS0FBSyxDQUFDSSxLQUFLO1lBQ3pCLENBQUM7UUFDSCxDQUFDLFFBQVMsQ0FBQztZQUNULEtBQUssS0E3SG9DLGFBQWlCLFNBNkg3Q2pDLEdBQUcsRUFBRVAsS0FBSztRQUN6QixDQUFDO0lBQ0gsQ0FBQztBQUNILENBQUM7ZUFFNkJoQixhQUFhLENBQUNvQyxJQUFjLEVBQUVxQixPQUFzQixFQUFFLENBQUM7SUFDbkYsS0FBSyxDQUFDckMsR0FBRyxHQUFHcUMsT0FBTyxDQUFDckMsR0FBRztJQUV2QkEsR0FBRyxDQUFDLENBQU0sT0FBRSxDQUF5QjtJQUVyQyxFQUFlLEFBQWYsYUFBZTtJQUNmLEtBQUssQ0FBQ2xCLElBQUksT0FuSTRDLE1BQVMsY0FtSXRDdUQsT0FBTztJQUVoQyxFQUFZLEFBQVosVUFBWTtJQUNaLEVBQUUsR0FBR3ZELElBQUksQ0FBQ3dELFlBQVksRUFBRSxDQUFDO1FBQ3ZCLEtBQUssQ0FBQyxDQUFDLENBQUNDLE9BQU8sRUFBQyxDQUFDLEdBQUdDLE9BQU8sQ0FBQyxDQUErQjtRQUMzRDFELElBQUksQ0FBQ3dELFlBQVksR0FBRyxHQUFHLENBQUNDLE9BQU87SUFDakMsQ0FBQztJQUNELEtBQUssQ0FBQ0UsT0FBTyxHQUFHM0QsSUFBSSxDQUFDd0QsWUFBWTtJQUNqQyxLQUFLLENBQUMxQyxLQUFLLEdBQUcsS0FBSyxDQUFDNkMsT0FBTyxDQUFDQyxJQUFJO0lBRWhDMUMsR0FBRyxDQUFDLENBQU0sT0FBRSxDQUF1QjtJQUNuQyxLQUFLLENBQUNILFFBQVEsT0FoSm1CLFNBQVk7SUFpSjdDLEtBQUssQ0FBQ0EsUUFBUSxDQUFDNkMsSUFBSSxDQUFDMUIsSUFBSTtJQUN4QixLQUFLLENBQUMyQixLQUFLLEdBQUcsS0FBSyxDQUFDSCxPQUFPLENBQUN4QixJQUFJLENBQUM0QixNQUFNLEVBQUVDLE9BQU8sQ0FBQzdCLElBQUk7SUFFckQsS0FBSyxDQUFDakIsT0FBTyxHQUFHLEdBQUcsQ0F0SjZCLFFBQVc7SUF3SjNELEVBQXdELEFBQXhELHNEQUF3RDtJQUN4RCxNQUFNLENBQUMsQ0FBQztRQUNOK0MsT0FBTyxFQUFFbkQsSUFBSSxDQUFDQyxLQUFLLEVBQUVkLElBQUksRUFBRWUsUUFBUSxFQUFFOEMsS0FBSyxFQUFFNUMsT0FBTyxFQUFFQyxHQUFHO1FBQ3hESixLQUFLO1FBQ0xtRCxLQUFLLFlBQWMsQ0FBQztZQUNsQmxELFFBQVEsQ0FBQ21ELElBQUk7WUFDYixLQUFLLENBQUNQLE9BQU8sQ0FBQ1EsUUFBUTtRQUN4QixDQUFDO0lBQ0gsQ0FBQztBQUNILENBQUMifQ==