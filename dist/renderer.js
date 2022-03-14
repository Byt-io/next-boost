"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = void 0;
var _http = _interopRequireDefault(require("http"));
var _multee = _interopRequireDefault(require("multee"));
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
const { createHandler , start  } = (0, _multee).default('worker');
let server;
const init = createHandler('init', async (args)=>{
    if (!args) throw new Error('args is required');
    const fn = require(args.script).default;
    server = new _http.default.Server(await fn(args.args)).listen(0);
});
const render = createHandler('renderer', async (options)=>{
    return new Promise((resolve, reject)=>{
        const addr = server.address();
        if (typeof addr !== 'object' || !addr) {
            return reject('Failed to create server in renderer');
        }
        const args = _extends({
            hostname: '127.0.0.1',
            port: addr.port
        }, options);
        const req = _http.default.request(args, (res)=>{
            let body = Buffer.from('');
            res.on('data', (chunk)=>body = Buffer.concat([
                    body,
                    chunk
                ])
            );
            var _statusCode;
            res.on('end', ()=>resolve({
                    headers: res.headers,
                    statusCode: (_statusCode = res.statusCode) != null ? _statusCode : 200,
                    body
                })
            );
        });
        req.on('error', (e)=>reject(`Failed in renderer: ${e.message}`)
        );
        req.end();
    });
});
var _default = ()=>{
    const child = start(__filename);
    return {
        init: init(child),
        render: render(child),
        kill: ()=>child.terminate()
    };
};
exports.default = _default;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9yZW5kZXJlci50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgaHR0cCBmcm9tICdodHRwJ1xuaW1wb3J0IE11bHRlZSBmcm9tICdtdWx0ZWUnXG5cbmNvbnN0IHsgY3JlYXRlSGFuZGxlciwgc3RhcnQgfSA9IE11bHRlZSgnd29ya2VyJylcblxuZXhwb3J0IHR5cGUgUmVxdWVzdExpc3RlbmVyID0gKFxuICByZXE6IGh0dHAuSW5jb21pbmdNZXNzYWdlLFxuICByZXM6IGh0dHAuU2VydmVyUmVzcG9uc2UsXG4pID0+IFByb21pc2U8dm9pZD4gfCB2b2lkXG5cbnR5cGUgUmVuZGVyT3B0aW9ucyA9IHtcbiAgcGF0aD86IHN0cmluZ1xuICBtZXRob2Q/OiBzdHJpbmdcbiAgaGVhZGVycz86IHsgW2tleTogc3RyaW5nXTogYW55IH1cbn1cblxuZXhwb3J0IHR5cGUgUmVuZGVyUmVzdWx0ID0ge1xuICBzdGF0dXNDb2RlOiBudW1iZXJcbiAgaGVhZGVyczogeyBba2V5OiBzdHJpbmddOiBhbnkgfVxuICBib2R5OiBhbnlcbn1cblxubGV0IHNlcnZlcjogaHR0cC5TZXJ2ZXJcblxuZXhwb3J0IHR5cGUgSW5pdEFyZ3MgPSB7IHNjcmlwdDogc3RyaW5nOyBhcmdzPzogYW55IH1cblxuY29uc3QgaW5pdCA9IGNyZWF0ZUhhbmRsZXIoJ2luaXQnLCBhc3luYyAoYXJnczogSW5pdEFyZ3MgfCB1bmRlZmluZWQpID0+IHtcbiAgaWYgKCFhcmdzKSB0aHJvdyBuZXcgRXJyb3IoJ2FyZ3MgaXMgcmVxdWlyZWQnKVxuICBjb25zdCBmbiA9IHJlcXVpcmUoYXJncy5zY3JpcHQpLmRlZmF1bHRcbiAgc2VydmVyID0gbmV3IGh0dHAuU2VydmVyKGF3YWl0IGZuKGFyZ3MuYXJncykpLmxpc3RlbigwKVxufSlcblxuY29uc3QgcmVuZGVyID0gY3JlYXRlSGFuZGxlcihcbiAgJ3JlbmRlcmVyJyxcbiAgYXN5bmMgKG9wdGlvbnM6IFJlbmRlck9wdGlvbnMgfCB1bmRlZmluZWQpOiBQcm9taXNlPFJlbmRlclJlc3VsdD4gPT4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICBjb25zdCBhZGRyID0gc2VydmVyLmFkZHJlc3MoKVxuICAgICAgaWYgKHR5cGVvZiBhZGRyICE9PSAnb2JqZWN0JyB8fCAhYWRkcikge1xuICAgICAgICByZXR1cm4gcmVqZWN0KCdGYWlsZWQgdG8gY3JlYXRlIHNlcnZlciBpbiByZW5kZXJlcicpXG4gICAgICB9XG4gICAgICBjb25zdCBhcmdzID0geyBob3N0bmFtZTogJzEyNy4wLjAuMScsIHBvcnQ6IGFkZHIucG9ydCwgLi4ub3B0aW9ucyB9XG4gICAgICBjb25zdCByZXEgPSBodHRwLnJlcXVlc3QoYXJncywgcmVzID0+IHtcbiAgICAgICAgbGV0IGJvZHkgPSBCdWZmZXIuZnJvbSgnJylcbiAgICAgICAgcmVzLm9uKCdkYXRhJywgY2h1bmsgPT4gKGJvZHkgPSBCdWZmZXIuY29uY2F0KFtib2R5LCBjaHVua10pKSlcbiAgICAgICAgcmVzLm9uKCdlbmQnLCAoKSA9PlxuICAgICAgICAgIHJlc29sdmUoeyBoZWFkZXJzOiByZXMuaGVhZGVycywgc3RhdHVzQ29kZTogcmVzLnN0YXR1c0NvZGUgPz8gMjAwLCBib2R5IH0pLFxuICAgICAgICApXG4gICAgICB9KVxuICAgICAgcmVxLm9uKCdlcnJvcicsIGUgPT4gcmVqZWN0KGBGYWlsZWQgaW4gcmVuZGVyZXI6ICR7ZS5tZXNzYWdlfWApKVxuICAgICAgcmVxLmVuZCgpXG4gICAgfSlcbiAgfSxcbilcblxuZXhwb3J0IGRlZmF1bHQgKCkgPT4ge1xuICBjb25zdCBjaGlsZCA9IHN0YXJ0KF9fZmlsZW5hbWUpXG4gIHJldHVybiB7XG4gICAgaW5pdDogaW5pdChjaGlsZCksXG4gICAgcmVuZGVyOiByZW5kZXIoY2hpbGQpLFxuICAgIGtpbGw6ICgpID0+IGNoaWxkLnRlcm1pbmF0ZSgpLFxuICB9XG59XG4iXSwibmFtZXMiOlsiY3JlYXRlSGFuZGxlciIsInN0YXJ0Iiwic2VydmVyIiwiaW5pdCIsImFyZ3MiLCJFcnJvciIsImZuIiwicmVxdWlyZSIsInNjcmlwdCIsImRlZmF1bHQiLCJTZXJ2ZXIiLCJsaXN0ZW4iLCJyZW5kZXIiLCJvcHRpb25zIiwiUHJvbWlzZSIsInJlc29sdmUiLCJyZWplY3QiLCJhZGRyIiwiYWRkcmVzcyIsImhvc3RuYW1lIiwicG9ydCIsInJlcSIsInJlcXVlc3QiLCJyZXMiLCJib2R5IiwiQnVmZmVyIiwiZnJvbSIsIm9uIiwiY2h1bmsiLCJjb25jYXQiLCJoZWFkZXJzIiwic3RhdHVzQ29kZSIsImUiLCJtZXNzYWdlIiwiZW5kIiwiY2hpbGQiLCJfX2ZpbGVuYW1lIiwia2lsbCIsInRlcm1pbmF0ZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBaUIsR0FBTSxDQUFOLEtBQU07QUFDSixHQUFRLENBQVIsT0FBUTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFFM0IsS0FBSyxDQUFDLENBQUMsQ0FBQ0EsYUFBYSxHQUFFQyxLQUFLLEVBQUMsQ0FBQyxPQUZYLE9BQVEsVUFFYSxDQUFRO0FBbUJoRCxHQUFHLENBQUNDLE1BQU07QUFJVixLQUFLLENBQUNDLElBQUksR0FBR0gsYUFBYSxDQUFDLENBQU0sY0FBU0ksSUFBMEIsR0FBSyxDQUFDO0lBQ3hFLEVBQUUsR0FBR0EsSUFBSSxFQUFFLEtBQUssQ0FBQyxHQUFHLENBQUNDLEtBQUssQ0FBQyxDQUFrQjtJQUM3QyxLQUFLLENBQUNDLEVBQUUsR0FBR0MsT0FBTyxDQUFDSCxJQUFJLENBQUNJLE1BQU0sRUFBRUMsT0FBTztJQUN2Q1AsTUFBTSxHQUFHLEdBQUcsQ0E3QkcsS0FBTSxTQTZCSFEsTUFBTSxDQUFDLEtBQUssQ0FBQ0osRUFBRSxDQUFDRixJQUFJLENBQUNBLElBQUksR0FBR08sTUFBTSxDQUFDLENBQUM7QUFDeEQsQ0FBQztBQUVELEtBQUssQ0FBQ0MsTUFBTSxHQUFHWixhQUFhLENBQzFCLENBQVUsa0JBQ0hhLE9BQWtDLEdBQTRCLENBQUM7SUFDcEUsTUFBTSxDQUFDLEdBQUcsQ0FBQ0MsT0FBTyxFQUFFQyxPQUFPLEVBQUVDLE1BQU0sR0FBSyxDQUFDO1FBQ3ZDLEtBQUssQ0FBQ0MsSUFBSSxHQUFHZixNQUFNLENBQUNnQixPQUFPO1FBQzNCLEVBQUUsRUFBRSxNQUFNLENBQUNELElBQUksS0FBSyxDQUFRLFlBQUtBLElBQUksRUFBRSxDQUFDO1lBQ3RDLE1BQU0sQ0FBQ0QsTUFBTSxDQUFDLENBQXFDO1FBQ3JELENBQUM7UUFDRCxLQUFLLENBQUNaLElBQUk7WUFBS2UsUUFBUSxFQUFFLENBQVc7WUFBRUMsSUFBSSxFQUFFSCxJQUFJLENBQUNHLElBQUk7V0FBS1AsT0FBTztRQUNqRSxLQUFLLENBQUNRLEdBQUcsR0F6Q0UsS0FBTSxTQXlDQUMsT0FBTyxDQUFDbEIsSUFBSSxHQUFFbUIsR0FBRyxHQUFJLENBQUM7WUFDckMsR0FBRyxDQUFDQyxJQUFJLEdBQUdDLE1BQU0sQ0FBQ0MsSUFBSSxDQUFDLENBQUU7WUFDekJILEdBQUcsQ0FBQ0ksRUFBRSxDQUFDLENBQU0sUUFBRUMsS0FBSyxHQUFLSixJQUFJLEdBQUdDLE1BQU0sQ0FBQ0ksTUFBTSxDQUFDLENBQUNMO29CQUFBQSxJQUFJO29CQUFFSSxLQUFLO2dCQUFBLENBQUM7O2dCQUViTCxXQUFjO1lBRDVEQSxHQUFHLENBQUNJLEVBQUUsQ0FBQyxDQUFLLFVBQ1ZaLE9BQU8sQ0FBQyxDQUFDO29CQUFDZSxPQUFPLEVBQUVQLEdBQUcsQ0FBQ08sT0FBTztvQkFBRUMsVUFBVSxHQUFFUixXQUFjLEdBQWRBLEdBQUcsQ0FBQ1EsVUFBVSxZQUFkUixXQUFjLEdBQUksR0FBRztvQkFBRUMsSUFBSTtnQkFBQyxDQUFDOztRQUU3RSxDQUFDO1FBQ0RILEdBQUcsQ0FBQ00sRUFBRSxDQUFDLENBQU8sU0FBRUssQ0FBQyxHQUFJaEIsTUFBTSxFQUFFLG9CQUFvQixFQUFFZ0IsQ0FBQyxDQUFDQyxPQUFPOztRQUM1RFosR0FBRyxDQUFDYSxHQUFHO0lBQ1QsQ0FBQztBQUNILENBQUM7bUJBR2tCLENBQUM7SUFDcEIsS0FBSyxDQUFDQyxLQUFLLEdBQUdsQyxLQUFLLENBQUNtQyxVQUFVO0lBQzlCLE1BQU0sQ0FBQyxDQUFDO1FBQ05qQyxJQUFJLEVBQUVBLElBQUksQ0FBQ2dDLEtBQUs7UUFDaEJ2QixNQUFNLEVBQUVBLE1BQU0sQ0FBQ3VCLEtBQUs7UUFDcEJFLElBQUksTUFBUUYsS0FBSyxDQUFDRyxTQUFTO0lBQzdCLENBQUM7QUFDSCxDQUFDIn0=