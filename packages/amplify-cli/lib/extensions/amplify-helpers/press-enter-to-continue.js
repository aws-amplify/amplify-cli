"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = void 0;
function run(handle) {
    return new Promise((resolve) => {
        process.stdin.resume();
        process.stdin.setEncoding('utf8');
        console.log(handle.message);
        process.stdin.once('data', (data) => {
            handle.data = data;
            resolve(handle);
        });
    });
}
exports.run = run;
//# sourceMappingURL=press-enter-to-continue.js.map