"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function toJson(path) {
    return {
        kind: 'Raw',
        value: "$util.toJson(" + path + ")"
    };
}
exports.toJson = toJson;
//# sourceMappingURL=util.js.map