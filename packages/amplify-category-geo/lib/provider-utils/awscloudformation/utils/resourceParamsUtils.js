"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.merge = void 0;
const lodash_1 = __importDefault(require("lodash"));
function merge(existing, other) {
    const mergeFunc = (oldVal, newVal) => {
        if (!lodash_1.default.isObject(oldVal)) {
            return oldVal;
        }
        if (lodash_1.default.isArray(oldVal)) {
            return lodash_1.default.uniqWith(oldVal.concat(newVal), lodash_1.default.isEqual);
        }
    };
    if (!other)
        return existing;
    return lodash_1.default.mergeWith(existing, other, mergeFunc);
}
exports.merge = merge;
//# sourceMappingURL=resourceParamsUtils.js.map