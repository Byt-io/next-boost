#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.serve = void 0;
var _http = _interopRequireDefault(require("http"));
var _httpGracefulShutdown = _interopRequireDefault(require("http-graceful-shutdown"));
var _handler = _interopRequireDefault(require("../handler"));
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
    const log = options.log || (()=>false
    );
    const script = require.resolve('./init');
    const rendererArgs = {
        script,
        args: {
            dir,
            dev: false
        }
    };
    const cached = await (0, _handler).default(rendererArgs, {
        log
    });
    const server = new _http.default.Server(cached.handler);
    server.listen(port, hostname, ()=>{
        log('info', `Serving on http://${hostname || 'localhost'}:${port}`);
    });
    (0, _httpGracefulShutdown).default(server, {
        timeout: grace,
        preShutdown: async ()=>log('info', 'Preparing shutdown')
        ,
        onShutdown: async ()=>cached.close()
        ,
        finally: ()=>log('info', 'Completed shutdown')
    });
};
exports.serve = serve;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9uZXh0L3NlcnZlci50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIjIS91c3IvYmluL2VudiBub2RlXG5wcm9jZXNzLmVudi5OT0RFX0VOViA9ICdwcm9kdWN0aW9uJ1xuXG5pbXBvcnQgaHR0cCBmcm9tICdodHRwJ1xuaW1wb3J0IGdyYWNlZnVsU2h1dGRvd24gZnJvbSAnaHR0cC1ncmFjZWZ1bC1zaHV0ZG93bidcbmltcG9ydCBDYWNoZWRIYW5kbGVyIGZyb20gJy4uL2hhbmRsZXInXG5pbXBvcnQgeyBMb2dnZXIgfSBmcm9tICcuLi90eXBlcydcblxuZXhwb3J0IGludGVyZmFjZSBTZXJ2ZU9wdGlvbnMge1xuICBwb3J0PzogbnVtYmVyXG4gIGhvc3RuYW1lPzogc3RyaW5nXG4gIGRpcj86IHN0cmluZ1xuICBncmFjZT86IG51bWJlclxuICBsb2c/OiBMb2dnZXJcbn1cblxuZXhwb3J0IGNvbnN0IHNlcnZlID0gYXN5bmMgKG9wdGlvbnM6IFNlcnZlT3B0aW9ucyA9IHt9KSA9PiB7XG4gIGNvbnN0IHBvcnQgPSBvcHRpb25zLnBvcnQgfHwgMzAwMFxuICBjb25zdCBob3N0bmFtZSA9IG9wdGlvbnMuaG9zdG5hbWUgLy8gbm8gaG9zdCBiaW5kaW5nIGJ5IGRlZmF1bHQsIHRoZSBzYW1lIGFzIGBuZXh0IHN0YXJ0YFxuICBjb25zdCBkaXIgPSBvcHRpb25zLmRpciB8fCAnLidcbiAgY29uc3QgZ3JhY2UgPSBvcHRpb25zLmdyYWNlIHx8IDMwMDAwXG4gIGNvbnN0IGxvZyA9IG9wdGlvbnMubG9nIHx8ICgoKSA9PiBmYWxzZSlcblxuICBjb25zdCBzY3JpcHQgPSByZXF1aXJlLnJlc29sdmUoJy4vaW5pdCcpXG4gIGNvbnN0IHJlbmRlcmVyQXJncyA9IHsgc2NyaXB0LCBhcmdzOiB7IGRpciwgZGV2OiBmYWxzZSB9IH1cbiAgY29uc3QgY2FjaGVkID0gYXdhaXQgQ2FjaGVkSGFuZGxlcihyZW5kZXJlckFyZ3MsIHsgbG9nIH0pXG5cbiAgY29uc3Qgc2VydmVyID0gbmV3IGh0dHAuU2VydmVyKGNhY2hlZC5oYW5kbGVyKVxuICBzZXJ2ZXIubGlzdGVuKHBvcnQsIGhvc3RuYW1lLCAoKSA9PiB7XG4gICAgbG9nKCdpbmZvJywgYFNlcnZpbmcgb24gaHR0cDovLyR7aG9zdG5hbWUgfHwgJ2xvY2FsaG9zdCd9OiR7cG9ydH1gKVxuICB9KVxuXG4gIGdyYWNlZnVsU2h1dGRvd24oc2VydmVyLCB7XG4gICAgdGltZW91dDogZ3JhY2UsXG4gICAgcHJlU2h1dGRvd246IGFzeW5jICgpID0+IGxvZygnaW5mbycsICdQcmVwYXJpbmcgc2h1dGRvd24nKSxcbiAgICBvblNodXRkb3duOiBhc3luYyAoKSA9PiBjYWNoZWQuY2xvc2UoKSxcbiAgICBmaW5hbGx5OiAoKSA9PiBsb2coJ2luZm8nLCAnQ29tcGxldGVkIHNodXRkb3duJyksXG4gIH0pXG59XG4iXSwibmFtZXMiOlsicHJvY2VzcyIsImVudiIsIk5PREVfRU5WIiwic2VydmUiLCJvcHRpb25zIiwicG9ydCIsImhvc3RuYW1lIiwiZGlyIiwiZ3JhY2UiLCJsb2ciLCJzY3JpcHQiLCJyZXF1aXJlIiwicmVzb2x2ZSIsInJlbmRlcmVyQXJncyIsImFyZ3MiLCJkZXYiLCJjYWNoZWQiLCJzZXJ2ZXIiLCJTZXJ2ZXIiLCJoYW5kbGVyIiwibGlzdGVuIiwidGltZW91dCIsInByZVNodXRkb3duIiwib25TaHV0ZG93biIsImNsb3NlIiwiZmluYWxseSJdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBR2lCLEdBQU0sQ0FBTixLQUFNO0FBQ00sR0FBd0IsQ0FBeEIscUJBQXdCO0FBQzNCLEdBQVksQ0FBWixRQUFZOzs7Ozs7QUFKdENBLE9BQU8sQ0FBQ0MsR0FBRyxDQUFDQyxRQUFRLEdBQUcsQ0FBWTtBQWU1QixLQUFLLENBQUNDLEtBQUssVUFBVUMsT0FBcUIsR0FBRyxDQUFDO0FBQUEsQ0FBQyxHQUFLLENBQUM7SUFDMUQsS0FBSyxDQUFDQyxJQUFJLEdBQUdELE9BQU8sQ0FBQ0MsSUFBSSxJQUFJLElBQUk7SUFDakMsS0FBSyxDQUFDQyxRQUFRLEdBQUdGLE9BQU8sQ0FBQ0UsUUFBUSxBQUFDLENBQXVELEFBQXZELEVBQXVELEFBQXZELHFEQUF1RDs7SUFDekYsS0FBSyxDQUFDQyxHQUFHLEdBQUdILE9BQU8sQ0FBQ0csR0FBRyxJQUFJLENBQUc7SUFDOUIsS0FBSyxDQUFDQyxLQUFLLEdBQUdKLE9BQU8sQ0FBQ0ksS0FBSyxJQUFJLEtBQUs7SUFDcEMsS0FBSyxDQUFDQyxHQUFHLEdBQUdMLE9BQU8sQ0FBQ0ssR0FBRyxTQUFXLEtBQUs7O0lBRXZDLEtBQUssQ0FBQ0MsTUFBTSxHQUFHQyxPQUFPLENBQUNDLE9BQU8sQ0FBQyxDQUFRO0lBQ3ZDLEtBQUssQ0FBQ0MsWUFBWSxHQUFHLENBQUM7UUFBQ0gsTUFBTTtRQUFFSSxJQUFJLEVBQUUsQ0FBQztZQUFDUCxHQUFHO1lBQUVRLEdBQUcsRUFBRSxLQUFLO1FBQUMsQ0FBQztJQUFDLENBQUM7SUFDMUQsS0FBSyxDQUFDQyxNQUFNLEdBQUcsS0FBSyxLQXBCSSxRQUFZLFVBb0JESCxZQUFZLEVBQUUsQ0FBQztRQUFDSixHQUFHO0lBQUMsQ0FBQztJQUV4RCxLQUFLLENBQUNRLE1BQU0sR0FBRyxHQUFHLENBeEJILEtBQU0sU0F3QkdDLE1BQU0sQ0FBQ0YsTUFBTSxDQUFDRyxPQUFPO0lBQzdDRixNQUFNLENBQUNHLE1BQU0sQ0FBQ2YsSUFBSSxFQUFFQyxRQUFRLE1BQVEsQ0FBQztRQUNuQ0csR0FBRyxDQUFDLENBQU0sUUFBRyxrQkFBa0IsRUFBRUgsUUFBUSxJQUFJLENBQVcsV0FBQyxDQUFDLEVBQUVELElBQUk7SUFDbEUsQ0FBQztRQTFCMEIscUJBQXdCLFVBNEJsQ1ksTUFBTSxFQUFFLENBQUM7UUFDeEJJLE9BQU8sRUFBRWIsS0FBSztRQUNkYyxXQUFXLFlBQWNiLEdBQUcsQ0FBQyxDQUFNLE9BQUUsQ0FBb0I7O1FBQ3pEYyxVQUFVLFlBQWNQLE1BQU0sQ0FBQ1EsS0FBSzs7UUFDcENDLE9BQU8sTUFBUWhCLEdBQUcsQ0FBQyxDQUFNLE9BQUUsQ0FBb0I7SUFDakQsQ0FBQztBQUNILENBQUM7UUF0QllOLEtBQUssR0FBTEEsS0FBSyJ9