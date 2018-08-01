"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var TestStorage = /** @class */ (function () {
    function TestStorage() {
        this.data = {};
    }
    // set item with the key
    TestStorage.prototype.setItem = function (key, value) {
        this.data[key] = value;
        return value;
    };
    // get item with the key
    TestStorage.prototype.getItem = function (key) {
        return this.data[key];
    };
    // remove item with the key
    TestStorage.prototype.removeItem = function (key) {
        this.data[key] = undefined;
    };
    // clear out the storage
    TestStorage.prototype.clear = function () {
        this.data = {};
    };
    // If the storage operations are async(i.e AsyncStorage)
    // Then you need to sync those items into the memory in this method
    TestStorage.prototype.sync = function () {
        return Promise.resolve(this.data);
    };
    return TestStorage;
}());
exports.default = TestStorage;
//# sourceMappingURL=TestStorage.js.map