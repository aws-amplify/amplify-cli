"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listUtils = void 0;
const lodash_1 = require("lodash");
const array_1 = require("../value-mapper/array");
const mapper_1 = require("../value-mapper/mapper");
exports.listUtils = {
    copyAndRetainAll(list, intersect) {
        if (list instanceof array_1.JavaArray && intersect instanceof array_1.JavaArray) {
            return (0, mapper_1.map)(list.toJSON().filter((value) => intersect.toJSON().includes(value)));
        }
        else {
            return list.filter((value) => intersect.indexOf(value) !== -1);
        }
    },
    copyAndRemoveAll(list, toRemove) {
        if (list instanceof array_1.JavaArray && toRemove instanceof array_1.JavaArray) {
            return (0, mapper_1.map)(list.toJSON().filter((value) => !toRemove.toJSON().includes(value)));
        }
        else {
            return list.filter((value) => toRemove.indexOf(value) === -1);
        }
    },
    sortList(list, desc, property) {
        if (list.length === 0 || list.length > 1000) {
            return list;
        }
        const type = typeof list[0];
        const isMixedTypes = (0, lodash_1.some)(list.slice(1), (i) => typeof i !== type);
        if (isMixedTypes) {
            return list;
        }
        const isScalarList = (0, lodash_1.some)(list, (0, lodash_1.negate)(lodash_1.isObject));
        return (0, lodash_1.orderBy)(list, isScalarList ? lodash_1.identity : property, desc ? 'desc' : 'asc');
    },
};
//# sourceMappingURL=list-utils.js.map