"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = init;
async function init(args) {
    const app = require('next')(args);
    await app.prepare();
    return app.getRequestHandler();
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9uZXh0L2luaXQudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgUmVxdWVzdExpc3RlbmVyIH0gZnJvbSAnLi4vcmVuZGVyZXInXG5cbmV4cG9ydCBkZWZhdWx0IGFzeW5jIGZ1bmN0aW9uIGluaXQoXG4gIGFyZ3M6IFJlY29yZDxzdHJpbmcsIHVua25vd24+XG4pOiBQcm9taXNlPFJlcXVlc3RMaXN0ZW5lcj4ge1xuICBjb25zdCBhcHAgPSByZXF1aXJlKCduZXh0JykoYXJncylcbiAgYXdhaXQgYXBwLnByZXBhcmUoKVxuICByZXR1cm4gYXBwLmdldFJlcXVlc3RIYW5kbGVyKClcbn1cbiJdLCJuYW1lcyI6WyJpbml0IiwiYXJncyIsImFwcCIsInJlcXVpcmUiLCJwcmVwYXJlIiwiZ2V0UmVxdWVzdEhhbmRsZXIiXSwibWFwcGluZ3MiOiI7Ozs7a0JBRThCQSxJQUFJO2VBQUpBLElBQUksQ0FDaENDLElBQTZCLEVBQ0gsQ0FBQztJQUMzQixLQUFLLENBQUNDLEdBQUcsR0FBR0MsT0FBTyxDQUFDLENBQU0sT0FBRUYsSUFBSTtJQUNoQyxLQUFLLENBQUNDLEdBQUcsQ0FBQ0UsT0FBTztJQUNqQixNQUFNLENBQUNGLEdBQUcsQ0FBQ0csaUJBQWlCO0FBQzlCLENBQUMifQ==