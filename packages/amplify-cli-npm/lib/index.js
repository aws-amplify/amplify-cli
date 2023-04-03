"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.install = exports.run = void 0;
const binary_1 = require("./binary");
const run = async () => {
    const binary = new binary_1.Binary();
    return binary.run();
};
exports.run = run;
const install = async () => {
    const binary = new binary_1.Binary();
    return binary.install();
};
exports.install = install;
//# sourceMappingURL=index.js.map