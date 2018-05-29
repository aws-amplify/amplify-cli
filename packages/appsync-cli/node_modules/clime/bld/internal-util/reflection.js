"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function parseFunctionParameterNames(fn) {
    let groups = fn
        .toString()
        .match(/^[^{=]*\(([\w\d$-,\s]*)\)/);
    return groups ? groups[1].trim().split(/\s*,\s*/) : undefined;
}
exports.parseFunctionParameterNames = parseFunctionParameterNames;
function getFunctionParameterName(fn, index) {
    let paramNames;
    if (fn.__paramNames) {
        paramNames = fn.__paramNames;
    }
    else {
        paramNames = fn.__paramNames = parseFunctionParameterNames(fn);
    }
    return paramNames && paramNames[index] || `param${index}`;
}
exports.getFunctionParameterName = getFunctionParameterName;
//# sourceMappingURL=reflection.js.map