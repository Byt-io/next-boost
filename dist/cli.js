"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.parse = parse;
const helpMessage = `
  Description
    Starts next.js application with stale-while-validate style cache.
    The application should be compiled with \`next build\` first.

  Usage
    $ next-boost <dir> -p <port>

  <dir> represents the directory of the Next.js application.
  If no directory is provided, the current directory will be used.

  Options
    --port, -p      A port number on which to start the application
    --hostname, -H  Hostname on which to start the application
    --grace         Milliseconds to wait before force-closing connections
    --quiet, -q     No log output
    --help, -h      Displays this message
`;
function help(argv) {
    console.log(helpMessage);
    if (argv) {
        throw new Error(`Failed to parse arguments ${argv.join(' ')}`);
    }
}
const types = {
    '--help': Boolean,
    '--quiet': Boolean,
    '--port': Number,
    '--hostname': String,
    '--grace': Number
};
const alias = {
    '-h': '--help',
    '-q': '--quiet',
    '-p': '--port',
    '-H': '--hostname'
};
function parse(raw) {
    raw = raw.slice(2);
    const argv = {
    };
    for(let i = 0; i < raw.length; i++){
        let arg = raw[i];
        if (arg in alias) arg = alias[arg];
        const type = types[arg];
        if (!type) {
            if (!argv['dir']) {
                argv['dir'] = arg;
                continue;
            } else {
                return help(raw);
            }
        }
        if (type === Boolean) {
            argv[arg] = true;
            continue;
        }
        if (++i >= raw.length) return help(raw);
        const v = raw[i];
        if (type === Number) argv[arg] = parseInt(v, 10);
        else argv[arg] = v;
    }
    if (argv['--help']) return help();
    return argv;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9jbGkudHMiXSwic291cmNlc0NvbnRlbnQiOlsiY29uc3QgaGVscE1lc3NhZ2UgPSBgXG4gIERlc2NyaXB0aW9uXG4gICAgU3RhcnRzIG5leHQuanMgYXBwbGljYXRpb24gd2l0aCBzdGFsZS13aGlsZS12YWxpZGF0ZSBzdHlsZSBjYWNoZS5cbiAgICBUaGUgYXBwbGljYXRpb24gc2hvdWxkIGJlIGNvbXBpbGVkIHdpdGggXFxgbmV4dCBidWlsZFxcYCBmaXJzdC5cblxuICBVc2FnZVxuICAgICQgbmV4dC1ib29zdCA8ZGlyPiAtcCA8cG9ydD5cblxuICA8ZGlyPiByZXByZXNlbnRzIHRoZSBkaXJlY3Rvcnkgb2YgdGhlIE5leHQuanMgYXBwbGljYXRpb24uXG4gIElmIG5vIGRpcmVjdG9yeSBpcyBwcm92aWRlZCwgdGhlIGN1cnJlbnQgZGlyZWN0b3J5IHdpbGwgYmUgdXNlZC5cblxuICBPcHRpb25zXG4gICAgLS1wb3J0LCAtcCAgICAgIEEgcG9ydCBudW1iZXIgb24gd2hpY2ggdG8gc3RhcnQgdGhlIGFwcGxpY2F0aW9uXG4gICAgLS1ob3N0bmFtZSwgLUggIEhvc3RuYW1lIG9uIHdoaWNoIHRvIHN0YXJ0IHRoZSBhcHBsaWNhdGlvblxuICAgIC0tZ3JhY2UgICAgICAgICBNaWxsaXNlY29uZHMgdG8gd2FpdCBiZWZvcmUgZm9yY2UtY2xvc2luZyBjb25uZWN0aW9uc1xuICAgIC0tcXVpZXQsIC1xICAgICBObyBsb2cgb3V0cHV0XG4gICAgLS1oZWxwLCAtaCAgICAgIERpc3BsYXlzIHRoaXMgbWVzc2FnZVxuYFxuXG5mdW5jdGlvbiBoZWxwKGFyZ3Y/OiBzdHJpbmdbXSkge1xuICBjb25zb2xlLmxvZyhoZWxwTWVzc2FnZSlcbiAgaWYgKGFyZ3YpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYEZhaWxlZCB0byBwYXJzZSBhcmd1bWVudHMgJHthcmd2LmpvaW4oJyAnKX1gKVxuICB9XG59XG5cbmV4cG9ydCB0eXBlIEFyZ3YgPSB7IFtrZXk6IHN0cmluZ106IGJvb2xlYW4gfCBudW1iZXIgfCBzdHJpbmcgfVxuXG5jb25zdCB0eXBlczogeyBba2V5OiBzdHJpbmddOiBhbnkgfSA9IHtcbiAgJy0taGVscCc6IEJvb2xlYW4sXG4gICctLXF1aWV0JzogQm9vbGVhbixcbiAgJy0tcG9ydCc6IE51bWJlcixcbiAgJy0taG9zdG5hbWUnOiBTdHJpbmcsXG4gICctLWdyYWNlJzogTnVtYmVyLFxufVxuXG5jb25zdCBhbGlhczogeyBba2V5OiBzdHJpbmddOiBzdHJpbmcgfSA9IHtcbiAgJy1oJzogJy0taGVscCcsXG4gICctcSc6ICctLXF1aWV0JyxcbiAgJy1wJzogJy0tcG9ydCcsXG4gICctSCc6ICctLWhvc3RuYW1lJyxcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlKHJhdzogc3RyaW5nW10pOiBBcmd2IHwgdm9pZCB7XG4gIHJhdyA9IHJhdy5zbGljZSgyKVxuICBjb25zdCBhcmd2OiBBcmd2ID0ge31cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCByYXcubGVuZ3RoOyBpKyspIHtcbiAgICBsZXQgYXJnID0gcmF3W2ldXG4gICAgaWYgKGFyZyBpbiBhbGlhcykgYXJnID0gYWxpYXNbYXJnXVxuICAgIGNvbnN0IHR5cGUgPSB0eXBlc1thcmddXG4gICAgaWYgKCF0eXBlKSB7XG4gICAgICBpZiAoIWFyZ3ZbJ2RpciddKSB7XG4gICAgICAgIGFyZ3ZbJ2RpciddID0gYXJnXG4gICAgICAgIGNvbnRpbnVlXG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gaGVscChyYXcpXG4gICAgICB9XG4gICAgfVxuICAgIGlmICh0eXBlID09PSBCb29sZWFuKSB7XG4gICAgICBhcmd2W2FyZ10gPSB0cnVlXG4gICAgICBjb250aW51ZVxuICAgIH1cbiAgICBpZiAoKytpID49IHJhdy5sZW5ndGgpIHJldHVybiBoZWxwKHJhdylcbiAgICBjb25zdCB2ID0gcmF3W2ldXG4gICAgaWYgKHR5cGUgPT09IE51bWJlcikgYXJndlthcmddID0gcGFyc2VJbnQodiwgMTApXG4gICAgZWxzZSBhcmd2W2FyZ10gPSB2XG4gIH1cblxuICBpZiAoYXJndlsnLS1oZWxwJ10pIHJldHVybiBoZWxwKClcblxuICByZXR1cm4gYXJndlxufVxuIl0sIm5hbWVzIjpbInBhcnNlIiwiaGVscE1lc3NhZ2UiLCJoZWxwIiwiYXJndiIsImNvbnNvbGUiLCJsb2ciLCJFcnJvciIsImpvaW4iLCJ0eXBlcyIsIkJvb2xlYW4iLCJOdW1iZXIiLCJTdHJpbmciLCJhbGlhcyIsInJhdyIsInNsaWNlIiwiaSIsImxlbmd0aCIsImFyZyIsInR5cGUiLCJ2IiwicGFyc2VJbnQiXSwibWFwcGluZ3MiOiI7Ozs7UUEyQ2dCQSxLQUFLLEdBQUxBLEtBQUs7QUEzQ3JCLEtBQUssQ0FBQ0MsV0FBVyxJQUFJOzs7Ozs7Ozs7Ozs7Ozs7OztBQWlCckI7U0FFU0MsSUFBSSxDQUFDQyxJQUFlLEVBQUUsQ0FBQztJQUM5QkMsT0FBTyxDQUFDQyxHQUFHLENBQUNKLFdBQVc7SUFDdkIsRUFBRSxFQUFFRSxJQUFJLEVBQUUsQ0FBQztRQUNULEtBQUssQ0FBQyxHQUFHLENBQUNHLEtBQUssRUFBRSwwQkFBMEIsRUFBRUgsSUFBSSxDQUFDSSxJQUFJLENBQUMsQ0FBRztJQUM1RCxDQUFDO0FBQ0gsQ0FBQztBQUlELEtBQUssQ0FBQ0MsS0FBSyxHQUEyQixDQUFDO0lBQ3JDLENBQVEsU0FBRUMsT0FBTztJQUNqQixDQUFTLFVBQUVBLE9BQU87SUFDbEIsQ0FBUSxTQUFFQyxNQUFNO0lBQ2hCLENBQVksYUFBRUMsTUFBTTtJQUNwQixDQUFTLFVBQUVELE1BQU07QUFDbkIsQ0FBQztBQUVELEtBQUssQ0FBQ0UsS0FBSyxHQUE4QixDQUFDO0lBQ3hDLENBQUksS0FBRSxDQUFRO0lBQ2QsQ0FBSSxLQUFFLENBQVM7SUFDZixDQUFJLEtBQUUsQ0FBUTtJQUNkLENBQUksS0FBRSxDQUFZO0FBQ3BCLENBQUM7U0FFZVosS0FBSyxDQUFDYSxHQUFhLEVBQWUsQ0FBQztJQUNqREEsR0FBRyxHQUFHQSxHQUFHLENBQUNDLEtBQUssQ0FBQyxDQUFDO0lBQ2pCLEtBQUssQ0FBQ1gsSUFBSSxHQUFTLENBQUM7SUFBQSxDQUFDO0lBQ3JCLEdBQUcsQ0FBRSxHQUFHLENBQUNZLENBQUMsR0FBRyxDQUFDLEVBQUVBLENBQUMsR0FBR0YsR0FBRyxDQUFDRyxNQUFNLEVBQUVELENBQUMsR0FBSSxDQUFDO1FBQ3BDLEdBQUcsQ0FBQ0UsR0FBRyxHQUFHSixHQUFHLENBQUNFLENBQUM7UUFDZixFQUFFLEVBQUVFLEdBQUcsSUFBSUwsS0FBSyxFQUFFSyxHQUFHLEdBQUdMLEtBQUssQ0FBQ0ssR0FBRztRQUNqQyxLQUFLLENBQUNDLElBQUksR0FBR1YsS0FBSyxDQUFDUyxHQUFHO1FBQ3RCLEVBQUUsR0FBR0MsSUFBSSxFQUFFLENBQUM7WUFDVixFQUFFLEdBQUdmLElBQUksQ0FBQyxDQUFLLE9BQUcsQ0FBQztnQkFDakJBLElBQUksQ0FBQyxDQUFLLFFBQUljLEdBQUc7Z0JBQ2pCLFFBQVE7WUFDVixDQUFDLE1BQU0sQ0FBQztnQkFDTixNQUFNLENBQUNmLElBQUksQ0FBQ1csR0FBRztZQUNqQixDQUFDO1FBQ0gsQ0FBQztRQUNELEVBQUUsRUFBRUssSUFBSSxLQUFLVCxPQUFPLEVBQUUsQ0FBQztZQUNyQk4sSUFBSSxDQUFDYyxHQUFHLElBQUksSUFBSTtZQUNoQixRQUFRO1FBQ1YsQ0FBQztRQUNELEVBQUUsSUFBSUYsQ0FBQyxJQUFJRixHQUFHLENBQUNHLE1BQU0sRUFBRSxNQUFNLENBQUNkLElBQUksQ0FBQ1csR0FBRztRQUN0QyxLQUFLLENBQUNNLENBQUMsR0FBR04sR0FBRyxDQUFDRSxDQUFDO1FBQ2YsRUFBRSxFQUFFRyxJQUFJLEtBQUtSLE1BQU0sRUFBRVAsSUFBSSxDQUFDYyxHQUFHLElBQUlHLFFBQVEsQ0FBQ0QsQ0FBQyxFQUFFLEVBQUU7YUFDMUNoQixJQUFJLENBQUNjLEdBQUcsSUFBSUUsQ0FBQztJQUNwQixDQUFDO0lBRUQsRUFBRSxFQUFFaEIsSUFBSSxDQUFDLENBQVEsVUFBRyxNQUFNLENBQUNELElBQUk7SUFFL0IsTUFBTSxDQUFDQyxJQUFJO0FBQ2IsQ0FBQyJ9