"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = CachedHandler;
exports.tracer = void 0;
var _api = require("@opentelemetry/api");
var _zlib = require("zlib");
var _cacheManager = require("./cache-manager");
var _payload = require("./payload");
var _renderer = _interopRequireDefault(require("./renderer"));
var _utils = require("./utils");
function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const tracer = _api.trace.getTracer('next-boost');
exports.tracer = tracer;
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
 */ const wrap = (cache, conf, renderer, next)=>{
    return async (req, res, listenerSpan)=>{
        const serveSpan = tracer.startSpan('next-boost serve');
        var _url;
        // Generate the cache key and find the cache rules for it
        req.url = (0, _utils).filterUrl((_url = req.url) != null ? _url : '', conf.paramFilter);
        const key = conf.cacheKey ? conf.cacheKey(req) : req.url;
        const { matched , ttl  } = matchRules(conf, req);
        serveSpan.setAttributes({
            url: req.url,
            key,
            matched
        });
        listenerSpan.setAttributes({
            url: req.url,
            key,
            matched
        });
        // No cache rule was found, bypass caching
        if (!matched) {
            res.setHeader('x-next-boost-status', 'bypass');
            serveSpan.setAttribute('next-boost.status', 'bypass');
            listenerSpan.setAttribute('next-boost.status', 'bypass');
            serveSpan.end();
            return next(req, res);
        }
        // Lookup the key in the cache
        const cacheLookupSpan = tracer.startSpan('next-boost cacheLookup');
        const state = await _api.context.with(_api.trace.setSpan(_api.context.active(), cacheLookupSpan), ()=>{
            return (0, _cacheManager).serveCache(cache, key, false);
        });
        res.setHeader('x-next-boost-status', state.status);
        cacheLookupSpan.setAttribute('next-boost.status', state.status);
        serveSpan.setAttribute('next-boost.status', state.status);
        listenerSpan.setAttribute('next-boost.status', state.status);
        cacheLookupSpan.end();
        // If the cache is not missing, serve it
        if (state.status === 'stale' || state.status === 'hit' || state.status === 'fulfill') {
            (0, _cacheManager).send(state.payload, res);
            serveSpan.end();
            // Dont need to refresh the cache, we're done
            if (state.status !== 'stale') {
                return;
            }
        }
        // Refresh the cache (miss or stale)
        try {
            // Lock the cache
            const cacheLockSpan = tracer.startSpan('next-boost cacheLock');
            await _api.context.with(_api.trace.setSpan(_api.context.active(), cacheLockSpan), ()=>{
                return (0, _cacheManager).lock(key, cache);
            });
            cacheLockSpan.end();
            // Render the page
            const renderSpan = tracer.startSpan('next-boost render');
            const args = {
                path: req.url,
                headers: req.headers,
                method: req.method
            };
            const rv = await renderer.render(args);
            if (ttl && rv.statusCode === 200 && conf.cacheControl) {
                rv.headers['cache-control'] = conf.cacheControl(req, ttl);
            }
            // rv.body is a Buffer in JSON format: { type: 'Buffer', data: [...] }
            const body = Buffer.from(rv.body);
            renderSpan.setAttributes({
                'next.statusCode ': rv.statusCode
            });
            if (rv.statusCode >= 400) {
                renderSpan.setStatus({
                    code: _api.SpanStatusCode.ERROR
                });
            }
            renderSpan.end();
            // Serve the page if not yet served via cache
            if (state.status !== 'stale') {
                (0, _utils).serve(res, rv);
                serveSpan.end();
            }
            // Write the cache
            if (rv.statusCode === 200) {
                const cacheWriteSpan = tracer.startSpan('next-boost cacheWrite');
                await _api.context.with(_api.trace.setSpan(_api.context.active(), cacheWriteSpan), ()=>{
                    const payload = {
                        headers: rv.headers,
                        body: (0, _utils).isZipped(rv.headers) ? body : (0, _zlib).gzipSync(body)
                    };
                    return cache.set('payload:' + key, (0, _payload).encodePayload(payload), ttl);
                });
                cacheWriteSpan.end();
            }
        } catch (e) {
            const error = e;
            (0, _utils).log('error', 'Render error', {
                key,
                errorMessage: error.message,
                errorStack: error.stack
            });
            listenerSpan.recordException(error);
        } finally{
            // Unlock the cache
            const cacheUnlockSpan = tracer.startSpan('next-boost cacheUnlock');
            await _api.context.with(_api.trace.setSpan(_api.context.active(), cacheUnlockSpan), ()=>{
                return (0, _cacheManager).unlock(key, cache);
            });
            cacheUnlockSpan.end();
        }
    };
};
async function CachedHandler(args, options) {
    (0, _utils).log('info', 'Preparing cache adapter');
    // merge config
    const conf = (0, _utils).mergeConfig(options);
    // the cache
    if (!conf.cacheAdapter) {
        const { Adapter  } = require('@next-boost/hybrid-disk-cache');
        conf.cacheAdapter = new Adapter();
    }
    const adapter = conf.cacheAdapter;
    const cache = await adapter.init();
    (0, _utils).log('info', 'Initializing renderer');
    const renderer = (0, _renderer).default();
    await renderer.init(args);
    const plain = await require(args.script).default(args);
    const requestHandler = wrap(cache, conf, renderer, plain);
    const requestListener = async (req, res)=>{
        const listenerSpan = tracer.startSpan('next-boost listener');
        await _api.context.with(_api.trace.setSpan(_api.context.active(), listenerSpan), ()=>{
            return requestHandler(req, res, listenerSpan);
        });
        listenerSpan.end();
    };
    // init the child process for revalidate and cache purge
    return {
        handler: requestListener,
        cache,
        close: async ()=>{
            renderer.kill();
            await adapter.shutdown();
        }
    };
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9oYW5kbGVyLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGNvbnRleHQsIFNwYW5TdGF0dXNDb2RlLCB0cmFjZSB9IGZyb20gJ0BvcGVudGVsZW1ldHJ5L2FwaSdcbmltcG9ydCB7IEluY29taW5nTWVzc2FnZSwgU2VydmVyUmVzcG9uc2UgfSBmcm9tICdodHRwJ1xuaW1wb3J0IHsgZ3ppcFN5bmMgfSBmcm9tICd6bGliJ1xuaW1wb3J0IHsgbG9jaywgc2VuZCwgc2VydmVDYWNoZSwgdW5sb2NrIH0gZnJvbSAnLi9jYWNoZS1tYW5hZ2VyJ1xuaW1wb3J0IHsgZW5jb2RlUGF5bG9hZCB9IGZyb20gJy4vcGF5bG9hZCdcbmltcG9ydCBSZW5kZXJlciwgeyBJbml0QXJncyB9IGZyb20gJy4vcmVuZGVyZXInXG5pbXBvcnQgeyBDYWNoZUFkYXB0ZXIsIEhhbmRsZXJDb25maWcsIFdyYXBwZWRIYW5kbGVyIH0gZnJvbSAnLi90eXBlcydcbmltcG9ydCB7IGZpbHRlclVybCwgaXNaaXBwZWQsIGxvZywgbWVyZ2VDb25maWcsIHNlcnZlIH0gZnJvbSAnLi91dGlscydcblxuZXhwb3J0IGNvbnN0IHRyYWNlciA9IHRyYWNlLmdldFRyYWNlcignbmV4dC1ib29zdCcpXG5cbmZ1bmN0aW9uIG1hdGNoUnVsZXMoY29uZjogSGFuZGxlckNvbmZpZywgcmVxOiBJbmNvbWluZ01lc3NhZ2UpIHtcbiAgY29uc3QgZXJyID0gWydHRVQnLCAnSEVBRCddLmluZGV4T2YocmVxLm1ldGhvZCA/PyAnJykgPT09IC0xXG4gIGlmIChlcnIpIHJldHVybiB7IG1hdGNoZWQ6IGZhbHNlLCB0dGw6IC0xIH1cblxuICBpZiAodHlwZW9mIGNvbmYucnVsZXMgPT09ICdmdW5jdGlvbicpIHtcbiAgICBjb25zdCB0dGwgPSBjb25mLnJ1bGVzKHJlcSlcbiAgICBpZiAodHRsKSByZXR1cm4geyBtYXRjaGVkOiB0cnVlLCB0dGwgfVxuICB9IGVsc2Uge1xuICAgIGZvciAoY29uc3QgcnVsZSBvZiBjb25mLnJ1bGVzID8/IFtdKSB7XG4gICAgICBpZiAocmVxLnVybCAmJiBuZXcgUmVnRXhwKHJ1bGUucmVnZXgpLnRlc3QocmVxLnVybCkpIHtcbiAgICAgICAgcmV0dXJuIHsgbWF0Y2hlZDogdHJ1ZSwgdHRsOiBydWxlLnR0bCB9XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiB7IG1hdGNoZWQ6IGZhbHNlLCB0dGw6IDAgfVxufVxuXG4vKipcbiAqIFdyYXAgYSBodHRwIGxpc3RlbmVyIHRvIHNlcnZlIGNhY2hlZCByZXNwb25zZVxuICpcbiAqIEBwYXJhbSBjYWNoZSB0aGUgY2FjaGVcbiAqIEBwYXJhbSBjb25mIGNvbmYgb2YgbmV4dC1ib29zdFxuICogQHBhcmFtIHJlbmRlcmVyIHRoZSBTU1IgcmVuZGVyZXIgcnVucyBpbiB3b3JrZXIgdGhyZWFkXG4gKiBAcGFyYW0gbmV4dCBwYXNzLXRocm91Z2ggaGFuZGxlclxuICpcbiAqIEByZXR1cm5zIGEgcmVxdWVzdCBsaXN0ZW5lciB0byB1c2UgaW4gaHR0cCBzZXJ2ZXJcbiAqL1xuY29uc3Qgd3JhcDogV3JhcHBlZEhhbmRsZXIgPSAoY2FjaGUsIGNvbmYsIHJlbmRlcmVyLCBuZXh0KSA9PiB7XG4gIHJldHVybiBhc3luYyAocmVxLCByZXMsIGxpc3RlbmVyU3BhbikgPT4ge1xuICAgIGNvbnN0IHNlcnZlU3BhbiA9IHRyYWNlci5zdGFydFNwYW4oJ25leHQtYm9vc3Qgc2VydmUnKVxuXG4gICAgLy8gR2VuZXJhdGUgdGhlIGNhY2hlIGtleSBhbmQgZmluZCB0aGUgY2FjaGUgcnVsZXMgZm9yIGl0XG4gICAgcmVxLnVybCA9IGZpbHRlclVybChyZXEudXJsID8/ICcnLCBjb25mLnBhcmFtRmlsdGVyKVxuICAgIGNvbnN0IGtleSA9IGNvbmYuY2FjaGVLZXkgPyBjb25mLmNhY2hlS2V5KHJlcSkgOiByZXEudXJsXG4gICAgY29uc3QgeyBtYXRjaGVkLCB0dGwgfSA9IG1hdGNoUnVsZXMoY29uZiwgcmVxKVxuXG4gICAgc2VydmVTcGFuLnNldEF0dHJpYnV0ZXMoeyB1cmw6IHJlcS51cmwsIGtleSwgbWF0Y2hlZCB9KVxuICAgIGxpc3RlbmVyU3Bhbi5zZXRBdHRyaWJ1dGVzKHsgdXJsOiByZXEudXJsLCBrZXksIG1hdGNoZWQgfSlcblxuICAgIC8vIE5vIGNhY2hlIHJ1bGUgd2FzIGZvdW5kLCBieXBhc3MgY2FjaGluZ1xuICAgIGlmICghbWF0Y2hlZCkge1xuICAgICAgcmVzLnNldEhlYWRlcigneC1uZXh0LWJvb3N0LXN0YXR1cycsICdieXBhc3MnKVxuICAgICAgc2VydmVTcGFuLnNldEF0dHJpYnV0ZSgnbmV4dC1ib29zdC5zdGF0dXMnLCAnYnlwYXNzJylcbiAgICAgIGxpc3RlbmVyU3Bhbi5zZXRBdHRyaWJ1dGUoJ25leHQtYm9vc3Quc3RhdHVzJywgJ2J5cGFzcycpXG4gICAgICBzZXJ2ZVNwYW4uZW5kKClcbiAgICAgIHJldHVybiBuZXh0KHJlcSwgcmVzKVxuICAgIH1cblxuICAgIC8vIExvb2t1cCB0aGUga2V5IGluIHRoZSBjYWNoZVxuICAgIGNvbnN0IGNhY2hlTG9va3VwU3BhbiA9IHRyYWNlci5zdGFydFNwYW4oJ25leHQtYm9vc3QgY2FjaGVMb29rdXAnKVxuICAgIGNvbnN0IHN0YXRlID0gYXdhaXQgY29udGV4dC53aXRoKHRyYWNlLnNldFNwYW4oY29udGV4dC5hY3RpdmUoKSwgY2FjaGVMb29rdXBTcGFuKSwgKCkgPT4ge1xuICAgICAgcmV0dXJuIHNlcnZlQ2FjaGUoY2FjaGUsIGtleSwgZmFsc2UpXG4gICAgfSlcbiAgICByZXMuc2V0SGVhZGVyKCd4LW5leHQtYm9vc3Qtc3RhdHVzJywgc3RhdGUuc3RhdHVzKVxuICAgIGNhY2hlTG9va3VwU3Bhbi5zZXRBdHRyaWJ1dGUoJ25leHQtYm9vc3Quc3RhdHVzJywgc3RhdGUuc3RhdHVzKVxuICAgIHNlcnZlU3Bhbi5zZXRBdHRyaWJ1dGUoJ25leHQtYm9vc3Quc3RhdHVzJywgc3RhdGUuc3RhdHVzKVxuICAgIGxpc3RlbmVyU3Bhbi5zZXRBdHRyaWJ1dGUoJ25leHQtYm9vc3Quc3RhdHVzJywgc3RhdGUuc3RhdHVzKVxuICAgIGNhY2hlTG9va3VwU3Bhbi5lbmQoKVxuXG4gICAgLy8gSWYgdGhlIGNhY2hlIGlzIG5vdCBtaXNzaW5nLCBzZXJ2ZSBpdFxuICAgIGlmIChzdGF0ZS5zdGF0dXMgPT09ICdzdGFsZScgfHwgc3RhdGUuc3RhdHVzID09PSAnaGl0JyB8fCBzdGF0ZS5zdGF0dXMgPT09ICdmdWxmaWxsJykge1xuICAgICAgc2VuZChzdGF0ZS5wYXlsb2FkLCByZXMpXG4gICAgICBzZXJ2ZVNwYW4uZW5kKClcblxuICAgICAgLy8gRG9udCBuZWVkIHRvIHJlZnJlc2ggdGhlIGNhY2hlLCB3ZSdyZSBkb25lXG4gICAgICBpZiAoc3RhdGUuc3RhdHVzICE9PSAnc3RhbGUnKSB7XG4gICAgICAgIHJldHVyblxuICAgICAgfVxuICAgIH1cblxuICAgIC8vIFJlZnJlc2ggdGhlIGNhY2hlIChtaXNzIG9yIHN0YWxlKVxuICAgIHRyeSB7XG4gICAgICAvLyBMb2NrIHRoZSBjYWNoZVxuICAgICAgY29uc3QgY2FjaGVMb2NrU3BhbiA9IHRyYWNlci5zdGFydFNwYW4oJ25leHQtYm9vc3QgY2FjaGVMb2NrJylcbiAgICAgIGF3YWl0IGNvbnRleHQud2l0aCh0cmFjZS5zZXRTcGFuKGNvbnRleHQuYWN0aXZlKCksIGNhY2hlTG9ja1NwYW4pLCAoKSA9PiB7XG4gICAgICAgIHJldHVybiBsb2NrKGtleSwgY2FjaGUpXG4gICAgICB9KVxuICAgICAgY2FjaGVMb2NrU3Bhbi5lbmQoKVxuXG4gICAgICAvLyBSZW5kZXIgdGhlIHBhZ2VcbiAgICAgIGNvbnN0IHJlbmRlclNwYW4gPSB0cmFjZXIuc3RhcnRTcGFuKCduZXh0LWJvb3N0IHJlbmRlcicpXG4gICAgICBjb25zdCBhcmdzID0geyBwYXRoOiByZXEudXJsLCBoZWFkZXJzOiByZXEuaGVhZGVycywgbWV0aG9kOiByZXEubWV0aG9kIH1cbiAgICAgIGNvbnN0IHJ2ID0gYXdhaXQgcmVuZGVyZXIucmVuZGVyKGFyZ3MpXG4gICAgICBpZiAodHRsICYmIHJ2LnN0YXR1c0NvZGUgPT09IDIwMCAmJiBjb25mLmNhY2hlQ29udHJvbCkge1xuICAgICAgICBydi5oZWFkZXJzWydjYWNoZS1jb250cm9sJ10gPSBjb25mLmNhY2hlQ29udHJvbChyZXEsIHR0bClcbiAgICAgIH1cbiAgICAgIC8vIHJ2LmJvZHkgaXMgYSBCdWZmZXIgaW4gSlNPTiBmb3JtYXQ6IHsgdHlwZTogJ0J1ZmZlcicsIGRhdGE6IFsuLi5dIH1cbiAgICAgIGNvbnN0IGJvZHkgPSBCdWZmZXIuZnJvbShydi5ib2R5KVxuICAgICAgcmVuZGVyU3Bhbi5zZXRBdHRyaWJ1dGVzKHsgJ25leHQuc3RhdHVzQ29kZSAnOiBydi5zdGF0dXNDb2RlIH0pXG4gICAgICBpZiAocnYuc3RhdHVzQ29kZSA+PSA0MDApIHtcbiAgICAgICAgcmVuZGVyU3Bhbi5zZXRTdGF0dXMoeyBjb2RlOiBTcGFuU3RhdHVzQ29kZS5FUlJPUiB9KVxuICAgICAgfVxuICAgICAgcmVuZGVyU3Bhbi5lbmQoKVxuXG4gICAgICAvLyBTZXJ2ZSB0aGUgcGFnZSBpZiBub3QgeWV0IHNlcnZlZCB2aWEgY2FjaGVcbiAgICAgIGlmIChzdGF0ZS5zdGF0dXMgIT09ICdzdGFsZScpIHtcbiAgICAgICAgc2VydmUocmVzLCBydilcbiAgICAgICAgc2VydmVTcGFuLmVuZCgpXG4gICAgICB9XG5cbiAgICAgIC8vIFdyaXRlIHRoZSBjYWNoZVxuICAgICAgaWYgKHJ2LnN0YXR1c0NvZGUgPT09IDIwMCkge1xuICAgICAgICBjb25zdCBjYWNoZVdyaXRlU3BhbiA9IHRyYWNlci5zdGFydFNwYW4oJ25leHQtYm9vc3QgY2FjaGVXcml0ZScpXG4gICAgICAgIGF3YWl0IGNvbnRleHQud2l0aCh0cmFjZS5zZXRTcGFuKGNvbnRleHQuYWN0aXZlKCksIGNhY2hlV3JpdGVTcGFuKSwgKCkgPT4ge1xuICAgICAgICAgIGNvbnN0IHBheWxvYWQgPSB7XG4gICAgICAgICAgICBoZWFkZXJzOiBydi5oZWFkZXJzLFxuICAgICAgICAgICAgYm9keTogaXNaaXBwZWQocnYuaGVhZGVycykgPyBib2R5IDogZ3ppcFN5bmMoYm9keSksXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIGNhY2hlLnNldCgncGF5bG9hZDonICsga2V5LCBlbmNvZGVQYXlsb2FkKHBheWxvYWQpLCB0dGwpXG4gICAgICAgIH0pXG4gICAgICAgIGNhY2hlV3JpdGVTcGFuLmVuZCgpXG4gICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgY29uc3QgZXJyb3IgPSBlIGFzIEVycm9yXG4gICAgICBsb2coJ2Vycm9yJywgJ1JlbmRlciBlcnJvcicsIHtcbiAgICAgICAga2V5LFxuICAgICAgICBlcnJvck1lc3NhZ2U6IGVycm9yLm1lc3NhZ2UsXG4gICAgICAgIGVycm9yU3RhY2s6IGVycm9yLnN0YWNrLFxuICAgICAgfSlcbiAgICAgIGxpc3RlbmVyU3Bhbi5yZWNvcmRFeGNlcHRpb24oZXJyb3IpXG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIC8vIFVubG9jayB0aGUgY2FjaGVcbiAgICAgIGNvbnN0IGNhY2hlVW5sb2NrU3BhbiA9IHRyYWNlci5zdGFydFNwYW4oJ25leHQtYm9vc3QgY2FjaGVVbmxvY2snKVxuICAgICAgYXdhaXQgY29udGV4dC53aXRoKHRyYWNlLnNldFNwYW4oY29udGV4dC5hY3RpdmUoKSwgY2FjaGVVbmxvY2tTcGFuKSwgKCkgPT4ge1xuICAgICAgICByZXR1cm4gdW5sb2NrKGtleSwgY2FjaGUpXG4gICAgICB9KVxuICAgICAgY2FjaGVVbmxvY2tTcGFuLmVuZCgpXG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IGFzeW5jIGZ1bmN0aW9uIENhY2hlZEhhbmRsZXIoYXJnczogSW5pdEFyZ3MsIG9wdGlvbnM/OiBIYW5kbGVyQ29uZmlnKSB7XG4gIGxvZygnaW5mbycsICdQcmVwYXJpbmcgY2FjaGUgYWRhcHRlcicpXG5cbiAgLy8gbWVyZ2UgY29uZmlnXG4gIGNvbnN0IGNvbmYgPSBtZXJnZUNvbmZpZyhvcHRpb25zKVxuXG4gIC8vIHRoZSBjYWNoZVxuICBpZiAoIWNvbmYuY2FjaGVBZGFwdGVyKSB7XG4gICAgY29uc3QgeyBBZGFwdGVyIH0gPSByZXF1aXJlKCdAbmV4dC1ib29zdC9oeWJyaWQtZGlzay1jYWNoZScpXG4gICAgY29uZi5jYWNoZUFkYXB0ZXIgPSBuZXcgQWRhcHRlcigpIGFzIENhY2hlQWRhcHRlclxuICB9XG4gIGNvbnN0IGFkYXB0ZXIgPSBjb25mLmNhY2hlQWRhcHRlclxuICBjb25zdCBjYWNoZSA9IGF3YWl0IGFkYXB0ZXIuaW5pdCgpXG5cbiAgbG9nKCdpbmZvJywgJ0luaXRpYWxpemluZyByZW5kZXJlcicpXG4gIGNvbnN0IHJlbmRlcmVyID0gUmVuZGVyZXIoKVxuICBhd2FpdCByZW5kZXJlci5pbml0KGFyZ3MpXG4gIGNvbnN0IHBsYWluID0gYXdhaXQgcmVxdWlyZShhcmdzLnNjcmlwdCkuZGVmYXVsdChhcmdzKVxuXG4gIGNvbnN0IHJlcXVlc3RIYW5kbGVyID0gd3JhcChjYWNoZSwgY29uZiwgcmVuZGVyZXIsIHBsYWluKVxuICBjb25zdCByZXF1ZXN0TGlzdGVuZXIgPSBhc3luYyAocmVxOiBJbmNvbWluZ01lc3NhZ2UsIHJlczogU2VydmVyUmVzcG9uc2UpID0+IHtcbiAgICBjb25zdCBsaXN0ZW5lclNwYW4gPSB0cmFjZXIuc3RhcnRTcGFuKCduZXh0LWJvb3N0IGxpc3RlbmVyJylcblxuICAgIGF3YWl0IGNvbnRleHQud2l0aCh0cmFjZS5zZXRTcGFuKGNvbnRleHQuYWN0aXZlKCksIGxpc3RlbmVyU3BhbiksICgpID0+IHtcbiAgICAgIHJldHVybiByZXF1ZXN0SGFuZGxlcihyZXEsIHJlcywgbGlzdGVuZXJTcGFuKVxuICAgIH0pXG5cbiAgICBsaXN0ZW5lclNwYW4uZW5kKClcbiAgfVxuXG4gIC8vIGluaXQgdGhlIGNoaWxkIHByb2Nlc3MgZm9yIHJldmFsaWRhdGUgYW5kIGNhY2hlIHB1cmdlXG4gIHJldHVybiB7XG4gICAgaGFuZGxlcjogcmVxdWVzdExpc3RlbmVyLFxuICAgIGNhY2hlLFxuICAgIGNsb3NlOiBhc3luYyAoKSA9PiB7XG4gICAgICByZW5kZXJlci5raWxsKClcbiAgICAgIGF3YWl0IGFkYXB0ZXIuc2h1dGRvd24oKVxuICAgIH0sXG4gIH1cbn1cbiJdLCJuYW1lcyI6WyJDYWNoZWRIYW5kbGVyIiwidHJhY2VyIiwiZ2V0VHJhY2VyIiwibWF0Y2hSdWxlcyIsImNvbmYiLCJyZXEiLCJlcnIiLCJpbmRleE9mIiwibWV0aG9kIiwibWF0Y2hlZCIsInR0bCIsInJ1bGVzIiwicnVsZSIsInVybCIsIlJlZ0V4cCIsInJlZ2V4IiwidGVzdCIsIndyYXAiLCJjYWNoZSIsInJlbmRlcmVyIiwibmV4dCIsInJlcyIsImxpc3RlbmVyU3BhbiIsInNlcnZlU3BhbiIsInN0YXJ0U3BhbiIsInBhcmFtRmlsdGVyIiwia2V5IiwiY2FjaGVLZXkiLCJzZXRBdHRyaWJ1dGVzIiwic2V0SGVhZGVyIiwic2V0QXR0cmlidXRlIiwiZW5kIiwiY2FjaGVMb29rdXBTcGFuIiwic3RhdGUiLCJ3aXRoIiwic2V0U3BhbiIsImFjdGl2ZSIsInN0YXR1cyIsInBheWxvYWQiLCJjYWNoZUxvY2tTcGFuIiwicmVuZGVyU3BhbiIsImFyZ3MiLCJwYXRoIiwiaGVhZGVycyIsInJ2IiwicmVuZGVyIiwic3RhdHVzQ29kZSIsImNhY2hlQ29udHJvbCIsImJvZHkiLCJCdWZmZXIiLCJmcm9tIiwic2V0U3RhdHVzIiwiY29kZSIsIkVSUk9SIiwiY2FjaGVXcml0ZVNwYW4iLCJzZXQiLCJlIiwiZXJyb3IiLCJlcnJvck1lc3NhZ2UiLCJtZXNzYWdlIiwiZXJyb3JTdGFjayIsInN0YWNrIiwicmVjb3JkRXhjZXB0aW9uIiwiY2FjaGVVbmxvY2tTcGFuIiwib3B0aW9ucyIsImNhY2hlQWRhcHRlciIsIkFkYXB0ZXIiLCJyZXF1aXJlIiwiYWRhcHRlciIsImluaXQiLCJwbGFpbiIsInNjcmlwdCIsImRlZmF1bHQiLCJyZXF1ZXN0SGFuZGxlciIsInJlcXVlc3RM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