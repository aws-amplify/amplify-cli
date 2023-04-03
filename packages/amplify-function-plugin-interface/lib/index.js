"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setSecret = exports.removeSecret = exports.retainSecret = exports.BuildType = void 0;
var BuildType;
(function (BuildType) {
    BuildType["PROD"] = "PROD";
    BuildType["DEV"] = "DEV";
})(BuildType = exports.BuildType || (exports.BuildType = {}));
exports.retainSecret = {
    operation: 'retain',
};
exports.removeSecret = {
    operation: 'remove',
};
const setSecret = (value) => ({
    operation: 'set',
    value,
});
exports.setSecret = setSecret;
//# sourceMappingURL=index.js.map