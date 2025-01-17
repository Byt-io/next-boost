"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.encodePayload = encodePayload;
exports.decodePayload = decodePayload;
const MAGIC = Buffer.from('%NB%');
const LENGTH_SIZE = 4;
function encodePayload({ headers , body  }) {
    const headerBuffer = Buffer.from(JSON.stringify(headers));
    const headerLength = Buffer.alloc(LENGTH_SIZE);
    headerLength.writeUInt32BE(headerBuffer.length, 0);
    return Buffer.concat([
        MAGIC,
        headerLength,
        headerBuffer,
        body ? body : Buffer.alloc(0)
    ]);
}
function decodePayload(payload) {
    if (!payload) return {
        headers: {
        },
        body: Buffer.alloc(0)
    };
    const magic = payload.slice(0, MAGIC.length);
    if (MAGIC.compare(magic) !== 0) throw new Error('Invalid payload');
    const headerLength = payload.readUInt32BE(MAGIC.length);
    const headerBuffer = payload.slice(MAGIC.length + LENGTH_SIZE, MAGIC.length + LENGTH_SIZE + headerLength);
    const headers = JSON.parse(headerBuffer.toString());
    const body = payload.slice(MAGIC.length + LENGTH_SIZE + headerLength);
    return {
        headers,
        body
    };
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9wYXlsb2FkLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCB0eXBlIFBhZ2VQYXlsb2FkID0ge1xuICBoZWFkZXJzOiBhbnlcbiAgYm9keTogQnVmZmVyXG59XG5cbmNvbnN0IE1BR0lDID0gQnVmZmVyLmZyb20oJyVOQiUnKVxuY29uc3QgTEVOR1RIX1NJWkUgPSA0XG5cbi8qKlxuICogUGFja2FnZSB0aGUgaGVhZGVycyBhbmQgYm9keSBvZiBhIHBhZ2UgdG8gYSBiaW5hcnkgZm9ybWF0LlxuICogVGhlIGZvcm1hdCB3aWxsIGJlIGAlTkIlYCArIGxlbmd0aCBvZiB0aGUgaGVhZGVycyArIGhlYWRlcnMgKyBib2R5LlxuICpcbiAqIEBwYXJhbSBwYXlsb2FkIFRoZSBwYWdlIHBheWxvYWQuXG4gKiBAcmV0dXJucyBUaGUgYmluYXJ5IHBheWxvYWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbmNvZGVQYXlsb2FkKHsgaGVhZGVycywgYm9keSB9OiBQYWdlUGF5bG9hZCk6IEJ1ZmZlciB7XG4gIGNvbnN0IGhlYWRlckJ1ZmZlciA9IEJ1ZmZlci5mcm9tKEpTT04uc3RyaW5naWZ5KGhlYWRlcnMpKVxuICBjb25zdCBoZWFkZXJMZW5ndGggPSBCdWZmZXIuYWxsb2MoTEVOR1RIX1NJWkUpXG4gIGhlYWRlckxlbmd0aC53cml0ZVVJbnQzMkJFKGhlYWRlckJ1ZmZlci5sZW5ndGgsIDApXG4gIHJldHVybiBCdWZmZXIuY29uY2F0KFtNQUdJQywgaGVhZGVyTGVuZ3RoLCBoZWFkZXJCdWZmZXIsIGJvZHkgPyBib2R5IDogQnVmZmVyLmFsbG9jKDApXSlcbn1cblxuLyoqXG4gKiBSZWFkIHRoZSBoZWFkZXJzIGFuZCBib2R5IG9mIGEgcGFnZSBmcm9tIGEgYmluYXJ5IHBheWxvYWQuXG4gKlxuICogQHBhcmFtIHBheWxvYWQgVGhlIGJpbmFyeSBwYXlsb2FkLlxuICogQHJldHVybnMgVGhlIHBhZ2UgcGF5bG9hZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRlY29kZVBheWxvYWQocGF5bG9hZDogQnVmZmVyIHwgdW5kZWZpbmVkKTogUGFnZVBheWxvYWQge1xuICBpZiAoIXBheWxvYWQpIHJldHVybiB7IGhlYWRlcnM6IHt9LCBib2R5OiBCdWZmZXIuYWxsb2MoMCkgfVxuICBjb25zdCBtYWdpYyA9IHBheWxvYWQuc2xpY2UoMCwgTUFHSUMubGVuZ3RoKVxuICBpZiAoTUFHSUMuY29tcGFyZShtYWdpYykgIT09IDApIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBwYXlsb2FkJylcbiAgY29uc3QgaGVhZGVyTGVuZ3RoID0gcGF5bG9hZC5yZWFkVUludDMyQkUoTUFHSUMubGVuZ3RoKVxuICBjb25zdCBoZWFkZXJCdWZmZXIgPSBwYXlsb2FkLnNsaWNlKFxuICAgIE1BR0lDLmxlbmd0aCArIExFTkdUSF9TSVpFLFxuICAgIE1BR0lDLmxlbmd0aCArIExFTkdUSF9TSVpFICsgaGVhZGVyTGVuZ3RoLFxuICApXG4gIGNvbnN0IGhlYWRlcnMgPSBKU09OLnBhcnNlKGhlYWRlckJ1ZmZlci50b1N0cmluZygpKVxuICBjb25zdCBib2R5ID0gcGF5bG9hZC5zbGljZShNQUdJQy5sZW5ndGggKyBMRU5HVEhfU0laRSArIGhlYWRlckxlbmd0aClcbiAgcmV0dXJuIHsgaGVhZGVycywgYm9keSB9XG59XG4iXSwibmFtZXMiOlsiZW5jb2RlUGF5bG9hZCIsImRlY29kZVBheWxvYWQiLCJNQUdJQyIsIkJ1ZmZlciIsImZyb20iLCJMRU5HVEhfU0laRSIsImhlYWRlcnMiLCJib2R5IiwiaGVhZGVyQnVmZmVyIiwiSlNPTiIsInN0cmluZ2lmeSIsImhlYWRlckxlbmd0aCIsImFsbG9jIiwid3JpdGVVSW50MzJCRSIsImxlbmd0aCIsImNvbmNhdCIsInBheWxvYWQiLCJtYWdpYyIsInNsaWNlIiwiY29tcGFyZSIsIkVycm9yIiwicmVhZFVJbnQzMkJFIiwicGFyc2UiLCJ0b1N0cmluZyJdLCJtYXBwaW5ncyI6Ijs7OztRQWVnQkEsYUFBYSxHQUFiQSxhQUFhO1FBYWJDLGFBQWEsR0FBYkEsYUFBYTtBQXZCN0IsS0FBSyxDQUFDQyxLQUFLLEdBQUdDLE1BQU0sQ0FBQ0MsSUFBSSxDQUFDLENBQU07QUFDaEMsS0FBSyxDQUFDQyxXQUFXLEdBQUcsQ0FBQztTQVNMTCxhQUFhLENBQUMsQ0FBQyxDQUFDTSxPQUFPLEdBQUVDLElBQUksRUFBYyxDQUFDLEVBQVUsQ0FBQztJQUNyRSxLQUFLLENBQUNDLFlBQVksR0FBR0wsTUFBTSxDQUFDQyxJQUFJLENBQUNLLElBQUksQ0FBQ0MsU0FBUyxDQUFDSixPQUFPO0lBQ3ZELEtBQUssQ0FBQ0ssWUFBWSxHQUFHUixNQUFNLENBQUNTLEtBQUssQ0FBQ1AsV0FBVztJQUM3Q00sWUFBWSxDQUFDRSxhQUFhLENBQUNMLFlBQVksQ0FBQ00sTUFBTSxFQUFFLENBQUM7SUFDakQsTUFBTSxDQUFDWCxNQUFNLENBQUNZLE1BQU0sQ0FBQyxDQUFDYjtRQUFBQSxLQUFLO1FBQUVTLFlBQVk7UUFBRUgsWUFBWTtRQUFFRCxJQUFJLEdBQUdBLElBQUksR0FBR0osTUFBTSxDQUFDUyxLQUFLLENBQUMsQ0FBQztJQUFDLENBQUM7QUFDekYsQ0FBQztTQVFlWCxhQUFhLENBQUNlLE9BQTJCLEVBQWUsQ0FBQztJQUN2RSxFQUFFLEdBQUdBLE9BQU8sRUFBRSxNQUFNLENBQUMsQ0FBQztRQUFDVixPQUFPLEVBQUUsQ0FBQztRQUFBLENBQUM7UUFBRUMsSUFBSSxFQUFFSixNQUFNLENBQUNTLEtBQUssQ0FBQyxDQUFDO0lBQUUsQ0FBQztJQUMzRCxLQUFLLENBQUNLLEtBQUssR0FBR0QsT0FBTyxDQUFDRSxLQUFLLENBQUMsQ0FBQyxFQUFFaEIsS0FBSyxDQUFDWSxNQUFNO0lBQzNDLEVBQUUsRUFBRVosS0FBSyxDQUFDaUIsT0FBTyxDQUFDRixLQUFLLE1BQU0sQ0FBQyxFQUFFLEtBQUssQ0FBQyxHQUFHLENBQUNHLEtBQUssQ0FBQyxDQUFpQjtJQUNqRSxLQUFLLENBQUNULFlBQVksR0FBR0ssT0FBTyxDQUFDSyxZQUFZLENBQUNuQixLQUFLLENBQUNZLE1BQU07SUFDdEQsS0FBSyxDQUFDTixZQUFZLEdBQUdRLE9BQU8sQ0FBQ0UsS0FBSyxDQUNoQ2hCLEtBQUssQ0FBQ1ksTUFBTSxHQUFHVCxXQUFXLEVBQzFCSCxLQUFLLENBQUNZLE1BQU0sR0FBR1QsV0FBVyxHQUFHTSxZQUFZO0lBRTNDLEtBQUssQ0FBQ0wsT0FBTyxHQUFHRyxJQUFJLENBQUNhLEtBQUssQ0FBQ2QsWUFBWSxDQUFDZSxRQUFRO0lBQ2hELEtBQUssQ0FBQ2hCLElBQUksR0FBR1MsT0FBTyxDQUFDRSxLQUFLLENBQUNoQixLQUFLLENBQUNZLE1BQU0sR0FBR1QsV0FBVyxHQUFHTSxZQUFZO0lBQ3BFLE1BQU0sQ0FBQyxDQUFDO1FBQUNMLE9BQU87UUFBRUMsSUFBSTtJQUFDLENBQUM7QUFDMUIsQ0FBQyJ9