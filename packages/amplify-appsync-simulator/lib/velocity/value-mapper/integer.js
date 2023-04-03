"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JavaInteger = void 0;
class JavaInteger {
    constructor(val) {
        this.value = Math.trunc(val);
    }
    valueOf() {
        return this.value;
    }
    parseInt(val, radix = 10) {
        return new JavaInteger(Number.parseInt(val, +radix));
    }
    toJSON() {
        return this.value;
    }
    toString() {
        return String(this.value);
    }
}
exports.JavaInteger = JavaInteger;
//# sourceMappingURL=integer.js.map