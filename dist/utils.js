"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.filterUrl = exports.serve = exports.sleep = exports.mergeConfig = exports.log = exports.isZipped = void 0;
var _fs = _interopRequireDefault(require("fs"));
var _path = _interopRequireDefault(require("path"));
function _extends() {
    _extends = Object.assign || function(target) {
        for(var i = 1; i < arguments.length; i++){
            var source = arguments[i];
            for(var key in source){
                if (Object.prototype.hasOwnProperty.call(source, key)) {
                    target[key] = source[key];
                }
            }
        }
        return target;
    };
    return _extends.apply(this, arguments);
}
function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function isZipped(headers) {
    const field = headers['content-encoding'];
    return typeof field === 'string' && field.includes('gzip');
}
function log(type, message, meta) {
    console.log(JSON.stringify(_extends({
        date: new Date().getTime(),
        type,
        message
    }, meta)));
}
function serve(res, rv) {
    for(const k in rv.headers)res.setHeader(k, rv.headers[k]);
    res.statusCode = rv.statusCode;
    res.end(Buffer.from(rv.body));
}
function mergeConfig(c = {
}) {
    const conf = {
        rules: [
            {
                regex: '.*',
                ttl: 3600
            }
        ]
    };
    if (!c.filename) c.filename = '.next-boost.js';
    const configFile = _path.default.resolve(c.filename);
    if (_fs.default.existsSync(configFile)) {
        try {
            const f = require(configFile);
            c.quiet = c.quiet || f.quiet;
            c = Object.assign(f, c);
            log('info', 'Loaded next-boost config from ' + c.filename);
        } catch (error) {
            throw new Error(`Failed to load ${c.filename}`);
        }
    }
    Object.assign(conf, c);
    return conf;
}
function filterUrl(url, filter) {
    if (!filter) return url;
    const [p0, p1] = url.split('?', 2);
    const params = new URLSearchParams(p1);
    const keysToDelete = [
        ...params.keys()
    ].filter((k)=>!filter(k)
    );
    for (const k1 of keysToDelete)params.delete(k1);
    const qs = params.toString();
    return qs ? p0 + '?' + qs : p0;
}
async function sleep(ms) {
    return new Promise((resolve)=>setTimeout(resolve, ms)
    );
}
exports.isZipped = isZipped;
exports.log = log;
exports.mergeConfig = mergeConfig;
exports.sleep = sleep;
exports.serve = serve;
exports.filterUrl = filterUrl;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy91dGlscy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgZnMgZnJvbSAnZnMnXG5pbXBvcnQgeyBTZXJ2ZXJSZXNwb25zZSB9IGZyb20gJ2h0dHAnXG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJ1xuXG5pbXBvcnQgeyBSZW5kZXJSZXN1bHQgfSBmcm9tICcuL3JlbmRlcmVyJ1xuaW1wb3J0IHsgSGFuZGxlckNvbmZpZywgUGFyYW1GaWx0ZXIgfSBmcm9tICcuL3R5cGVzJ1xuXG5mdW5jdGlvbiBpc1ppcHBlZChoZWFkZXJzOiB7IFtrZXk6IHN0cmluZ106IGFueSB9KTogYm9vbGVhbiB7XG4gIGNvbnN0IGZpZWxkID0gaGVhZGVyc1snY29udGVudC1lbmNvZGluZyddXG4gIHJldHVybiB0eXBlb2YgZmllbGQgPT09ICdzdHJpbmcnICYmIGZpZWxkLmluY2x1ZGVzKCdnemlwJylcbn1cblxuZnVuY3Rpb24gbG9nKHR5cGU6ICdpbmZvJyB8ICd3YXJuJyB8ICdlcnJvcicsIG1lc3NhZ2U6IHN0cmluZywgbWV0YT86IFJlY29yZDxzdHJpbmcsIGFueT4pIHtcbiAgY29uc29sZS5sb2coSlNPTi5zdHJpbmdpZnkoeyBkYXRlOiBuZXcgRGF0ZSgpLmdldFRpbWUoKSwgdHlwZSwgbWVzc2FnZSwgLi4ubWV0YSB9KSlcbn1cblxuZnVuY3Rpb24gc2VydmUocmVzOiBTZXJ2ZXJSZXNwb25zZSwgcnY6IFJlbmRlclJlc3VsdCkge1xuICBmb3IgKGNvbnN0IGsgaW4gcnYuaGVhZGVycykgcmVzLnNldEhlYWRlcihrLCBydi5oZWFkZXJzW2tdKVxuICByZXMuc3RhdHVzQ29kZSA9IHJ2LnN0YXR1c0NvZGVcbiAgcmVzLmVuZChCdWZmZXIuZnJvbShydi5ib2R5KSlcbn1cblxuZnVuY3Rpb24gbWVyZ2VDb25maWcoYzogSGFuZGxlckNvbmZpZyA9IHt9KSB7XG4gIGNvbnN0IGNvbmY6IEhhbmRsZXJDb25maWcgPSB7XG4gICAgcnVsZXM6IFt7IHJlZ2V4OiAnLionLCB0dGw6IDM2MDAgfV0sXG4gIH1cblxuICBpZiAoIWMuZmlsZW5hbWUpIGMuZmlsZW5hbWUgPSAnLm5leHQtYm9vc3QuanMnXG4gIGNvbnN0IGNvbmZpZ0ZpbGUgPSBwYXRoLnJlc29sdmUoYy5maWxlbmFtZSlcbiAgaWYgKGZzLmV4aXN0c1N5bmMoY29uZmlnRmlsZSkpIHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgZiA9IHJlcXVpcmUoY29uZmlnRmlsZSkgYXMgSGFuZGxlckNvbmZpZ1xuICAgICAgYy5xdWlldCA9IGMucXVpZXQgfHwgZi5xdWlldFxuICAgICAgYyA9IE9iamVjdC5hc3NpZ24oZiwgYylcbiAgICAgIGxvZygnaW5mbycsICdMb2FkZWQgbmV4dC1ib29zdCBjb25maWcgZnJvbSAnICsgYy5maWxlbmFtZSlcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBGYWlsZWQgdG8gbG9hZCAke2MuZmlsZW5hbWV9YClcbiAgICB9XG4gIH1cblxuICBPYmplY3QuYXNzaWduKGNvbmYsIGMpXG5cbiAgcmV0dXJuIGNvbmZcbn1cblxuZnVuY3Rpb24gZmlsdGVyVXJsKHVybDogc3RyaW5nLCBmaWx0ZXI/OiBQYXJhbUZpbHRlcikge1xuICBpZiAoIWZpbHRlcikgcmV0dXJuIHVybFxuXG4gIGNvbnN0IFtwMCwgcDFdID0gdXJsLnNwbGl0KCc/JywgMilcbiAgY29uc3QgcGFyYW1zID0gbmV3IFVSTFNlYXJjaFBhcmFtcyhwMSlcbiAgY29uc3Qga2V5c1RvRGVsZXRlID0gWy4uLnBhcmFtcy5rZXlzKCldLmZpbHRlcihrID0+ICFmaWx0ZXIoaykpXG4gIGZvciAoY29uc3QgayBvZiBrZXlzVG9EZWxldGUpIHBhcmFtcy5kZWxldGUoaylcblxuICBjb25zdCBxcyA9IHBhcmFtcy50b1N0cmluZygpXG4gIHJldHVybiBxcyA/IHAwICsgJz8nICsgcXMgOiBwMFxufVxuXG5hc3luYyBmdW5jdGlvbiBzbGVlcChtczogbnVtYmVyKSB7XG4gIHJldHVybiBuZXcgUHJvbWlzZTx2b2lkPihyZXNvbHZlID0+IHNldFRpbWVvdXQocmVzb2x2ZSwgbXMpKVxufVxuXG5leHBvcnQgeyBpc1ppcHBlZCwgbG9nLCBtZXJnZUNvbmZpZywgc2xlZXAsIHNlcnZlLCBmaWx0ZXJVcmwgfVxuIl0sIm5hbWVzIjpbImlzWmlwcGVkIiwiaGVhZGVycyIsImZpZWxkIiwiaW5jbHVkZXMiLCJsb2ciLCJ0eXBlIiwibWVzc2FnZSIsIm1ldGEiLCJjb25zb2xlIiwiSlNPTiIsInN0cmluZ2lmeSIsImRhdGUiLCJEYXRlIiwiZ2V0VGltZSIsInNlcnZlIiwicmVzIiwicnYiLCJrIiwic2V0SGVhZGVyIiwic3RhdHVzQ29kZSIsImVuZCIsIkJ1ZmZlciIsImZyb20iLCJib2R5IiwibWVyZ2VDb25maWciLCJjIiwiY29uZiIsInJ1bGVzIiwicmVnZXgiLCJ0dGwiLCJmaWxlbmFtZSIsImNvbmZpZ0ZpbGUiLCJyZXNvbHZlIiwiZXhpc3RzU3luYyIsImYiLCJyZXF1aXJlIiwicXVpZXQiLCJPYmplY3QiLCJhc3NpZ24iLCJlcnJvciIsIkVycm9yIiwiZmlsdGVyVXJsIiwidXJsIiwiZmlsdGVyIiwicDAiLCJwMSIsInNwbGl0IiwicGFyYW1zIiwiVVJMU2VhcmNoUGFyYW1zIiwia2V5c1RvRGVsZXRlIiwia2V5cyIsImRlbGV0ZSIsInFzIiwidG9TdHJpbmciLCJzbGVlcCIsIm1zIiwiUHJvbWlzZSIsInNldFRpbWVvdXQiXSwibWFwcGluZ3MiOiI7Ozs7O0FBQWUsR0FBSSxDQUFKLEdBQUk7QUFFRixHQUFNLENBQU4sS0FBTTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7U0FLZEEsUUFBUSxDQUFDQyxPQUErQixFQUFXLENBQUM7SUFDM0QsS0FBSyxDQUFDQyxLQUFLLEdBQUdELE9BQU8sQ0FBQyxDQUFrQjtJQUN4QyxNQUFNLENBQUMsTUFBTSxDQUFDQyxLQUFLLEtBQUssQ0FBUSxXQUFJQSxLQUFLLENBQUNDLFFBQVEsQ0FBQyxDQUFNO0FBQzNELENBQUM7U0FFUUMsR0FBRyxDQUFDQyxJ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