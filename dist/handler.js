"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = CachedHandler;
var _api = require("@opentelemetry/api");
var _zlib = require("zlib");
var _cacheManager = require("./cache-manager");
var _payload = require("./payload");
var _renderer = _interopRequireDefault(require("./renderer"));
var _utils = require("./utils");
var _sdkMetricsBase = require("@opentelemetry/sdk-metrics-base");
function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const tracer = _api.trace.getTracer('next-boost');
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
    return async (req, res, handlerSpan, counters)=>{
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
        handlerSpan.setAttributes({
            url: req.url,
            key,
            matched
        });
        // No cache rule was found, bypass caching
        if (!matched) {
            res.setHeader('x-next-boost-status', 'bypass');
            counters.request.add(1, {
                url: req.url,
                'next-boost.status': 'bypass'
            });
            serveSpan.setAttribute('next-boost.status', 'bypass');
            handlerSpan.setAttribute('next-boost.status', 'bypass');
            serveSpan.end();
            return next(req, res);
        }
        // Lookup the key in the cache
        const cacheLookupSpan = tracer.startSpan('next-boost cacheLookup');
        const state = await _api.context.with(_api.trace.setSpan(_api.context.active(), cacheLookupSpan), ()=>{
            return (0, _cacheManager).serveCache(cache, key, false);
        });
        res.setHeader('x-next-boost-status', state.status);
        counters.request.add(1, {
            url: req.url,
            'next-boost.status': state.status
        });
        cacheLookupSpan.setAttribute('next-boost.status', state.status);
        serveSpan.setAttribute('next-boost.status', state.status);
        handlerSpan.setAttribute('next-boost.status', state.status);
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
            counters.pendingRenders.add(1);
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
            counters.pendingRenders.add(-1);
            counters.renders.add(1, {
                'next.statusCode': rv.statusCode.toString()
            });
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
            handlerSpan.recordException(error);
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
    var ref, ref1;
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
    const meterProvider = new _sdkMetricsBase.MeterProvider({
        exporter: options == null ? void 0 : (ref = options.openTelemetryConfig) == null ? void 0 : ref.metricExporter,
        interval: options == null ? void 0 : (ref1 = options.openTelemetryConfig) == null ? void 0 : ref1.metricInterval
    });
    const meter = meterProvider.getMeter('default');
    const counters = {
        request: meter.createCounter('next_boost_requests', {
            description: 'Amount of requests handled by next-boost'
        }),
        renders: meter.createCounter('next_boost_renders', {
            description: 'Amount of requests rendered by next-boost'
        }),
        pendingRenders: meter.createUpDownCounter('next_boost_pending_renders', {
            description: 'Amount of requests currently being rendered by next-boost'
        })
    };
    const requestHandler = wrap(cache, conf, renderer, plain);
    const requestListener = async (req, res)=>{
        const handlerSpan = tracer.startSpan('next-boost handler');
        await _api.context.with(_api.trace.setSpan(_api.context.active(), handlerSpan), ()=>{
            return requestHandler(req, res, handlerSpan, counters);
        });
        handlerSpan.end();
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9oYW5kbGVyLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGNvbnRleHQsIFNwYW5TdGF0dXNDb2RlLCB0cmFjZSB9IGZyb20gJ0BvcGVudGVsZW1ldHJ5L2FwaSdcbmltcG9ydCB7IEluY29taW5nTWVzc2FnZSwgU2VydmVyUmVzcG9uc2UgfSBmcm9tICdodHRwJ1xuaW1wb3J0IHsgZ3ppcFN5bmMgfSBmcm9tICd6bGliJ1xuaW1wb3J0IHsgbG9jaywgc2VuZCwgc2VydmVDYWNoZSwgdW5sb2NrIH0gZnJvbSAnLi9jYWNoZS1tYW5hZ2VyJ1xuaW1wb3J0IHsgZW5jb2RlUGF5bG9hZCB9IGZyb20gJy4vcGF5bG9hZCdcbmltcG9ydCBSZW5kZXJlciwgeyBJbml0QXJncyB9IGZyb20gJy4vcmVuZGVyZXInXG5pbXBvcnQgeyBDYWNoZUFkYXB0ZXIsIEhhbmRsZXJDb25maWcsIFdyYXBwZWRIYW5kbGVyIH0gZnJvbSAnLi90eXBlcydcbmltcG9ydCB7IGZpbHRlclVybCwgaXNaaXBwZWQsIGxvZywgbWVyZ2VDb25maWcsIHNlcnZlIH0gZnJvbSAnLi91dGlscydcbmltcG9ydCB7IE1ldGVyUHJvdmlkZXIgfSBmcm9tICdAb3BlbnRlbGVtZXRyeS9zZGstbWV0cmljcy1iYXNlJ1xuXG5jb25zdCB0cmFjZXIgPSB0cmFjZS5nZXRUcmFjZXIoJ25leHQtYm9vc3QnKVxuXG5mdW5jdGlvbiBtYXRjaFJ1bGVzKGNvbmY6IEhhbmRsZXJDb25maWcsIHJlcTogSW5jb21pbmdNZXNzYWdlKSB7XG4gIGNvbnN0IGVyciA9IFsnR0VUJywgJ0hFQUQnXS5pbmRleE9mKHJlcS5tZXRob2QgPz8gJycpID09PSAtMVxuICBpZiAoZXJyKSByZXR1cm4geyBtYXRjaGVkOiBmYWxzZSwgdHRsOiAtMSB9XG5cbiAgaWYgKHR5cGVvZiBjb25mLnJ1bGVzID09PSAnZnVuY3Rpb24nKSB7XG4gICAgY29uc3QgdHRsID0gY29uZi5ydWxlcyhyZXEpXG4gICAgaWYgKHR0bCkgcmV0dXJuIHsgbWF0Y2hlZDogdHJ1ZSwgdHRsIH1cbiAgfSBlbHNlIHtcbiAgICBmb3IgKGNvbnN0IHJ1bGUgb2YgY29uZi5ydWxlcyA/PyBbXSkge1xuICAgICAgaWYgKHJlcS51cmwgJiYgbmV3IFJlZ0V4cChydWxlLnJlZ2V4KS50ZXN0KHJlcS51cmwpKSB7XG4gICAgICAgIHJldHVybiB7IG1hdGNoZWQ6IHRydWUsIHR0bDogcnVsZS50dGwgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4geyBtYXRjaGVkOiBmYWxzZSwgdHRsOiAwIH1cbn1cblxuLyoqXG4gKiBXcmFwIGEgaHR0cCBsaXN0ZW5lciB0byBzZXJ2ZSBjYWNoZWQgcmVzcG9uc2VcbiAqXG4gKiBAcGFyYW0gY2FjaGUgdGhlIGNhY2hlXG4gKiBAcGFyYW0gY29uZiBjb25mIG9mIG5leHQtYm9vc3RcbiAqIEBwYXJhbSByZW5kZXJlciB0aGUgU1NSIHJlbmRlcmVyIHJ1bnMgaW4gd29ya2VyIHRocmVhZFxuICogQHBhcmFtIG5leHQgcGFzcy10aHJvdWdoIGhhbmRsZXJcbiAqXG4gKiBAcmV0dXJucyBhIHJlcXVlc3QgbGlzdGVuZXIgdG8gdXNlIGluIGh0dHAgc2VydmVyXG4gKi9cbmNvbnN0IHdyYXA6IFdyYXBwZWRIYW5kbGVyID0gKGNhY2hlLCBjb25mLCByZW5kZXJlciwgbmV4dCkgPT4ge1xuICByZXR1cm4gYXN5bmMgKHJlcSwgcmVzLCBoYW5kbGVyU3BhbiwgY291bnRlcnMpID0+IHtcbiAgICBjb25zdCBzZXJ2ZVNwYW4gPSB0cmFjZXIuc3RhcnRTcGFuKCduZXh0LWJvb3N0IHNlcnZlJylcblxuICAgIC8vIEdlbmVyYXRlIHRoZSBjYWNoZSBrZXkgYW5kIGZpbmQgdGhlIGNhY2hlIHJ1bGVzIGZvciBpdFxuICAgIHJlcS51cmwgPSBmaWx0ZXJVcmwocmVxLnVybCA/PyAnJywgY29uZi5wYXJhbUZpbHRlcilcbiAgICBjb25zdCBrZXkgPSBjb25mLmNhY2hlS2V5ID8gY29uZi5jYWNoZUtleShyZXEpIDogcmVxLnVybFxuICAgIGNvbnN0IHsgbWF0Y2hlZCwgdHRsIH0gPSBtYXRjaFJ1bGVzKGNvbmYsIHJlcSlcblxuICAgIHNlcnZlU3Bhbi5zZXRBdHRyaWJ1dGVzKHsgdXJsOiByZXEudXJsLCBrZXksIG1hdGNoZWQgfSlcbiAgICBoYW5kbGVyU3Bhbi5zZXRBdHRyaWJ1dGVzKHsgdXJsOiByZXEudXJsLCBrZXksIG1hdGNoZWQgfSlcblxuICAgIC8vIE5vIGNhY2hlIHJ1bGUgd2FzIGZvdW5kLCBieXBhc3MgY2FjaGluZ1xuICAgIGlmICghbWF0Y2hlZCkge1xuICAgICAgcmVzLnNldEhlYWRlcigneC1uZXh0LWJvb3N0LXN0YXR1cycsICdieXBhc3MnKVxuICAgICAgY291bnRlcnMucmVxdWVzdC5hZGQoMSwgeyB1cmw6IHJlcS51cmwsICduZXh0LWJvb3N0LnN0YXR1cyc6ICdieXBhc3MnIH0pXG4gICAgICBzZXJ2ZVNwYW4uc2V0QXR0cmlidXRlKCduZXh0LWJvb3N0LnN0YXR1cycsICdieXBhc3MnKVxuICAgICAgaGFuZGxlclNwYW4uc2V0QXR0cmlidXRlKCduZXh0LWJvb3N0LnN0YXR1cycsICdieXBhc3MnKVxuICAgICAgc2VydmVTcGFuLmVuZCgpXG4gICAgICByZXR1cm4gbmV4dChyZXEsIHJlcylcbiAgICB9XG5cbiAgICAvLyBMb29rdXAgdGhlIGtleSBpbiB0aGUgY2FjaGVcbiAgICBjb25zdCBjYWNoZUxvb2t1cFNwYW4gPSB0cmFjZXIuc3RhcnRTcGFuKCduZXh0LWJvb3N0IGNhY2hlTG9va3VwJylcbiAgICBjb25zdCBzdGF0ZSA9IGF3YWl0IGNvbnRleHQud2l0aCh0cmFjZS5zZXRTcGFuKGNvbnRleHQuYWN0aXZlKCksIGNhY2hlTG9va3VwU3BhbiksICgpID0+IHtcbiAgICAgIHJldHVybiBzZXJ2ZUNhY2hlKGNhY2hlLCBrZXksIGZhbHNlKVxuICAgIH0pXG4gICAgcmVzLnNldEhlYWRlcigneC1uZXh0LWJvb3N0LXN0YXR1cycsIHN0YXRlLnN0YXR1cylcbiAgICBjb3VudGVycy5yZXF1ZXN0LmFkZCgxLCB7IHVybDogcmVxLnVybCwgJ25leHQtYm9vc3Quc3RhdHVzJzogc3RhdGUuc3RhdHVzIH0pXG4gICAgY2FjaGVMb29rdXBTcGFuLnNldEF0dHJpYnV0ZSgnbmV4dC1ib29zdC5zdGF0dXMnLCBzdGF0ZS5zdGF0dXMpXG4gICAgc2VydmVTcGFuLnNldEF0dHJpYnV0ZSgnbmV4dC1ib29zdC5zdGF0dXMnLCBzdGF0ZS5zdGF0dXMpXG4gICAgaGFuZGxlclNwYW4uc2V0QXR0cmlidXRlKCduZXh0LWJvb3N0LnN0YXR1cycsIHN0YXRlLnN0YXR1cylcbiAgICBjYWNoZUxvb2t1cFNwYW4uZW5kKClcblxuICAgIC8vIElmIHRoZSBjYWNoZSBpcyBub3QgbWlzc2luZywgc2VydmUgaXRcbiAgICBpZiAoc3RhdGUuc3RhdHVzID09PSAnc3RhbGUnIHx8IHN0YXRlLnN0YXR1cyA9PT0gJ2hpdCcgfHwgc3RhdGUuc3RhdHVzID09PSAnZnVsZmlsbCcpIHtcbiAgICAgIHNlbmQoc3RhdGUucGF5bG9hZCwgcmVzKVxuICAgICAgc2VydmVTcGFuLmVuZCgpXG5cbiAgICAgIC8vIERvbnQgbmVlZCB0byByZWZyZXNoIHRoZSBjYWNoZSwgd2UncmUgZG9uZVxuICAgICAgaWYgKHN0YXRlLnN0YXR1cyAhPT0gJ3N0YWxlJykge1xuICAgICAgICByZXR1cm5cbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBSZWZyZXNoIHRoZSBjYWNoZSAobWlzcyBvciBzdGFsZSlcbiAgICB0cnkge1xuICAgICAgLy8gTG9jayB0aGUgY2FjaGVcbiAgICAgIGNvbnN0IGNhY2hlTG9ja1NwYW4gPSB0cmFjZXIuc3RhcnRTcGFuKCduZXh0LWJvb3N0IGNhY2hlTG9jaycpXG4gICAgICBhd2FpdCBjb250ZXh0LndpdGgodHJhY2Uuc2V0U3Bhbihjb250ZXh0LmFjdGl2ZSgpLCBjYWNoZUxvY2tTcGFuKSwgKCkgPT4ge1xuICAgICAgICByZXR1cm4gbG9jayhrZXksIGNhY2hlKVxuICAgICAgfSlcbiAgICAgIGNhY2hlTG9ja1NwYW4uZW5kKClcblxuICAgICAgLy8gUmVuZGVyIHRoZSBwYWdlXG4gICAgICBjb25zdCByZW5kZXJTcGFuID0gdHJhY2VyLnN0YXJ0U3BhbignbmV4dC1ib29zdCByZW5kZXInKVxuICAgICAgY291bnRlcnMucGVuZGluZ1JlbmRlcnMuYWRkKDEpXG4gICAgICBjb25zdCBhcmdzID0geyBwYXRoOiByZXEudXJsLCBoZWFkZXJzOiByZXEuaGVhZGVycywgbWV0aG9kOiByZXEubWV0aG9kIH1cbiAgICAgIGNvbnN0IHJ2ID0gYXdhaXQgcmVuZGVyZXIucmVuZGVyKGFyZ3MpXG4gICAgICBpZiAodHRsICYmIHJ2LnN0YXR1c0NvZGUgPT09IDIwMCAmJiBjb25mLmNhY2hlQ29udHJvbCkge1xuICAgICAgICBydi5oZWFkZXJzWydjYWNoZS1jb250cm9sJ10gPSBjb25mLmNhY2hlQ29udHJvbChyZXEsIHR0bClcbiAgICAgIH1cbiAgICAgIC8vIHJ2LmJvZHkgaXMgYSBCdWZmZXIgaW4gSlNPTiBmb3JtYXQ6IHsgdHlwZTogJ0J1ZmZlcicsIGRhdGE6IFsuLi5dIH1cbiAgICAgIGNvbnN0IGJvZHkgPSBCdWZmZXIuZnJvbShydi5ib2R5KVxuICAgICAgY291bnRlcnMucGVuZGluZ1JlbmRlcnMuYWRkKC0xKVxuICAgICAgY291bnRlcnMucmVuZGVycy5hZGQoMSwgeyAnbmV4dC5zdGF0dXNDb2RlJzogcnYuc3RhdHVzQ29kZS50b1N0cmluZygpIH0pXG4gICAgICByZW5kZXJTcGFuLnNldEF0dHJpYnV0ZXMoeyAnbmV4dC5zdGF0dXNDb2RlICc6IHJ2LnN0YXR1c0NvZGUgfSlcbiAgICAgIGlmIChydi5zdGF0dXNDb2RlID49IDQwMCkge1xuICAgICAgICByZW5kZXJTcGFuLnNldFN0YXR1cyh7IGNvZGU6IFNwYW5TdGF0dXNDb2RlLkVSUk9SIH0pXG4gICAgICB9XG4gICAgICByZW5kZXJTcGFuLmVuZCgpXG5cbiAgICAgIC8vIFNlcnZlIHRoZSBwYWdlIGlmIG5vdCB5ZXQgc2VydmVkIHZpYSBjYWNoZVxuICAgICAgaWYgKHN0YXRlLnN0YXR1cyAhPT0gJ3N0YWxlJykge1xuICAgICAgICBzZXJ2ZShyZXMsIHJ2KVxuICAgICAgICBzZXJ2ZVNwYW4uZW5kKClcbiAgICAgIH1cblxuICAgICAgLy8gV3JpdGUgdGhlIGNhY2hlXG4gICAgICBpZiAocnYuc3RhdHVzQ29kZSA9PT0gMjAwKSB7XG4gICAgICAgIGNvbnN0IGNhY2hlV3JpdGVTcGFuID0gdHJhY2VyLnN0YXJ0U3BhbignbmV4dC1ib29zdCBjYWNoZVdyaXRlJylcbiAgICAgICAgYXdhaXQgY29udGV4dC53aXRoKHRyYWNlLnNldFNwYW4oY29udGV4dC5hY3RpdmUoKSwgY2FjaGVXcml0ZVNwYW4pLCAoKSA9PiB7XG4gICAgICAgICAgY29uc3QgcGF5bG9hZCA9IHtcbiAgICAgICAgICAgIGhlYWRlcnM6IHJ2LmhlYWRlcnMsXG4gICAgICAgICAgICBib2R5OiBpc1ppcHBlZChydi5oZWFkZXJzKSA/IGJvZHkgOiBnemlwU3luYyhib2R5KSxcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm4gY2FjaGUuc2V0KCdwYXlsb2FkOicgKyBrZXksIGVuY29kZVBheWxvYWQocGF5bG9hZCksIHR0bClcbiAgICAgICAgfSlcbiAgICAgICAgY2FjaGVXcml0ZVNwYW4uZW5kKClcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBjb25zdCBlcnJvciA9IGUgYXMgRXJyb3JcbiAgICAgIGxvZygnZXJyb3InLCAnUmVuZGVyIGVycm9yJywge1xuICAgICAgICBrZXksXG4gICAgICAgIGVycm9yTWVzc2FnZTogZXJyb3IubWVzc2FnZSxcbiAgICAgICAgZXJyb3JTdGFjazogZXJyb3Iuc3RhY2ssXG4gICAgICB9KVxuICAgICAgaGFuZGxlclNwYW4ucmVjb3JkRXhjZXB0aW9uKGVycm9yKVxuICAgIH0gZmluYWxseSB7XG4gICAgICAvLyBVbmxvY2sgdGhlIGNhY2hlXG4gICAgICBjb25zdCBjYWNoZVVubG9ja1NwYW4gPSB0cmFjZXIuc3RhcnRTcGFuKCduZXh0LWJvb3N0IGNhY2hlVW5sb2NrJylcbiAgICAgIGF3YWl0IGNvbnRleHQud2l0aCh0cmFjZS5zZXRTcGFuKGNvbnRleHQuYWN0aXZlKCksIGNhY2hlVW5sb2NrU3BhbiksICgpID0+IHtcbiAgICAgICAgcmV0dXJuIHVubG9jayhrZXksIGNhY2hlKVxuICAgICAgfSlcbiAgICAgIGNhY2hlVW5sb2NrU3Bhbi5lbmQoKVxuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBhc3luYyBmdW5jdGlvbiBDYWNoZWRIYW5kbGVyKGFyZ3M6IEluaXRBcmdzLCBvcHRpb25zPzogSGFuZGxlckNvbmZpZykge1xuICBsb2coJ2luZm8nLCAnUHJlcGFyaW5nIGNhY2hlIGFkYXB0ZXInKVxuXG4gIC8vIG1lcmdlIGNvbmZpZ1xuICBjb25zdCBjb25mID0gbWVyZ2VDb25maWcob3B0aW9ucylcblxuICAvLyB0aGUgY2FjaGVcbiAgaWYgKCFjb25mLmNhY2hlQWRhcHRlcikge1xuICAgIGNvbnN0IHsgQWRhcHRlciB9ID0gcmVxdWlyZSgnQG5leHQtYm9vc3QvaHlicmlkLWRpc2stY2FjaGUnKVxuICAgIGNvbmYuY2FjaGVBZGFwdGVyID0gbmV3IEFkYXB0ZXIoKSBhcyBDYWNoZUFkYXB0ZXJcbiAgfVxuICBjb25zdCBhZGFwdGVyID0gY29uZi5jYWNoZUFkYXB0ZXJcbiAgY29uc3QgY2FjaGUgPSBhd2FpdCBhZGFwdGVyLmluaXQoKVxuXG4gIGxvZygnaW5mbycsICdJbml0aWFsaXppbmcgcmVuZGVyZXInKVxuICBjb25zdCByZW5kZXJlciA9IFJlbmRlcmVyKClcbiAgYXdhaXQgcmVuZGVyZXIuaW5pdChhcmdzKVxuICBjb25zdCBwbGFpbiA9IGF3YWl0IHJlcXVpcmUoYXJncy5zY3JpcHQpLmRlZmF1bHQoYXJncylcblxuICBjb25zdCBtZXRlclByb3ZpZGVyID0gbmV3IE1ldGVyUHJvdmlkZXIoe1xuICAgIGV4cG9ydGVyOiBvcHRpb25zPy5vcGVuVGVsZW1ldHJ5Q29uZmlnPy5tZXRyaWNFeHBvcnRlcixcbiAgICBpbnRlcnZhbDogb3B0aW9ucz8ub3BlblRlbGVtZXRyeUNvbmZpZz8ubWV0cmljSW50ZXJ2YWwsXG4gIH0pXG5cbiAgY29uc3QgbWV0ZXIgPSBtZXRlclByb3ZpZGVyLmdldE1ldGVyKCdkZWZhdWx0JylcblxuICBjb25zdCBjb3VudGVycyA9IHtcbiAgICByZXF1ZXN0OiBtZXRlci5jcmVhdGVDb3VudGVyKCduZXh0X2Jvb3N0X3JlcXVlc3RzJywge1xuICAgICAgZGVzY3JpcHRpb246ICdBbW91bnQgb2YgcmVxdWVzdHMgaGFuZGxlZCBieSBuZXh0LWJvb3N0JyxcbiAgICB9KSxcbiAgICByZW5kZXJzOiBtZXRlci5jcmVhdGVDb3VudGVyKCduZXh0X2Jvb3N0X3JlbmRlcnMnLCB7XG4gICAgICBkZXNjcmlwdGlvbjogJ0Ftb3VudCBvZiByZXF1ZXN0cyByZW5kZXJlZCBieSBuZXh0LWJvb3N0JyxcbiAgICB9KSxcbiAgICBwZW5kaW5nUmVuZGVyczogbWV0ZXIuY3JlYXRlVXBEb3duQ291bnRlcignbmV4dF9ib29zdF9wZW5kaW5nX3JlbmRlcnMnLCB7XG4gICAgICBkZXNjcmlwdGlvbjogJ0Ftb3VudCBvZiByZXF1ZXN0cyBjdXJyZW50bHkgYmVpbmcgcmVuZGVyZWQgYnkgbmV4dC1ib29zdCcsXG4gICAgfSksXG4gIH1cblxuICBjb25zdCByZXF1ZXN0SGFuZGxlciA9IHdyYXAoY2FjaGUsIGNvbmYsIHJlbmRlcmVyLCBwbGFpbilcbiAgY29uc3QgcmVxdWVzdExpc3RlbmVyID0gYXN5bmMgKHJlcTogSW5jb21pbmdNZXNzYWdlLCByZXM6IFNlcnZlclJlc3BvbnNlKSA9PiB7XG4gICAgY29uc3QgaGFuZGxlclNwYW4gPSB0cmFjZXIuc3RhcnRTcGFuKCduZXh0LWJvb3N0IGhhbmRsZXInKVxuXG4gICAgYXdhaXQgY29udGV4dC53aXRoKHRyYWNlLnNldFNwYW4oY29udGV4dC5hY3RpdmUoKSwgaGFuZGxlclNwYW4pLCAoKSA9PiB7XG4gICAgICByZXR1cm4gcmVxdWVzdEhhbmRsZXIocmVxLCByZXMsIGhhbmRsZXJTcGFuLCBjb3VudGVycylcbiAgICB9KVxuXG4gICAgaGFuZGxlclNwYW4uZW5kKClcbiAgfVxuXG4gIC8vIGluaXQgdGhlIGNoaWxkIHByb2Nlc3MgZm9yIHJldmFsaWRhdGUgYW5kIGNhY2hlIHB1cmdlXG4gIHJldHVybiB7XG4gICAgaGFuZGxlcjogcmVxdWVzdExpc3RlbmVyLFxuICAgIGNhY2hlLFxuICAgIGNsb3NlOiBhc3luYyAoKSA9PiB7XG4gICAgICByZW5kZXJlci5raWxsKClcbiAgICAgIGF3YWl0IGFkYXB0ZXIuc2h1dGRvd24oKVxuICAgIH0sXG4gIH1cbn1cbiJdLCJuYW1lcyI6WyJDYWNoZWRIYW5kbGVyIiwidHJhY2VyIiwiZ2V0VHJhY2VyIiwibWF0Y2hSdWxlcyIsImNvbmYiLCJyZXEiLCJlcnIiLCJpbmRleE9mIiwibWV0aG9kIiwibWF0Y2hlZCIsInR0bCIsInJ1bGVzIiwicnVsZSIsInVybCIsIlJlZ0V4cCIsInJlZ2V4IiwidGVzdCIsIndyYXAiLCJjYWNoZSIsInJlbmRlcmVyIiwibmV4dCIsInJlcyIsImhhbmRsZXJTcGFuIiwiY291bnRlcnMiLCJzZXJ2ZVNwYW4iLCJzdGFydFNwYW4iLCJwYXJhbUZpbHRlciIsImtleSIsImNhY2hlS2V5Iiwic2V0QXR0cmlidXRlcyIsInNldEhlYWRlciIsInJlcXVlc3QiLCJhZGQiLCJzZXRBdHRyaWJ1dGUiLCJlbmQiLCJjYWNoZUxvb2t1cFNwYW4iLCJzdGF0ZSIsIndpdGgiLCJzZXRTcGFuIiwiYWN0aXZlIiwic3RhdHVzIiwicGF5bG9hZCIsImNhY2hlTG9ja1NwYW4iLCJyZW5kZXJTcGFuIiwicGVuZGluZ1JlbmRlcnMiLCJhcmdzIiwicGF0aCIsImhlYWRlcnMiLCJydiIsInJlbmRlciIsInN0YXR1c0NvZGUiLCJjYWNoZUNvbnRyb2wiLCJib2R5IiwiQnVmZmVyIiwiZnJvbSIsInJlbmRlcnMiLCJ0b1N0cmluZyIsInNldFN0YXR1cyIsImNvZGUiLCJFUlJPUiIsImNhY2hlV3JpdGVTcGFuIiwic2V0IiwiZSIsImVycm9yIiwiZXJyb3JNZXNzYWdlIiwibWVzc2FnZSIsImVycm9yU3RhY2siLCJzdGFjayIsInJlY29yZEV4Y2VwdGlvbiIsImNhY2hlVW5sb2NrU3BhbiIsIm9wdGlvbnMiLCJjYWNoZUFkYXB0ZXIiLCJBZGFwdGVyIiwicmVxdWlyZSIsImFkYXB0ZXIiLCJpbml0IiwicGxhaW4iLCJzY3JpcHQiLCJkZWZhdWx0IiwibWV0ZXJQcm92aWRlciIsImV4cG9ydGVyIiwib3BlblRlbGVtZXRyeUNvbmZpZyIsIm1ldHJpY0V4cG9ydGVyIiwiaW50ZXJ2YWwiLCJtZXRyaWNJbnRlcnZhbCIsIm1ldGVyIiwiZ2V0TWV0ZXIiLCJjcmVhdGVDb3VudGVyIiwiZGVzY3JpcHRpb24iLCJjcmVhdGVVcERvd25Db3VudGVyIiwicmVxdWVzdEhhbmRsZXIiLCJyZXF1ZXN0TGlzdGVuZXIiLCJoYW5kbGVyIiwiY2xvc2UiLCJraWxsIiwic2h1dGRvd24iXSwibWFwcGluZ3MiOiI7Ozs7a0JBcUo4QkEsYUFBYTtBQXJKSSxHQUFvQixDQUFwQixJQUFvQjtBQUUxQyxHQUFNLENBQU4sS0FBTTtBQUNnQixHQUFpQixDQUFqQixhQUFpQjtBQUNsQyxHQUFXLENBQVgsUUFBVztBQUNOLEdBQVksQ0FBWixTQUFZO0FBRWMsR0FBUyxDQUFULE1BQVM7QUFDeEMsR0FBaUMsQ0FBakMsZUFBaUM7Ozs7OztBQUUvRCxLQUFLLENBQUNDLE1BQU0sR0FWbUMsSUFBb0IsT0FVOUNDLFNBQVMsQ0FBQyxDQUFZO1NBRWxDQyxVQUFVLENBQUNDLElBQW1CLEVBQUVDLEdBQW9CLEVBQUUsQ0FBQztRQUMxQkEsT0FBVTtJQUE5QyxLQUFLLENBQUNDLEdBQUcsR0FBRyxDQUFDO1FBQUEsQ0FBSztRQUFFLENBQU07SUFBQSxDQUFDLENBQUNDLE9BQU8sRUFBQ0YsT0FBVSxHQUFWQSxHQUFHLENBQUNHLE1BQU0sWUFBVkgsT0FBVSxHQUFJLENBQUUsUUFBTyxDQUFDO0lBQzVELEVB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