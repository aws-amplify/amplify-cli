"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Timer = void 0;
class Timer {
    constructor(initialTime) {
        this.initialTime = initialTime;
        this.startTime = initialTime !== null && initialTime !== void 0 ? initialTime : Date.now();
    }
    static start(startTime) {
        return new Timer(startTime);
    }
    stop() {
        return Date.now() - this.startTime;
    }
}
exports.Timer = Timer;
//# sourceMappingURL=Timer.js.map