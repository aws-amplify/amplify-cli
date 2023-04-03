"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unmarshall = exports.nullIfEmpty = void 0;
const dynamodb_1 = require("aws-sdk/clients/dynamodb");
function nullIfEmpty(obj) {
    return Object.keys(obj).length === 0 ? null : obj;
}
exports.nullIfEmpty = nullIfEmpty;
function unmarshall(raw, isRaw = true) {
    const content = isRaw ? dynamodb_1.Converter.unmarshall(raw) : raw;
    if (content && typeof content === 'object' && content.wrapperName === 'Set') {
        return content.values;
    }
    if (Array.isArray(content)) {
        return content.map((value) => unmarshall(value, false));
    }
    if (content && typeof content === 'object') {
        return Object.entries(content).reduce((sum, [key, value]) => ({
            ...sum,
            [key]: unmarshall(value, false),
        }), {});
    }
    return content;
}
exports.unmarshall = unmarshall;
//# sourceMappingURL=index.js.map