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
const serve = async (options = {
})=>{
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
    const cached = await (0, _handler).default(rendererArgs, {
        openTelemetryConfig: options.openTelemetryConfig
    });
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9uZXh0L3NlcnZlci50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIjIS91c3IvYmluL2VudiBub2RlXG5wcm9jZXNzLmVudi5OT0RFX0VOViA9ICdwcm9kdWN0aW9uJ1xuXG5pbXBvcnQgaHR0cCBmcm9tICdodHRwJ1xuaW1wb3J0IGdyYWNlZnVsU2h1dGRvd24gZnJvbSAnaHR0cC1ncmFjZWZ1bC1zaHV0ZG93bidcbmltcG9ydCBDYWNoZWRIYW5kbGVyIGZyb20gJy4uL2hhbmRsZXInXG5pbXBvcnQgeyBsb2cgfSBmcm9tICcuLi91dGlscydcbmltcG9ydCB7IE1ldGVyQ29uZmlnIH0gZnJvbSAnQG9wZW50ZWxlbWV0cnkvc2RrLW1ldHJpY3MtYmFzZSdcblxuZXhwb3J0IGludGVyZmFjZSBTZXJ2ZU9wdGlvbnMge1xuICBwb3J0PzogbnVtYmVyXG4gIGhvc3RuYW1lPzogc3RyaW5nXG4gIGRpcj86IHN0cmluZ1xuICBncmFjZT86IG51bWJlclxuICBvcGVuVGVsZW1ldHJ5Q29uZmlnPzoge1xuICAgIG1ldHJpY0V4cG9ydGVyOiBNZXRlckNvbmZpZ1snZXhwb3J0ZXInXVxuICAgIG1ldHJpY0ludGVydmFsOiBNZXRlckNvbmZpZ1snaW50ZXJ2YWwnXVxuICB9XG59XG5cbmV4cG9ydCBjb25zdCBzZXJ2ZSA9IGFzeW5jIChvcHRpb25zOiBTZXJ2ZU9wdGlvbnMgPSB7fSkgPT4ge1xuICBjb25zdCBwb3J0ID0gb3B0aW9ucy5wb3J0IHx8IDMwMDBcbiAgY29uc3QgaG9zdG5hbWUgPSBvcHRpb25zLmhvc3RuYW1lIC8vIG5vIGhvc3QgYmluZGluZyBieSBkZWZhdWx0LCB0aGUgc2FtZSBhcyBgbmV4dCBzdGFydGBcbiAgY29uc3QgZGlyID0gb3B0aW9ucy5kaXIgfHwgJy4nXG4gIGNvbnN0IGdyYWNlID0gb3B0aW9ucy5ncmFjZSB8fCAzMDAwMFxuXG4gIGNvbnN0IHNjcmlwdCA9IHJlcXVpcmUucmVzb2x2ZSgnLi9pbml0JylcbiAgY29uc3QgcmVuZGVyZXJBcmdzID0geyBzY3JpcHQsIGFyZ3M6IHsgZGlyLCBkZXY6IGZhbHNlIH0gfVxuICBjb25zdCBjYWNoZWQgPSBhd2FpdCBDYWNoZWRIYW5kbGVyKHJlbmRlcmVyQXJncywge1xuICAgIG9wZW5UZWxlbWV0cnlDb25maWc6IG9wdGlvbnMub3BlblRlbGVtZXRyeUNvbmZpZyxcbiAgfSlcblxuICBjb25zdCBzZXJ2ZXIgPSBuZXcgaHR0cC5TZXJ2ZXIoY2FjaGVkLmhhbmRsZXIpXG4gIHNlcnZlci5saXN0ZW4ocG9ydCwgaG9zdG5hbWUsICgpID0+IHtcbiAgICBsb2coJ2luZm8nLCBgU2VydmluZyBvbiBodHRwOi8vJHtob3N0bmFtZSB8fCAnbG9jYWxob3N0J306JHtwb3J0fWApXG4gIH0pXG5cbiAgZ3JhY2VmdWxTaHV0ZG93bihzZXJ2ZXIsIHtcbiAgICB0aW1lb3V0OiBncmFjZSxcbiAgICBwcmVTaHV0ZG93bjogYXN5bmMgKCkgPT4gbG9nKCdpbmZvJywgJ1ByZXBhcmluZyBzaHV0ZG93bicpLFxuICAgIG9uU2h1dGRvd246IGFzeW5jICgpID0+IGNhY2hlZC5jbG9zZSgpLFxuICAgIGZpbmFsbHk6ICgpID0+IGxvZygnaW5mbycsICdDb21wbGV0ZWQgc2h1dGRvd24nKSxcbiAgfSlcbn1cbiJdLCJuYW1lcyI6WyJwcm9jZXNzIiwiZW52IiwiTk9ERV9FTlYiLCJzZXJ2ZSIsIm9wdGlvbnMiLCJwb3J0IiwiaG9zdG5hbWUiLCJkaXIiLCJncmFjZSIsInNjcmlwdCIsInJlcXVpcmUiLCJyZXNvbHZlIiwicmVuZGVyZXJBcmdzIiwiYXJncyIsImRldiIsImNhY2hlZCIsIm9wZW5UZWxlbWV0cnlDb25maWciLCJzZXJ2ZXIiLCJTZXJ2ZXIiLCJoYW5kbGVyIiwibGlzdGVuIiwidGltZW91dCIsInByZVNodXRkb3duIiwib25TaHV0ZG93biIsImNsb3NlIiwiZmluYWxseSJdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBR2lCLEdBQU0sQ0FBTixLQUFNO0FBQ00sR0FBd0IsQ0FBeEIscUJBQXdCO0FBQzNCLEdBQVksQ0FBWixRQUFZO0FBQ2xCLEdBQVUsQ0FBVixNQUFVOzs7Ozs7QUFMOUJBLE9BQU8sQ0FBQ0MsR0FBRyxDQUFDQyxRQUFRLEdBQUcsQ0FBWTtBQW1CNUIsS0FBSyxDQUFDQyxLQUFLLFVBQVVDLE9BQXFCLEdBQUcsQ0FBQztBQUFBLENBQUMsR0FBSyxDQUFDO0lBQzFELEtBQUssQ0FBQ0MsSUFBSSxHQUFHRCxPQUFPLENBQUNDLElBQUksSUFBSSxJQUFJO0lBQ2pDLEtBQUssQ0FBQ0MsUUFBUSxHQUFHRixPQUFPLENBQUNFLFFBQVEsQUFBQyxDQUF1RCxBQUF2RCxFQUF1RCxBQUF2RCxxREFBdUQ7O0lBQ3pGLEtBQUssQ0FBQ0MsR0FBRyxHQUFHSCxPQUFPLENBQUNHLEdBQUcsSUFBSSxDQUFHO0lBQzlCLEtBQUssQ0FBQ0MsS0FBSyxHQUFHSixPQUFPLENBQUNJLEtBQUssSUFBSSxLQUFLO0lBRXBDLEtBQUssQ0FBQ0MsTUFBTSxHQUFHQyxPQUFPLENBQUNDLE9BQU8sQ0FBQyxDQUFRO0lBQ3ZDLEtBQUssQ0FBQ0MsWUFBWSxHQUFHLENBQUM7UUFBQ0gsTUFBTTtRQUFFSSxJQUFJLEVBQUUsQ0FBQztZQUFDTixHQUFHO1lBQUVPLEdBQUcsRUFBRSxLQUFLO1FBQUMsQ0FBQztJQUFDLENBQUM7SUFDMUQsS0FBSyxDQUFDQyxNQUFNLEdBQUcsS0FBSyxLQXZCSSxRQUFZLFVBdUJESCxZQUFZLEVBQUUsQ0FBQztRQUNoREksbUJBQW1CLEVBQUVaLE9BQU8sQ0FBQ1ksbUJBQW1CO0lBQ2xELENBQUM7SUFFRCxLQUFLLENBQUNDLE1BQU0sR0FBRyxHQUFHLENBN0JILEtBQU0sU0E2QkdDLE1BQU0sQ0FBQ0gsTUFBTSxDQUFDSSxPQUFPO0lBQzdDRixNQUFNLENBQUNHLE1BQU0sQ0FBQ2YsSUFBSSxFQUFFQyxRQUFRLE1BQVEsQ0FBQztZQTNCbkIsTUFBVSxNQTRCdEIsQ0FBTSxRQUFHLGtCQUFrQixFQUFFQSxRQUFRLElBQUksQ0FBVyxXQUFDLENBQUMsRUFBRUQsSUFBSTtJQUNsRSxDQUFDO1FBL0IwQixxQkFBd0IsVUFpQ2xDWSxNQUFNLEVBQUUsQ0FBQztRQUN4QkksT0FBTyxFQUFFYixLQUFLO1FBQ2RjLFdBQVcsZ0JBakNLLE1BQVUsTUFpQ0csQ0FBTSxPQUFFLENBQW9COztRQUN6REMsVUFBVSxZQUFjUixNQUFNLENBQUNTLEtBQUs7O1FBQ3BDQyxPQUFPLFVBbkNTLE1BQVUsTUFtQ1AsQ0FBTSxPQUFFLENBQW9CO0lBQ2pELENBQUM7QUFDSCxDQUFDO1FBdkJZdEIsS0FBSyxHQUFMQSxLQUFLIn0=