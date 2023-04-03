"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.recursiveOmit = void 0;
const lodash_1 = __importDefault(require("lodash"));
const recursiveOmit = (obj, path) => {
    if (path.length === 0)
        return;
    const currentKey = path[0];
    if (path.length === 1 && !!obj[currentKey]) {
        delete obj[currentKey];
        return;
    }
    if (!obj[currentKey]) {
        return;
    }
    (0, exports.recursiveOmit)(obj[currentKey], path.slice(1));
    if (obj[currentKey] && lodash_1.default.isEmpty(obj[currentKey])) {
        delete obj[currentKey];
    }
};
exports.recursiveOmit = recursiveOmit;
//# sourceMappingURL=recursiveOmit.js.map