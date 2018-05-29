"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Chalk = require("chalk");
const extendable_error_1 = require("extendable-error");
class ExpectedError extends extendable_error_1.default {
    constructor(message, code = 1) {
        super(message);
        this.code = code;
    }
    print(stdout, stderr) {
        let output = `${Chalk.dim.red('ERR')} ${this.message}.\n`;
        stderr.write(output);
    }
}
exports.ExpectedError = ExpectedError;
//# sourceMappingURL=error.js.map