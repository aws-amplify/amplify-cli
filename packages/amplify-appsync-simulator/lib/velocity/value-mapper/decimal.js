"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JavaDecimal = void 0;
class JavaDecimal {
    constructor(val) {
        this.value = val;
    }
    valueOf() {
        return this.value;
    }
    toJSON() {
        return this.value;
    }
    toString() {
        return String(this.value);
    }
}
exports.JavaDecimal = JavaDecimal;
//# sourceMappingURL=decimal.js.map