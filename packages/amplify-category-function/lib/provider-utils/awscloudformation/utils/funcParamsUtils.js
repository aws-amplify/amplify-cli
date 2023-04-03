"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertToComplete = exports.isComplete = exports.merge = void 0;
const lodash_1 = __importDefault(require("lodash"));
function merge(existing, other) {
    const mergeFunc = (oldVal, newVal) => {
        if (!lodash_1.default.isObject(oldVal)) {
            return oldVal;
        }
        if (lodash_1.default.isArray(oldVal)) {
            return lodash_1.default.uniqWith(oldVal.concat(newVal), lodash_1.default.isEqual);
        }
        return undefined;
    };
    return lodash_1.default.mergeWith(existing, other, mergeFunc);
}
exports.merge = merge;
function isComplete(partial) {
    const requiredFields = ['providerContext', 'cloudResourceTemplatePath', 'resourceName', 'functionName', 'runtime', 'roleName'];
    const missingField = requiredFields.find((field) => !lodash_1.default.keys(partial).includes(field));
    return !missingField;
}
exports.isComplete = isComplete;
function convertToComplete(partial) {
    if (isComplete(partial)) {
        return partial;
    }
    throw new Error('Partial<FunctionParameters> does not satisfy FunctionParameters');
}
exports.convertToComplete = convertToComplete;
//# sourceMappingURL=funcParamsUtils.js.map