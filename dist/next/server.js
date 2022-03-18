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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9uZXh0L3NlcnZlci50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIjIS91c3IvYmluL2VudiBub2RlXG5wcm9jZXNzLmVudi5OT0RFX0VOViA9ICdwcm9kdWN0aW9uJ1xuXG5pbXBvcnQgaHR0cCBmcm9tICdodHRwJ1xuaW1wb3J0IGdyYWNlZnVsU2h1dGRvd24gZnJvbSAnaHR0cC1ncmFjZWZ1bC1zaHV0ZG93bidcblxuaW1wb3J0IHsgQXJndiwgcGFyc2UgfSBmcm9tICcuLi9jbGknXG5pbXBvcnQgQ2FjaGVkSGFuZGxlciBmcm9tICcuLi9oYW5kbGVyJ1xuaW1wb3J0IHsgbG9nIH0gZnJvbSAnLi4vdXRpbHMnXG5cbmV4cG9ydCBpbnRlcmZhY2UgU2VydmVPcHRpb25zIHtcbiAgcG9ydD86IG51bWJlclxuICBob3N0bmFtZT86IHN0cmluZ1xuICBkaXI/OiBzdHJpbmdcbiAgZ3JhY2U/OiBudW1iZXJcbn1cblxuZXhwb3J0IGNvbnN0IHNlcnZlID0gYXN5bmMgKG9wdGlvbnM6IFNlcnZlT3B0aW9ucyA9IHt9KSA9PiB7XG4gIGNvbnN0IHBvcnQgPSBvcHRpb25zLnBvcnQgfHwgMzAwMFxuICBjb25zdCBob3N0bmFtZSA9IG9wdGlvbnMuaG9zdG5hbWUgLy8gbm8gaG9zdCBiaW5kaW5nIGJ5IGRlZmF1bHQsIHRoZSBzYW1lIGFzIGBuZXh0IHN0YXJ0YFxuICBjb25zdCBkaXIgPSBvcHRpb25zLmRpciB8fCAnLidcbiAgY29uc3QgZ3JhY2UgPSBvcHRpb25zLmdyYWNlIHx8IDMwMDAwXG5cbiAgY29uc3Qgc2NyaXB0ID0gcmVxdWlyZS5yZXNvbHZlKCcuL2luaXQnKVxuICBjb25zdCByZW5kZXJlckFyZ3MgPSB7IHNjcmlwdCwgYXJnczogeyBkaXIsIGRldjogZmFsc2UgfSB9XG4gIGNvbnN0IGNhY2hlZCA9IGF3YWl0IENhY2hlZEhhbmRsZXIocmVuZGVyZXJBcmdzKVxuXG4gIGNvbnN0IHNlcnZlciA9IG5ldyBodHRwLlNlcnZlcihjYWNoZWQuaGFuZGxlcilcbiAgc2VydmVyLmxpc3Rlbihwb3J0LCBob3N0bmFtZSwgKCkgPT4ge1xuICAgIGxvZygnaW5mbycsIGBTZXJ2aW5nIG9uIGh0dHA6Ly8ke2hvc3RuYW1lIHx8ICdsb2NhbGhvc3QnfToke3BvcnR9YClcbiAgfSlcblxuICBncmFjZWZ1bFNodXRkb3duKHNlcnZlciwge1xuICAgIHRpbWVvdXQ6IGdyYWNlLFxuICAgIHByZVNodXRkb3duOiBhc3luYyAoKSA9PiBsb2coJ2luZm8nLCAnUHJlcGFyaW5nIHNodXRkb3duJyksXG4gICAgb25TaHV0ZG93bjogYXN5bmMgKCkgPT4gY2FjaGVkLmNsb3NlKCksXG4gICAgZmluYWxseTogKCkgPT4gbG9nKCdpbmZvJywgJ0NvbXBsZXRlZCBzaHV0ZG93bicpLFxuICB9KVxufVxuIl0sIm5hbWVzIjpbInByb2Nlc3MiLCJlbnYiLCJOT0RFX0VOViIsInNlcnZlIiwib3B0aW9ucyIsInBvcnQiLCJob3N0bmFtZSIsImRpciIsImdyYWNlIiwic2NyaXB0IiwicmVxdWlyZSIsInJlc29sdmUiLCJyZW5kZXJlckFyZ3MiLCJhcmdzIiwiZGV2IiwiY2FjaGVkIiwic2VydmVyIiwiU2VydmVyIiwiaGFuZGxlciIsImxpc3RlbiIsInRpbWVvdXQiLCJwcmVTaHV0ZG93biIsIm9uU2h1dGRvd24iLCJjbG9zZSIsImZpbmFsbHkiXSwibWFwcGluZ3MiOiI7Ozs7OztBQUdpQixHQUFNLENBQU4sS0FBTTtBQUNNLEdBQXdCLENBQXhCLHFCQUF3QjtBQUczQixHQUFZLENBQVosUUFBWTtBQUNsQixHQUFVLENBQVYsTUFBVTs7Ozs7O0FBUDlCQSxPQUFPLENBQUNDLEdBQUcsQ0FBQ0MsUUFBUSxHQUFHLENBQVk7QUFnQjVCLEtBQUssQ0FBQ0MsS0FBSyxVQUFVQyxPQUFxQixHQUFHLENBQUM7QUFBQSxDQUFDLEdBQUssQ0FBQztJQUMxRCxLQUFLLENBQUNDLElBQUksR0FBR0QsT0FBTyxDQUFDQyxJQUFJLElBQUksSUFBSTtJQUNqQyxLQUFLLENBQUNDLFFBQVEsR0FBR0YsT0FBTyxDQUFDRSxRQUFRLEFBQUMsQ0FBdUQsQUFBdkQsRUFBdUQsQUFBdkQscURBQXVEOztJQUN6RixLQUFLLENBQUNDLEdBQUcsR0FBR0gsT0FBTyxDQUFDRyxHQUFHLElBQUksQ0FBRztJQUM5QixLQUFLLENBQUNDLEtBQUssR0FBR0osT0FBTyxDQUFDSSxLQUFLLElBQUksS0FBSztJQUVwQyxLQUFLLENBQUNDLE1BQU0sR0FBR0MsT0FBTyxDQUFDQyxPQUFPLENBQUMsQ0FBUTtJQUN2QyxLQUFLLENBQUNDLFlBQVksR0FBRyxDQUFDO1FBQUNILE1BQU07UUFBRUksSUFBSSxFQUFFLENBQUM7WUFBQ04sR0FBRztZQUFFTyxHQUFHLEVBQUUsS0FBSztRQUFDLENBQUM7SUFBQyxDQUFDO0lBQzFELEtBQUssQ0FBQ0MsTUFBTSxHQUFHLEtBQUssS0FsQkksUUFBWSxVQWtCREgsWUFBWTtJQUUvQyxLQUFLLENBQUNJLE1BQU0sR0FBRyxHQUFHLENBeEJILEtBQU0sU0F3QkdDLE1BQU0sQ0FBQ0YsTUFBTSxDQUFDRyxPQUFPO0lBQzdDRixNQUFNLENBQUNHLE1BQU0sQ0FBQ2QsSUFBSSxFQUFFQyxRQUFRLE1BQVEsQ0FBQztZQXBCbkIsTUFBVSxNQXFCdEIsQ0FBTSxRQUFHLGtCQUFrQixFQUFFQSxRQUFRLElBQUksQ0FBVyxXQUFDLENBQUMsRUFBRUQsSUFBSTtJQUNsRSxDQUFDO1FBMUIwQixxQkFBd0IsVUE0QmxDVyxNQUFNLEVBQUUsQ0FBQztRQUN4QkksT0FBTyxFQUFFWixLQUFLO1FBQ2RhLFdBQVcsZ0JBMUJLLE1BQVUsTUEwQkcsQ0FBTSxPQUFFLENBQW9COztRQUN6REMsVUFBVSxZQUFjUCxNQUFNLENBQUNRLEtBQUs7O1FBQ3BDQyxPQUFPLFVBNUJTLE1BQVUsTUE0QlAsQ0FBTSxPQUFFLENBQW9CO0lBQ2pELENBQUM7QUFDSCxDQUFDO1FBckJZckIsS0FBSyxHQUFMQSxLQUFLIn0=