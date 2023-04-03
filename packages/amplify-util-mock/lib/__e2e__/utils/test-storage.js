"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class TestStorage {
    constructor() {
        this.data = {};
    }
    setItem(key, value) {
        this.data[key] = value;
        return value;
    }
    getItem(key) {
        return this.data[key];
    }
    removeItem(key) {
        this.data[key] = undefined;
    }
    clear() {
        this.data = {};
    }
    sync() {
        return Promise.resolve(this.data);
    }
}
exports.default = TestStorage;
//# sourceMappingURL=test-storage.js.map