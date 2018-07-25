"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = require("chalk");
const log = {
    debug(msg) {
        console.log(chalk_1.default.cyan(msg));
    },
    info(msg) {
        console.log(chalk_1.default.white(msg));
    },
    error(msg) {
        console.log(chalk_1.default.red(msg));
    }
};
exports.default = log;
//# sourceMappingURL=log.js.map