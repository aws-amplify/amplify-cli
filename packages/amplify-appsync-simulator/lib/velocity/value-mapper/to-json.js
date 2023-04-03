"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toJSON = void 0;
function toJSON(value) {
    if (typeof value === 'object' && value != null && 'toJSON' in value) {
        return value.toJSON();
    }
    return value;
}
exports.toJSON = toJSON;
//# sourceMappingURL=to-json.js.map