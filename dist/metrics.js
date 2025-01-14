"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.serveMetrics = serveMetrics;
exports.forMetrics = forMetrics;
async function serveMetrics(m, res) {
    res.setHeader('content-type', 'text/plain; version=0.0.4');
    Object.keys(m.data).forEach((k)=>{
        res.write(`next_boost_requests_total{status='${k}'} ${m.data[k]}\n`);
    });
    res.end();
}
function forMetrics(req) {
    return req.url === '/__nextboost_metrics';
}
let Metrics = class Metrics {
    inc(key) {
        return this.data[key] = (this.data[key] || 0) + 1;
    }
    constructor(){
        this.data = {
        };
    }
};
exports.Metrics = Metrics;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9tZXRyaWNzLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEluY29taW5nTWVzc2FnZSwgU2VydmVyUmVzcG9uc2UgfSBmcm9tICdodHRwJ1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc2VydmVNZXRyaWNzKG06IE1ldHJpY3MsIHJlczogU2VydmVyUmVzcG9uc2UpIHtcbiAgcmVzLnNldEhlYWRlcignY29udGVudC10eXBlJywgJ3RleHQvcGxhaW47IHZlcnNpb249MC4wLjQnKVxuICBPYmplY3Qua2V5cyhtLmRhdGEpLmZvckVhY2goayA9PiB7XG4gICAgcmVzLndyaXRlKGBuZXh0X2Jvb3N0X3JlcXVlc3RzX3RvdGFse3N0YXR1cz0nJHtrfSd9ICR7bS5kYXRhW2tdfVxcbmApXG4gIH0pXG4gIHJlcy5lbmQoKVxufVxuXG5leHBvcnQgZnVuY3Rpb24gZm9yTWV0cmljcyhyZXE6IEluY29taW5nTWVzc2FnZSkge1xuICByZXR1cm4gcmVxLnVybCA9PT0gJy9fX25leHRib29zdF9tZXRyaWNzJ1xufVxuXG5leHBvcnQgY2xhc3MgTWV0cmljcyB7XG4gIGRhdGE6IFJlY29yZDxzdHJpbmcsIG51bWJlcj4gPSB7fVxuXG4gIGluYyhrZXk6IHN0cmluZykge1xuICAgIHJldHVybiAodGhpcy5kYXRhW2tleV0gPSAodGhpcy5kYXRhW2tleV0gfHwgMCkgKyAxKVxuICB9XG59XG4iXSwibmFtZXMiOlsic2VydmVNZXRyaWNzIiwiZm9yTWV0cmljcyIsIm0iLCJyZXMiLCJzZXRIZWFkZXIiLCJPYmplY3QiLCJrZXlzIiwiZGF0YSIsImZvckVhY2giLCJrIiwid3JpdGUiLCJlbmQiLCJyZXEiLCJ1cmwiLCJNZXRyaWNzIiwiaW5jIiwia2V5Il0sIm1hcHBpbmdzIjoiOzs7O1FBRXNCQSxZQUFZLEdBQVpBLFlBQVk7UUFRbEJDLFVBQVUsR0FBVkEsVUFBVTtlQVJKRCxZQUFZLENBQUNFLENBQVUsRUFBRUMsR0FBbUIsRUFBRSxDQUFDO0lBQ25FQSxHQUFHLENBQUNDLFNBQVMsQ0FBQyxDQUFjLGVBQUUsQ0FBMkI7SUFDekRDLE1BQU0sQ0FBQ0MsSUFBSSxDQUFDSixDQUFDLENBQUNLLElBQUksRUFBRUMsT0FBTyxFQUFDQyxDQUFDLEdBQUksQ0FBQztRQUNoQ04sR0FBRyxDQUFDTyxLQUFLLEVBQUUsa0NBQWtDLEVBQUVELENBQUMsQ0FBQyxHQUFHLEVBQUVQLENBQUMsQ0FBQ0ssSUFBSSxDQUFDRSxDQUFDLEVBQUUsRUFBRTtJQUNwRSxDQUFDO0lBQ0ROLEdBQUcsQ0FBQ1EsR0FBRztBQUNULENBQUM7U0FFZVYsVUFBVSxDQUFDVyxHQUFvQixFQUFFLENBQUM7SUFDaEQsTUFBTSxDQUFDQSxHQUFHLENBQUNDLEdBQUcsS0FBSyxDQUFzQjtBQUMzQyxDQUFDO0FBRU0sR0FBSyxDQUFDQyxPQUFPLFNBQVBBLE9BQU87SUFHbEJDLEdBQUcsQ0FBQ0MsR0FBVyxFQUFFLENBQUM7UUFDaEIsTUFBTSxDQUFFLElBQUksQ0FBQ1QsSUFBSSxDQUFDUyxHQUFHLEtBQUssSUFBSSxDQUFDVCxJQUFJLENBQUNTLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQztJQUNwRCxDQUFDOztRQUxJLElBTU4sQ0FMQ1QsSUFBSSxHQUEyQixDQUFDO1FBQUEsQ0FBQzs7O1FBRHRCTyxPQUFPLEdBQVBBLE9BQU8ifQ==