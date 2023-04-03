"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findIntersections = exports.twoStringSetsAreDisjoint = exports.twoStringSetsAreEqual = void 0;
function twoStringSetsAreEqual(a, b) {
    if (a.size !== b.size) {
        return false;
    }
    for (const item of a) {
        if (!b.has(item)) {
            return false;
        }
    }
    return true;
}
exports.twoStringSetsAreEqual = twoStringSetsAreEqual;
function twoStringSetsAreDisjoint(a, b) {
    if (a.size > b.size) {
        const temp = a;
        a = b;
        b = temp;
    }
    for (const item of a) {
        if (b.has(item)) {
            return false;
        }
    }
    return true;
}
exports.twoStringSetsAreDisjoint = twoStringSetsAreDisjoint;
function findIntersections(a, b) {
    const result = new Set();
    if (a.size > b.size) {
        const temp = a;
        a = b;
        b = temp;
    }
    for (const item of a) {
        if (b.has(item)) {
            result.add(item);
        }
    }
    return result;
}
exports.findIntersections = findIntersections;
//# sourceMappingURL=set-ops.js.map