#!/usr/bin/env node
"use strict";
var _http = _interopRequireDefault(require("http"));
var _httpGracefulShutdown = _interopRequireDefault(require("http-graceful-shutdown"));
var _cli = require("../cli");
var _handler = _interopRequireDefault(require("../handler"));
var _utils = require("../utils");
function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
process.env.NODE_ENV = 'production';
const serve = async (argv)=>{
    const port = argv['--port'] || 3000;
    // no host binding by default, the same as `next start`
    const hostname = argv['--hostname'];
    const quiet = argv['--quiet'];
    const dir = argv['dir'] || '.';
    const grace = argv['--grace'] || 30000;
    const script = require.resolve('./init');
    const rendererArgs = {
        script,
        args: {
            dir,
            dev: false
        }
    };
    const cached = await (0, _handler).default(rendererArgs, {
        quiet
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
if (require.main === module) {
    const argv = (0, _cli).parse(process.argv);
    if (argv) serve(argv);
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9uZXh0L3NlcnZlci50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIjIS91c3IvYmluL2VudiBub2RlXG5wcm9jZXNzLmVudi5OT0RFX0VOViA9ICdwcm9kdWN0aW9uJ1xuXG5pbXBvcnQgaHR0cCBmcm9tICdodHRwJ1xuaW1wb3J0IGdyYWNlZnVsU2h1dGRvd24gZnJvbSAnaHR0cC1ncmFjZWZ1bC1zaHV0ZG93bidcblxuaW1wb3J0IHsgQXJndiwgcGFyc2UgfSBmcm9tICcuLi9jbGknXG5pbXBvcnQgQ2FjaGVkSGFuZGxlciBmcm9tICcuLi9oYW5kbGVyJ1xuaW1wb3J0IHsgbG9nIH0gZnJvbSAnLi4vdXRpbHMnXG5cbmNvbnN0IHNlcnZlID0gYXN5bmMgKGFyZ3Y6IEFyZ3YpID0+IHtcbiAgY29uc3QgcG9ydCA9IChhcmd2WyctLXBvcnQnXSBhcyBudW1iZXIpIHx8IDMwMDBcbiAgLy8gbm8gaG9zdCBiaW5kaW5nIGJ5IGRlZmF1bHQsIHRoZSBzYW1lIGFzIGBuZXh0IHN0YXJ0YFxuICBjb25zdCBob3N0bmFtZSA9IGFyZ3ZbJy0taG9zdG5hbWUnXSBhcyBzdHJpbmdcbiAgY29uc3QgcXVpZXQgPSBhcmd2WyctLXF1aWV0J10gYXMgYm9vbGVhblxuICBjb25zdCBkaXIgPSAoYXJndlsnZGlyJ10gYXMgc3RyaW5nKSB8fCAnLidcbiAgY29uc3QgZ3JhY2UgPSAoYXJndlsnLS1ncmFjZSddIGFzIG51bWJlcikgfHwgMzAwMDBcblxuICBjb25zdCBzY3JpcHQgPSByZXF1aXJlLnJlc29sdmUoJy4vaW5pdCcpXG4gIGNvbnN0IHJlbmRlcmVyQXJncyA9IHsgc2NyaXB0LCBhcmdzOiB7IGRpciwgZGV2OiBmYWxzZSB9IH1cbiAgY29uc3QgY2FjaGVkID0gYXdhaXQgQ2FjaGVkSGFuZGxlcihyZW5kZXJlckFyZ3MsIHsgcXVpZXQgfSlcblxuICBjb25zdCBzZXJ2ZXIgPSBuZXcgaHR0cC5TZXJ2ZXIoY2FjaGVkLmhhbmRsZXIpXG4gIHNlcnZlci5saXN0ZW4ocG9ydCwgaG9zdG5hbWUsICgpID0+IHtcbiAgICBsb2coJ2luZm8nLCBgU2VydmluZyBvbiBodHRwOi8vJHtob3N0bmFtZSB8fCAnbG9jYWxob3N0J306JHtwb3J0fWApXG4gIH0pXG5cbiAgZ3JhY2VmdWxTaHV0ZG93bihzZXJ2ZXIsIHtcbiAgICB0aW1lb3V0OiBncmFjZSxcbiAgICBwcmVTaHV0ZG93bjogYXN5bmMgKCkgPT4gbG9nKCdpbmZvJywgJ1ByZXBhcmluZyBzaHV0ZG93bicpLFxuICAgIG9uU2h1dGRvd246IGFzeW5jICgpID0+IGNhY2hlZC5jbG9zZSgpLFxuICAgIGZpbmFsbHk6ICgpID0+IGxvZygnaW5mbycsICdDb21wbGV0ZWQgc2h1dGRvd24nKSxcbiAgfSlcbn1cblxuaWYgKHJlcXVpcmUubWFpbiA9PT0gbW9kdWxlKSB7XG4gIGNvbnN0IGFyZ3YgPSBwYXJzZShwcm9jZXNzLmFyZ3YpXG4gIGlmIChhcmd2KSBzZXJ2ZShhcmd2KVxufVxuIl0sIm5hbWVzIjpbInByb2Nlc3MiLCJlbnYiLCJOT0RFX0VOViIsInNlcnZlIiwiYXJndiIsInBvcnQiLCJob3N0bmFtZSIsInF1aWV0IiwiZGlyIiwiZ3JhY2UiLCJzY3JpcHQiLCJyZXF1aXJlIiwicmVzb2x2ZSIsInJlbmRlcmVyQXJncyIsImFyZ3MiLCJkZXYiLCJjYWNoZWQiLCJzZXJ2ZXIiLCJTZXJ2ZXIiLCJoYW5kbGVyIiwibGlzdGVuIiwidGltZW91dCIsInByZVNodXRkb3duIiwib25TaHV0ZG93biIsImNsb3NlIiwiZmluYWxseSIsIm1haW4iLCJtb2R1bGUiXSwibWFwcGluZ3MiOiI7O0FBR2lCLEdBQU0sQ0FBTixLQUFNO0FBQ00sR0FBd0IsQ0FBeEIscUJBQXdCO0FBRXpCLEdBQVEsQ0FBUixJQUFRO0FBQ1YsR0FBWSxDQUFaLFFBQVk7QUFDbEIsR0FBVSxDQUFWLE1BQVU7Ozs7OztBQVA5QkEsT0FBTyxDQUFDQyxHQUFHLENBQUNDLFFBQVEsR0FBRyxDQUFZO0FBU25DLEtBQUssQ0FBQ0MsS0FBSyxVQUFVQyxJQUFVLEdBQUssQ0FBQztJQUNuQyxLQUFLLENBQUNDLElBQUksR0FBSUQsSUFBSSxDQUFDLENBQVEsWUFBZ0IsSUFBSTtJQUMvQyxFQUF1RCxBQUF2RCxxREFBdUQ7SUFDdkQsS0FBSyxDQUFDRSxRQUFRLEdBQUdGLElBQUksQ0FBQyxDQUFZO0lBQ2xDLEtBQUssQ0FBQ0csS0FBSyxHQUFHSCxJQUFJLENBQUMsQ0FBUztJQUM1QixLQUFLLENBQUNJLEdBQUcsR0FBSUosSUFBSSxDQUFDLENBQUssU0FBZ0IsQ0FBRztJQUMxQyxLQUFLLENBQUNLLEtBQUssR0FBSUwsSUFBSSxDQUFDLENBQVMsYUFBZ0IsS0FBSztJQUVsRCxLQUFLLENBQUNNLE1BQU0sR0FBR0MsT0FBTyxDQUFDQyxPQUFPLENBQUMsQ0FBUTtJQUN2QyxLQUFLLENBQUNDLFlBQVksR0FBRyxDQUFDO1FBQUNILE1BQU07UUFBRUksSUFBSSxFQUFFLENBQUM7WUFBQ04sR0FBRztZQUFFTyxHQUFHLEVBQUUsS0FBSztRQUFDLENBQUM7SUFBQyxDQUFDO0lBQzFELEtBQUssQ0FBQ0MsTUFBTSxHQUFHLEtBQUssS0FiSSxRQUFZLFVBYURILFlBQVksRUFBRSxDQUFDO1FBQUNOLEtBQUs7SUFBQyxDQUFDO0lBRTFELEtBQUssQ0FBQ1UsTUFBTSxHQUFHLEdBQUcsQ0FuQkgsS0FBTSxTQW1CR0MsTUFBTSxDQUFDRixNQUFNLENBQUNHLE9BQU87SUFDN0NGLE1BQU0sQ0FBQ0csTUFBTSxDQUFDZixJQUFJLEVBQUVDLFFBQVEsTUFBUSxDQUFDO1lBZm5CLE1BQVUsTUFnQnRCLENBQU0sUUFBRyxrQkFBa0IsRUFBRUEsUUFBUSxJQUFJLENBQVcsV0FBQyxDQUFDLEVBQUVELElBQUk7SUFDbEUsQ0FBQztRQXJCMEIscUJBQXdCLFVBdUJsQ1ksTUFBTSxFQUFFLENBQUM7UUFDeEJJLE9BQU8sRUFBRVosS0FBSztRQUNkYSxXQUFXLGdCQXJCSyxNQUFVLE1BcUJHLENBQU0sT0FBRSxDQUFvQjs7UUFDekRDLFVBQVUsWUFBY1AsTUFBTSxDQUFDUSxLQUFLOztRQUNwQ0MsT0FBTyxVQXZCUyxNQUFVLE1BdUJQLENBQU0sT0FBRSxDQUFvQjtJQUNqRCxDQUFDO0FBQ0gsQ0FBQztBQUVELEVBQUUsRUFBRWQsT0FBTyxDQUFDZSxJQUFJLEtBQUtDLE1BQU0sRUFBRSxDQUFDO0lBQzVCLEtBQUssQ0FBQ3ZCLElBQUksT0E5QmdCLElBQVEsUUE4QmZKLE9BQU8sQ0FBQ0ksSUFBSTtJQUMvQixFQUFFLEVBQUVBLElBQUksRUFBRUQsS0FBSyxDQUFDQyxJQUFJO0FBQ3RCLENBQUMifQ==