"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.str = void 0;
exports.str = {
    toUpper(str) {
        return str.toUpperCase();
    },
    toLower(str) {
        return str.toLowerCase();
    },
    toReplace(str, substr, newSubstr) {
        return str.replace(new RegExp(substr, 'g'), newSubstr);
    },
    normalize(str, form) {
        return str.normalize(form.toUpperCase());
    },
};
//# sourceMappingURL=str.js.map