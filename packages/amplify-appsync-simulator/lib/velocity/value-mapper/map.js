"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMapProxy = exports.JavaMap = void 0;
const array_1 = require("./array");
const integer_1 = require("./integer");
const to_json_1 = require("./to-json");
class JavaMap {
    constructor(obj, mapper) {
        this.mapper = mapper;
        this.map = new Map();
        Object.entries(obj).forEach(([key, value]) => {
            this.map.set(key, value);
        });
    }
    clear() {
        this.map.clear();
    }
    containsKey(key) {
        return this.map.has(key);
    }
    containsValue(value) {
        return Array.from(this.map.values()).indexOf(value) !== -1;
    }
    entrySet() {
        const entries = Array.from(this.map.entries()).map(([key, value]) => createMapProxy(new JavaMap({
            key,
            value,
        }, this.mapper)));
        return new array_1.JavaArray(entries, this.mapper);
    }
    equals(value) {
        return Array.from(this.map.entries()).every(([key, v]) => value.get(key) === v);
    }
    get(key) {
        if (this.map.has(key.toString())) {
            return this.map.get(key.toString());
        }
        return null;
    }
    isEmpty() {
        return this.map.size === 0;
    }
    keySet() {
        return new array_1.JavaArray(Array.from(this.map.keys()).map(this.mapper), this.mapper);
    }
    put(key, value) {
        const saveValue = this.mapper(value);
        this.map.set(key, saveValue);
        return saveValue;
    }
    putAll(map) {
        map = (0, to_json_1.toJSON)(map);
        Object.entries(map).forEach(([key, value]) => {
            this.put(key, value);
        });
    }
    remove(key) {
        if (!this.map.has(key)) {
            return null;
        }
        const value = this.map.get(key);
        this.map.delete(key);
        return value;
    }
    size() {
        return new integer_1.JavaInteger(this.map.size);
    }
    values() {
        return new array_1.JavaArray(Array.from(this.map.values()), this.mapper);
    }
    toJSON() {
        return Array.from(this.map.entries()).reduce((sum, [key, value]) => ({
            ...sum,
            [key]: (0, to_json_1.toJSON)(value),
        }), {});
    }
}
exports.JavaMap = JavaMap;
function createMapProxy(map) {
    return new Proxy(map, {
        get(obj, prop) {
            if (map.map.has(prop)) {
                return map.get(prop);
            }
            return map[prop];
        },
        set(obj, prop, val) {
            if (typeof val !== 'function') {
                map.map.set(prop, val);
            }
            return true;
        },
    });
}
exports.createMapProxy = createMapProxy;
//# sourceMappingURL=map.js.map