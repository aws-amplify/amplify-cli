"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function graphqlName(val) {
    if (!val.trim()) {
        return '';
    }
    var cleaned = val.replace(/^[^_A-Za-z]+|[^_0-9A-Za-z]/g, '');
    return cleaned;
}
exports.graphqlName = graphqlName;
function toUpper(word) {
    return word.charAt(0).toUpperCase() + word.slice(1);
}
exports.toUpper = toUpper;
//# sourceMappingURL=util.js.map