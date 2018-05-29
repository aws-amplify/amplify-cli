(function (factory) {
    if (typeof module === 'object' && typeof module.exports === 'object') {
        var v = factory(require, exports); if (v !== undefined) module.exports = v;
    }
    else if (typeof define === 'function' && define.amd) {
        define(["require", "exports"], factory);
    }
})(function (require, exports) {
    var breakerRegex = /[A-Z]+(?=[A-Z][a-z]|$)|[A-Z]|(\d+)|([a-z])/g;
    function hyphenate(original, _a) {
        var _b = _a === void 0 ? {} : _a, _c = _b.connector, connector = _c === void 0 ? '-' : _c, _d = _b.lowerCase, lowerCase = _d === void 0 ? false : _d;
        var precededByNumber = false;
        return original
            .split(/[^a-z\d]+/i)
            .map(function (part) { return part && part.replace(breakerRegex, function (text, num, lowerChar, index) {
            if (lowerCase) {
                text = text.toLowerCase();
            }
            if (index) {
                if (precededByNumber) {
                    precededByNumber = !!num;
                    return connector + text;
                }
                precededByNumber = !!num;
                if (lowerChar) {
                    return text;
                }
                else {
                    return connector + text;
                }
            }
            else {
                return text;
            }
        }); })
            .filter(function (part) { return !!part; })
            .join(connector);
    }
    exports.hyphenate = hyphenate;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = hyphenate;
});
//# sourceMappingURL=index.js.map