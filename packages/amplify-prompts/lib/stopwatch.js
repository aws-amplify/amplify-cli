"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Stopwatch = void 0;
class Stopwatch {
    constructor() {
        this._slices = [];
        this.start = () => {
            const now = Date.now();
            this._slices.push({
                start: now,
            });
        };
        this.stop = () => {
            this._slices.length = 0;
        };
        this.pause = () => {
            const latestSlice = this._slices[this._slices.length - 1];
            if (!latestSlice) {
                return;
            }
            latestSlice.stop = Date.now();
        };
        this.getElapsedMilliseconds = () => this._slices.reduce((accumulator, currentValue) => accumulator + ((currentValue.stop || Date.now()) - currentValue.start), 0);
    }
}
exports.Stopwatch = Stopwatch;
//# sourceMappingURL=stopwatch.js.map