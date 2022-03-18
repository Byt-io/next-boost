#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.serve = void 0;
var _http = _interopRequireDefault(require("http"));
var _httpGracefulShutdown = _interopRequireDefault(require("http-graceful-shutdown"));
var _handler = _interopRequireDefault(require("../handler"));
var _utils = require("../utils");
function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
process.env.NODE_ENV = 'production';
const serve = async (options)=>{
    const port = options.port || 3000;
    const hostname = options.hostname // no host binding by default, the same as `next start`
    ;
    const dir = options.dir || '.';
    const grace = options.grace || 30000;
    const script = require.resolve('./init');
    const rendererArgs = {
        script,
        args: {
            dir,
            dev: false
        }
    };
    const cached = await (0, _handler).default(rendererArgs);
    const server = new _http.default.Server(cached.handler);
    server.listen(port, hostname, ()=>{
        (0, _utils).log('info', `Serving on http://${hostname || 'localhost'}:${port}`);
    });
    (0, _httpGracefulShutdown).default(server, {
        timeout: grace,
        preShutdown: async ()=>(0, _utils).log('info', 'Preparing shutdown')
        ,
        onShutdown: async ()=>cached.close()
        ,
        finally: ()=>(0, _utils).log('info', 'Completed shutdown')
    });
};
exports.serve = serve;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9uZXh0L3NlcnZlci50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIjIS91c3IvYmluL2VudiBub2RlXG5wcm9jZXNzLmVudi5OT0RFX0VOViA9ICdwcm9kdWN0aW9uJ1xuXG5pbXBvcnQgaHR0cCBmcm9tICdodHRwJ1xuaW1wb3J0IGdyYWNlZnVsU2h1dGRvd24gZnJvbSAnaHR0cC1ncmFjZWZ1bC1zaHV0ZG93bidcblxuaW1wb3J0IHsgQXJndiwgcGFyc2UgfSBmcm9tICcuLi9jbGknXG5pbXBvcnQgQ2FjaGVkSGFuZGxlciBmcm9tICcuLi9oYW5kbGVyJ1xuaW1wb3J0IHsgbG9nIH0gZnJvbSAnLi4vdXRpbHMnXG5cbmV4cG9ydCBpbnRlcmZhY2UgU2VydmVPcHRpb25zIHtcbiAgcG9ydD86IG51bWJlclxuICBob3N0bmFtZT86IHN0cmluZ1xuICBkaXI/OiBzdHJpbmdcbiAgZ3JhY2U/OiBudW1iZXJcbn1cblxuZXhwb3J0IGNvbnN0IHNlcnZlID0gYXN5bmMgKG9wdGlvbnM6IFNlcnZlT3B0aW9ucykgPT4ge1xuICBjb25zdCBwb3J0ID0gb3B0aW9ucy5wb3J0IHx8IDMwMDBcbiAgY29uc3QgaG9zdG5hbWUgPSBvcHRpb25zLmhvc3RuYW1lIC8vIG5vIGhvc3QgYmluZGluZyBieSBkZWZhdWx0LCB0aGUgc2FtZSBhcyBgbmV4dCBzdGFydGBcbiAgY29uc3QgZGlyID0gb3B0aW9ucy5kaXIgfHwgJy4nXG4gIGNvbnN0IGdyYWNlID0gb3B0aW9ucy5ncmFjZSB8fCAzMDAwMFxuXG4gIGNvbnN0IHNjcmlwdCA9IHJlcXVpcmUucmVzb2x2ZSgnLi9pbml0JylcbiAgY29uc3QgcmVuZGVyZXJBcmdzID0geyBzY3JpcHQsIGFyZ3M6IHsgZGlyLCBkZXY6IGZhbHNlIH0gfVxuICBjb25zdCBjYWNoZWQgPSBhd2FpdCBDYWNoZWRIYW5kbGVyKHJlbmRlcmVyQXJncylcblxuICBjb25zdCBzZXJ2ZXIgPSBuZXcgaHR0cC5TZXJ2ZXIoY2FjaGVkLmhhbmRsZXIpXG4gIHNlcnZlci5saXN0ZW4ocG9ydCwgaG9zdG5hbWUsICgpID0+IHtcbiAgICBsb2coJ2luZm8nLCBgU2VydmluZyBvbiBodHRwOi8vJHtob3N0bmFtZSB8fCAnbG9jYWxob3N0J306JHtwb3J0fWApXG4gIH0pXG5cbiAgZ3JhY2VmdWxTaHV0ZG93bihzZXJ2ZXIsIHtcbiAgICB0aW1lb3V0OiBncmFjZSxcbiAgICBwcmVTaHV0ZG93bjogYXN5bmMgKCkgPT4gbG9nKCdpbmZvJywgJ1ByZXBhcmluZyBzaHV0ZG93bicpLFxuICAgIG9uU2h1dGRvd246IGFzeW5jICgpID0+IGNhY2hlZC5jbG9zZSgpLFxuICAgIGZpbmFsbHk6ICgpID0+IGxvZygnaW5mbycsICdDb21wbGV0ZWQgc2h1dGRvd24nKSxcbiAgfSlcbn1cbiJdLCJuYW1lcyI6WyJwcm9jZXNzIiwiZW52IiwiTk9ERV9FTlYiLCJzZXJ2ZSIsIm9wdGlvbnMiLCJwb3J0IiwiaG9zdG5hbWUiLCJkaXIiLCJncmFjZSIsInNjcmlwdCIsInJlcXVpcmUiLCJyZXNvbHZlIiwicmVuZGVyZXJBcmdzIiwiYXJncyIsImRldiIsImNhY2hlZCIsInNlcnZlciIsIlNlcnZlciIsImhhbmRsZXIiLCJsaXN0ZW4iLCJ0aW1lb3V0IiwicHJlU2h1dGRvd24iLCJvblNodXRkb3duIiwiY2xvc2UiLCJmaW5hbGx5Il0sIm1hcHBpbmdzIjoiOzs7Ozs7QUFHaUIsR0FBTSxDQUFOLEtBQU07QUFDTSxHQUF3QixDQUF4QixxQkFBd0I7QUFHM0IsR0FBWSxDQUFaLFFBQVk7QUFDbEIsR0FBVSxDQUFWLE1BQVU7Ozs7OztBQVA5QkEsT0FBTyxDQUFDQyxHQUFHLENBQUNDLFFBQVEsR0FBRyxDQUFZO0FBZ0I1QixLQUFLLENBQUNDLEtBQUssVUFBVUMsT0FBcUIsR0FBSyxDQUFDO0lBQ3JELEtBQUssQ0FBQ0MsSUFBSSxHQUFHRCxPQUFPLENBQUNDLElBQUksSUFBSSxJQUFJO0lBQ2pDLEtBQUssQ0FBQ0MsUUFBUSxHQUFHRixPQUFPLENBQUNFLFFBQVEsQUFBQyxDQUF1RCxBQUF2RCxFQUF1RCxBQUF2RCxxREFBdUQ7O0lBQ3pGLEtBQUssQ0FBQ0MsR0FBRyxHQUFHSCxPQUFPLENBQUNHLEdBQUcsSUFBSSxDQUFHO0lBQzlCLEtBQUssQ0FBQ0MsS0FBSyxHQUFHSixPQUFPLENBQUNJLEtBQUssSUFBSSxLQUFLO0lBRXBDLEtBQUssQ0FBQ0MsTUFBTSxHQUFHQyxPQUFPLENBQUNDLE9BQU8sQ0FBQyxDQUFRO0lBQ3ZDLEtBQUssQ0FBQ0MsWUFBWSxHQUFHLENBQUM7UUFBQ0gsTUFBTTtRQUFFSSxJQUFJLEVBQUUsQ0FBQztZQUFDTixHQUFHO1lBQUVPLEdBQUcsRUFBRSxLQUFLO1FBQUMsQ0FBQztJQUFDLENBQUM7SUFDMUQsS0FBSyxDQUFDQyxNQUFNLEdBQUcsS0FBSyxLQWxCSSxRQUFZLFVBa0JESCxZQUFZO0lBRS9DLEtBQUssQ0FBQ0ksTUFBTSxHQUFHLEdBQUcsQ0F4QkgsS0FBTSxTQXdCR0MsTUFBTSxDQUFDRixNQUFNLENBQUNHLE9BQU87SUFDN0NGLE1BQU0sQ0FBQ0csTUFBTSxDQUFDZCxJQUFJLEVBQUVDLFFBQVEsTUFBUSxDQUFDO1lBcEJuQixNQUFVLE1BcUJ0QixDQUFNLFFBQUcsa0JBQWtCLEVBQUVBLFFBQVEsSUFBSSxDQUFXLFdBQUMsQ0FBQyxFQUFFRCxJQUFJO0lBQ2xFLENBQUM7UUExQjBCLHFCQUF3QixVQTRCbENXLE1BQU0sRUFBRSxDQUFDO1FBQ3hCSSxPQUFPLEVBQUVaLEtBQUs7UUFDZGEsV0FBVyxnQkExQkssTUFBVSxNQTBCRyxDQUFNLE9BQUUsQ0FBb0I7O1FBQ3pEQyxVQUFVLFlBQWNQLE1BQU0sQ0FBQ1EsS0FBSzs7UUFDcENDLE9BQU8sVUE1QlMsTUFBVSxNQTRCUCxDQUFNLE9BQUUsQ0FBb0I7SUFDakQsQ0FBQztBQUNILENBQUM7UUFyQllyQixLQUFLLEdBQUxBLEtBQUsifQ==