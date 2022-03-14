"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.hasLock = hasLock;
exports.lock = lock;
exports.unlock = unlock;
exports.serveCache = serveCache;
exports.send = send;
var _stream = require("stream");
var _payload = require("./payload");
var _utils = require("./utils");
const MAX_WAIT = 10000 // 10 seconds
;
const WAIT_INTERVAL = 10 // 10 ms
;
async function hasLock(key, cache) {
    return await cache.has('lock:' + key) === 'hit';
}
async function lock(key, cache) {
    await cache.set('lock:' + key, Buffer.from('lock'), MAX_WAIT / 1000) // in seconds
    ;
}
async function unlock(key, cache) {
    await cache.del('lock:' + key);
}
async function serveCache(cache, key, forced) {
    if (forced) return {
        status: 'force'
    };
    try {
        const status = await cache.has('payload:' + key);
        if (status === 'hit') {
            const payload = (0, _payload).decodePayload(await cache.get('payload:' + key));
            return {
                status: 'hit',
                payload
            };
        } else if (status === 'miss') {
            const lock1 = await hasLock(key, cache);
            // non first-time miss (the cache is being created), wait for the cache
            return !lock1 ? {
                status: 'miss'
            } : waitAndServe(key, cache);
        } else {
            // stale
            const payload = (0, _payload).decodePayload(await cache.get('payload:' + key));
            return {
                status: 'stale',
                payload
            };
        }
    } catch (e) {
        const error = e;
        (0, _utils).log('error', 'Cache lookup error', {
            key,
            errorMessage: error.message,
            errorStack: error.stack
        });
        return {
            status: 'miss'
        };
    }
}
async function waitAndServe(key, cache) {
    while(await hasLock(key, cache)){
        // lock will expire
        await (0, _utils).sleep(WAIT_INTERVAL);
    }
    const status = await cache.has('payload:' + key);
    // still no cache after waiting for MAX_WAIT
    if (status === 'miss') {
        return {
            status: 'timeout'
        };
    } else {
        const payload = (0, _payload).decodePayload(await cache.get('payload:' + key));
        return {
            status: 'fulfill',
            payload
        };
    }
}
function send(payload, res) {
    const { body , headers  } = payload;
    if (!body) {
        res.statusCode = 504;
        return res.end();
    }
    for(const k in headers){
        res.setHeader(k, headers[k]);
    }
    res.statusCode = 200;
    res.removeHeader('transfer-encoding');
    res.setHeader('content-length', Buffer.byteLength(body));
    res.setHeader('content-encoding', 'gzip');
    const stream = new _stream.PassThrough();
    stream.pipe(res);
    stream.end(body);
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9jYWNoZS1tYW5hZ2VyLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFNlcnZlclJlc3BvbnNlIH0gZnJvbSAnaHR0cCdcbmltcG9ydCB7IFBhc3NUaHJvdWdoIH0gZnJvbSAnc3RyZWFtJ1xuXG5pbXBvcnQgeyBkZWNvZGVQYXlsb2FkIH0gZnJvbSAnLi9wYXlsb2FkJ1xuaW1wb3J0IHsgQ2FjaGUsIFN0YXRlIH0gZnJvbSAnLi90eXBlcydcbmltcG9ydCB7IGxvZywgc2xlZXAgfSBmcm9tICcuL3V0aWxzJ1xuXG5jb25zdCBNQVhfV0FJVCA9IDEwMDAwIC8vIDEwIHNlY29uZHNcbmNvbnN0IFdBSVRfSU5URVJWQUwgPSAxMCAvLyAxMCBtc1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gaGFzTG9jayhrZXk6IHN0cmluZywgY2FjaGU6IENhY2hlKSB7XG4gIHJldHVybiAoYXdhaXQgY2FjaGUuaGFzKCdsb2NrOicgKyBrZXkpKSA9PT0gJ2hpdCdcbn1cblxuLy8gbXV0ZXggbG9jayB0byBwcmV2ZW50IHNhbWUgcGFnZSByZW5kZXJlZCBtb3JlIHRoYW4gb25jZVxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGxvY2soa2V5OiBzdHJpbmcsIGNhY2hlOiBDYWNoZSkge1xuICBhd2FpdCBjYWNoZS5zZXQoJ2xvY2s6JyArIGtleSwgQnVmZmVyLmZyb20oJ2xvY2snKSwgTUFYX1dBSVQgLyAxMDAwKSAvLyBpbiBzZWNvbmRzXG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB1bmxvY2soa2V5OiBzdHJpbmcsIGNhY2hlOiBDYWNoZSkge1xuICBhd2FpdCBjYWNoZS5kZWwoJ2xvY2s6JyArIGtleSlcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHNlcnZlQ2FjaGUoY2FjaGU6IENhY2hlLCBrZXk6IHN0cmluZywgZm9yY2VkOiBib29sZWFuKTogUHJvbWlzZTxTdGF0ZT4ge1xuICBpZiAoZm9yY2VkKSByZXR1cm4geyBzdGF0dXM6ICdmb3JjZScgfVxuXG4gIHRyeSB7XG4gICAgY29uc3Qgc3RhdHVzID0gYXdhaXQgY2FjaGUuaGFzKCdwYXlsb2FkOicgKyBrZXkpXG4gICAgaWYgKHN0YXR1cyA9PT0gJ2hpdCcpIHtcbiAgICAgIGNvbnN0IHBheWxvYWQgPSBkZWNvZGVQYXlsb2FkKGF3YWl0IGNhY2hlLmdldCgncGF5bG9hZDonICsga2V5KSlcbiAgICAgIHJldHVybiB7IHN0YXR1czogJ2hpdCcsIHBheWxvYWQgfVxuICAgIH0gZWxzZSBpZiAoc3RhdHVzID09PSAnbWlzcycpIHtcbiAgICAgIGNvbnN0IGxvY2sgPSBhd2FpdCBoYXNMb2NrKGtleSwgY2FjaGUpXG4gICAgICAvLyBub24gZmlyc3QtdGltZSBtaXNzICh0aGUgY2FjaGUgaXMgYmVpbmcgY3JlYXRlZCksIHdhaXQgZm9yIHRoZSBjYWNoZVxuICAgICAgcmV0dXJuICFsb2NrID8geyBzdGF0dXM6ICdtaXNzJyB9IDogd2FpdEFuZFNlcnZlKGtleSwgY2FjaGUpXG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIHN0YWxlXG4gICAgICBjb25zdCBwYXlsb2FkID0gZGVjb2RlUGF5bG9hZChhd2FpdCBjYWNoZS5nZXQoJ3BheWxvYWQ6JyArIGtleSkpXG4gICAgICByZXR1cm4geyBzdGF0dXM6ICdzdGFsZScsIHBheWxvYWQgfVxuICAgIH1cbiAgfSBjYXRjaCAoZSkge1xuICAgIGNvbnN0IGVycm9yID0gZSBhcyBFcnJvclxuICAgIGxvZygnZXJyb3InLCAnQ2FjaGUgbG9va3VwIGVycm9yJywge1xuICAgICAga2V5LFxuICAgICAgZXJyb3JNZXNzYWdlOiBlcnJvci5tZXNzYWdlLFxuICAgICAgZXJyb3JTdGFjazogZXJyb3Iuc3RhY2ssXG4gICAgfSlcblxuICAgIHJldHVybiB7IHN0YXR1czogJ21pc3MnIH1cbiAgfVxufVxuXG5hc3luYyBmdW5jdGlvbiB3YWl0QW5kU2VydmUoa2V5OiBzdHJpbmcsIGNhY2hlOiBDYWNoZSk6IFByb21pc2U8U3RhdGU+IHtcbiAgd2hpbGUgKGF3YWl0IGhhc0xvY2soa2V5LCBjYWNoZSkpIHtcbiAgICAvLyBsb2NrIHdpbGwgZXhwaXJlXG4gICAgYXdhaXQgc2xlZXAoV0FJVF9JTlRFUlZBTClcbiAgfVxuICBjb25zdCBzdGF0dXMgPSBhd2FpdCBjYWNoZS5oYXMoJ3BheWxvYWQ6JyArIGtleSlcbiAgLy8gc3RpbGwgbm8gY2FjaGUgYWZ0ZXIgd2FpdGluZyBmb3IgTUFYX1dBSVRcbiAgaWYgKHN0YXR1cyA9PT0gJ21pc3MnKSB7XG4gICAgcmV0dXJuIHsgc3RhdHVzOiAndGltZW91dCcgfVxuICB9IGVsc2Uge1xuICAgIGNvbnN0IHBheWxvYWQgPSBkZWNvZGVQYXlsb2FkKGF3YWl0IGNhY2hlLmdldCgncGF5bG9hZDonICsga2V5KSlcbiAgICByZXR1cm4geyBzdGF0dXM6ICdmdWxmaWxsJywgcGF5bG9hZCB9XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNlbmQoXG4gIHBheWxvYWQ6IHsgYm9keTogQnVmZmVyIHwgbnVsbDsgaGVhZGVyczogUmVjb3JkPHN0cmluZywgYW55PiB8IG51bGwgfSxcbiAgcmVzOiBTZXJ2ZXJSZXNwb25zZSxcbikge1xuICBjb25zdCB7IGJvZHksIGhlYWRlcnMgfSA9IHBheWxvYWRcbiAgaWYgKCFib2R5KSB7XG4gICAgcmVzLnN0YXR1c0NvZGUgPSA1MDRcbiAgICByZXR1cm4gcmVzLmVuZCgpXG4gIH1cbiAgZm9yIChjb25zdCBrIGluIGhlYWRlcnMpIHtcbiAgICByZXMuc2V0SGVhZGVyKGssIGhlYWRlcnNba10pXG4gIH1cbiAgcmVzLnN0YXR1c0NvZGUgPSAyMDBcbiAgcmVzLnJlbW92ZUhlYWRlcigndHJhbnNmZXItZW5jb2RpbmcnKVxuICByZXMuc2V0SGVhZGVyKCdjb250ZW50LWxlbmd0aCcsIEJ1ZmZlci5ieXRlTGVuZ3RoKGJvZHkpKVxuICByZXMuc2V0SGVhZGVyKCdjb250ZW50LWVuY29kaW5nJywgJ2d6aXAnKVxuICBjb25zdCBzdHJlYW0gPSBuZXcgUGFzc1Rocm91Z2goKVxuICBzdHJlYW0ucGlwZShyZXMpXG4gIHN0cmVhbS5lbmQoYm9keSlcbn1cbiJdLCJuYW1lcyI6WyJoYXNMb2NrIiwibG9jayIsInVubG9jayIsInNlcnZlQ2FjaGUiLCJzZW5kIiwiTUFYX1dBSVQiLCJXQUlUX0lOVEVSVkFMIiwia2V5IiwiY2FjaGUiLCJoYXMiLCJzZXQiLCJCdWZmZXIiLCJmcm9tIiwiZGVsIiwiZm9yY2VkIiwic3RhdHVzIiwicGF5bG9hZCIsImdldCIsIndhaXRBbmRTZXJ2ZSIsImUiLCJlcnJvciIsImVycm9yTWVzc2FnZSIsIm1lc3NhZ2UiLCJlcnJvclN0YWNrIiwic3RhY2siLCJyZXMiLCJib2R5IiwiaGVhZGVycyIsInN0YXR1c0NvZGUiLCJlbmQiLCJrIiwic2V0SGVhZGVyIiwicmVtb3ZlSGVhZGVyIiwiYnl0ZUxlbmd0aCIsInN0cmVhbSIsInBpcGUiXSwibWFwcGluZ3MiOiI7Ozs7UUFVc0JBLE9BQU8sR0FBUEEsT0FBTztRQUtQQyxJQUFJLEdBQUpBLElBQUk7UUFJSkMsTUFBTSxHQUFOQSxNQUFNO1FBSU5DLFVBQVUsR0FBVkEsVUFBVTtRQTRDaEJDLElBQUksR0FBSkEsSUFBSTtBQWxFUSxHQUFRLENBQVIsT0FBUTtBQUVOLEdBQVcsQ0FBWCxRQUFXO0FBRWQsR0FBUyxDQUFULE1BQVM7QUFFcEMsS0FBSyxDQUFDQyxRQUFRLEdBQUcsS0FBSyxBQUFDLENBQWEsQUFBYixFQUFhLEFBQWIsV0FBYTs7QUFDcEMsS0FBSyxDQUFDQyxhQUFhLEdBQUcsRUFBRSxBQUFDLENBQVEsQUFBUixFQUFRLEFBQVIsTUFBUTs7ZUFFWE4sT0FBTyxDQUFDTyxHQUFXLEVBQUVDLEtBQVksRUFBRSxDQUFDO0lBQ3hELE1BQU0sQ0FBRSxLQUFLLENBQUNBLEtBQUssQ0FBQ0MsR0FBRyxDQUFDLENBQU8sU0FBR0YsR0FBRyxNQUFPLENBQUs7QUFDbkQsQ0FBQztlQUdxQk4sSUFBSSxDQUFDTSxHQUFXLEVBQUVDLEtBQVksRUFBRSxDQUFDO0lBQ3JELEtBQUssQ0FBQ0EsS0FBSyxDQUFDRSxH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