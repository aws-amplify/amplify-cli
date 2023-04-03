"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JavaArray = void 0;
const integer_1 = require("./integer");
const to_json_1 = require("./to-json");
class JavaArray extends Array {
    constructor(values = [], mapper) {
        if (!Array.isArray(values)) {
            values = [values];
        }
        if (values.length !== 1) {
            super(...values);
        }
        else {
            super();
            this.push(values[0]);
        }
        Object.setPrototypeOf(this, Object.create(JavaArray.prototype));
        this.mapper = mapper;
    }
    add(value) {
        this.push(this.mapper(value));
        return value;
    }
    addAll(value) {
        value.forEach((val) => this.push(this.mapper(val)));
    }
    clear() {
        this.length = 0;
    }
    contains(value) {
        value = value && value.toJSON ? value.toJSON() : value;
        return this.toJSON().indexOf(value) !== -1;
    }
    containsAll(value = []) {
        return value.every((v) => this.contains(v));
    }
    isEmpty() {
        return this.length === 0;
    }
    remove(value) {
        const idx = this.indexOf(value);
        if (idx === -1)
            return;
        this.splice(idx, 1);
    }
    removeAll(value) {
        value.forEach((val) => this.remove(val));
    }
    retainAll() {
        throw new Error('no support for retain all');
    }
    size() {
        return new integer_1.JavaInteger(this.length);
    }
    toJSON() {
        return Array.from(this).map(to_json_1.toJSON);
    }
    indexOf(obj) {
        var _a, _b;
        const value = (obj === null || obj === void 0 ? void 0 : obj.toJSON) ? obj.toJSON() : obj;
        for (let i = 0; i < this.length; i++) {
            const item = ((_a = this[i]) === null || _a === void 0 ? void 0 : _a.toJson) ? (_b = this[i]) === null || _b === void 0 ? void 0 : _b.toJson() : this[i];
            if (item === value) {
                return i;
            }
        }
        return -1;
    }
}
exports.JavaArray = JavaArray;
//# sourceMappingURL=array.js.map