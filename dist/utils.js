"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.filterUrl = exports.serve = exports.sleep = exports.mergeConfig = exports.isZipped = void 0;
var _fs = _interopRequireDefault(require("fs"));
var _path = _interopRequireDefault(require("path"));
function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function isZipped(headers) {
    const field = headers['content-encoding'];
    return typeof field === 'string' && field.includes('gzip');
}
function serve(res, rv) {
    for(const k in rv.headers)res.setHeader(k, rv.headers[k]);
    res.statusCode = rv.statusCode;
    res.end(Buffer.from(rv.body));
}
function mergeConfig(c) {
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
            c.log('info', 'Loaded next-boost config from ' + c.filename);
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
exports.mergeConfig = mergeConfig;
exports.sleep = sleep;
exports.serve = serve;
exports.filterUrl = filterUrl;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy91dGlscy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgZnMgZnJvbSAnZnMnXG5pbXBvcnQgeyBTZXJ2ZXJSZXNwb25zZSB9IGZyb20gJ2h0dHAnXG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJ1xuXG5pbXBvcnQgeyBSZW5kZXJSZXN1bHQgfSBmcm9tICcuL3JlbmRlcmVyJ1xuaW1wb3J0IHsgSGFuZGxlckNvbmZpZywgUGFyYW1GaWx0ZXIgfSBmcm9tICcuL3R5cGVzJ1xuXG5mdW5jdGlvbiBpc1ppcHBlZChoZWFkZXJzOiB7IFtrZXk6IHN0cmluZ106IGFueSB9KTogYm9vbGVhbiB7XG4gIGNvbnN0IGZpZWxkID0gaGVhZGVyc1snY29udGVudC1lbmNvZGluZyddXG4gIHJldHVybiB0eXBlb2YgZmllbGQgPT09ICdzdHJpbmcnICYmIGZpZWxkLmluY2x1ZGVzKCdnemlwJylcbn1cblxuZnVuY3Rpb24gc2VydmUocmVzOiBTZXJ2ZXJSZXNwb25zZSwgcnY6IFJlbmRlclJlc3VsdCkge1xuICBmb3IgKGNvbnN0IGsgaW4gcnYuaGVhZGVycykgcmVzLnNldEhlYWRlcihrLCBydi5oZWFkZXJzW2tdKVxuICByZXMuc3RhdHVzQ29kZSA9IHJ2LnN0YXR1c0NvZGVcbiAgcmVzLmVuZChCdWZmZXIuZnJvbShydi5ib2R5KSlcbn1cblxuZnVuY3Rpb24gbWVyZ2VDb25maWcoYzogSGFuZGxlckNvbmZpZykge1xuICBjb25zdCBjb25mOiBQYXJ0aWFsPEhhbmRsZXJDb25maWc+ID0ge1xuICAgIHJ1bGVzOiBbeyByZWdleDogJy4qJywgdHRsOiAzNjAwIH1dLFxuICB9XG5cbiAgaWYgKCFjLmZpbGVuYW1lKSBjLmZpbGVuYW1lID0gJy5uZXh0LWJvb3N0LmpzJ1xuICBjb25zdCBjb25maWdGaWxlID0gcGF0aC5yZXNvbHZlKGMuZmlsZW5hbWUpXG4gIGlmIChmcy5leGlzdHNTeW5jKGNvbmZpZ0ZpbGUpKSB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGYgPSByZXF1aXJlKGNvbmZpZ0ZpbGUpIGFzIEhhbmRsZXJDb25maWdcbiAgICAgIGMucXVpZXQgPSBjLnF1aWV0IHx8IGYucXVpZXRcbiAgICAgIGMgPSBPYmplY3QuYXNzaWduKGYsIGMpXG4gICAgICBjLmxvZygnaW5mbycsICdMb2FkZWQgbmV4dC1ib29zdCBjb25maWcgZnJvbSAnICsgYy5maWxlbmFtZSlcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBGYWlsZWQgdG8gbG9hZCAke2MuZmlsZW5hbWV9YClcbiAgICB9XG4gIH1cblxuICBPYmplY3QuYXNzaWduKGNvbmYsIGMpXG5cbiAgcmV0dXJuIGNvbmYgYXMgSGFuZGxlckNvbmZpZ1xufVxuXG5mdW5jdGlvbiBmaWx0ZXJVcmwodXJsOiBzdHJpbmcsIGZpbHRlcj86IFBhcmFtRmlsdGVyKSB7XG4gIGlmICghZmlsdGVyKSByZXR1cm4gdXJsXG5cbiAgY29uc3QgW3AwLCBwMV0gPSB1cmwuc3BsaXQoJz8nLCAyKVxuICBjb25zdCBwYXJhbXMgPSBuZXcgVVJMU2VhcmNoUGFyYW1zKHAxKVxuICBjb25zdCBrZXlzVG9EZWxldGUgPSBbLi4ucGFyYW1zLmtleXMoKV0uZmlsdGVyKGsgPT4gIWZpbHRlcihrKSlcbiAgZm9yIChjb25zdCBrIG9mIGtleXNUb0RlbGV0ZSkgcGFyYW1zLmRlbGV0ZShrKVxuXG4gIGNvbnN0IHFzID0gcGFyYW1zLnRvU3RyaW5nKClcbiAgcmV0dXJuIHFzID8gcDAgKyAnPycgKyBxcyA6IHAwXG59XG5cbmFzeW5jIGZ1bmN0aW9uIHNsZWVwKG1zOiBudW1iZXIpIHtcbiAgcmV0dXJuIG5ldyBQcm9taXNlPHZvaWQ+KHJlc29sdmUgPT4gc2V0VGltZW91dChyZXNvbHZlLCBtcykpXG59XG5cbmV4cG9ydCB7IGlzWmlwcGVkLCBtZXJnZUNvbmZpZywgc2xlZXAsIHNlcnZlLCBmaWx0ZXJVcmwgfVxuIl0sIm5hbWVzIjpbImlzWmlwcGVkIiwiaGVhZGVycyIsImZpZWxkIiwiaW5jbHVkZXMiLCJzZXJ2ZSIsInJlcyIsInJ2IiwiayIsInNldEhlYWRlciIsInN0YXR1c0NvZGUiLCJlbmQiLCJCdWZmZXIiLCJmcm9tIiwiYm9keSIsIm1lcmdlQ29uZmlnIiwiYyIsImNvbmYiLCJydWxlcyIsInJlZ2V4IiwidHRsIiwiZmlsZW5hbWUiLCJjb25maWdGaWxlIiwicmVzb2x2ZSIsImV4aXN0c1N5bmMiLCJmIiwicmVxdWlyZSIsInF1aWV0IiwiT2JqZWN0IiwiYXNzaWduIiwibG9nIiwiZXJyb3IiLCJFcnJvciIsImZpbHRlclVybCIsInVybCIsImZpbHRlciIsInAwIiwicDEiLCJzcGxpdCIsInBhcmFtcyIsIlVSTFNlYXJjaFBhcmFtcyIsImtleXNUb0RlbGV0ZSIsImtleXMiLCJkZWxldGUiLCJxcyIsInRvU3RyaW5nIiwic2xlZXAiLCJtcyIsIlByb21pc2UiLCJzZXRUaW1lb3V0Il0sIm1hcHBpbmdzIjoiOzs7OztBQUFlLEdBQUksQ0FBSixHQUFJO0FBRUYsR0FBTSxDQUFOLEtBQU07Ozs7OztTQUtkQSxRQUFRLENBQUNDLE9BQStCLEVBQVcsQ0FBQztJQUMzRCxLQUFLLENBQUNDLEtBQUssR0FBR0QsT0FBTyxDQUFDLENBQWtCO0lBQ3hDLE1BQU0sQ0FBQyxNQUFNLENBQUNDLEtBQUssS0FBSyxDQUFRLFdBQUlBLEtBQUssQ0FBQ0MsUUFBUSxDQUFDLENBQU07QUFDM0QsQ0FBQztTQUVRQyxLQUFLLENBQUNDLEdBQW1CLEVBQUVDLEVBQWdCLEVBQUUsQ0FBQztJQUNyRCxHQUFHLENBQUUsS0FBSyxDQUFDQyxDQUFDLElBQUlELEVBQUUsQ0FBQ0wsT0FBTyxDQUFFSSxHQUFHLENBQUNHLFNBQVMsQ0FBQ0QsQ0FBQyxFQUFFRCxFQUFFLENBQUNMLE9BQU8sQ0FBQ00sQ0FBQztJQUN6REYsR0FBRyxDQUFDSSxVQUFVLEdBQUdILEVBQUUsQ0FBQ0csVUFBVTtJQUM5QkosR0FBRyxDQUFDSyxHQUFHLENBQUNDLE1BQU0sQ0FBQ0MsSUFBSSxDQUFDTixFQUFFLENBQUNPLElBQUk7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