"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.map = void 0;
const map_1 = require("./map");
const array_1 = require("./array");
const decimal_1 = require("./decimal");
const integer_1 = require("./integer");
const string_1 = require("./string");
const lodash_1 = require("lodash");
function map(value, hint) {
    if (value instanceof map_1.JavaMap)
        return value;
    if (value instanceof array_1.JavaArray)
        return value;
    if (Array.isArray(value)) {
        return new array_1.JavaArray(value.map((x) => map(x)), map);
    }
    if ((0, lodash_1.isPlainObject)(value)) {
        return (0, map_1.createMapProxy)(new map_1.JavaMap(Object.entries(value).reduce((sum, [k, v]) => {
            return {
                ...sum,
                [k]: map(v),
            };
        }, {}), map));
    }
    if (typeof value === 'string' && !(value instanceof string_1.JavaString)) {
        return new string_1.JavaString(value);
    }
    if (typeof value === 'number') {
        if (hint === 'integer' || (hint !== 'decimal' && Math.trunc(value) === value)) {
            return new integer_1.JavaInteger(value);
        }
        return new decimal_1.JavaDecimal(value);
    }
    return value;
}
exports.map = map;
//# sourceMappingURL=mapper.js.map