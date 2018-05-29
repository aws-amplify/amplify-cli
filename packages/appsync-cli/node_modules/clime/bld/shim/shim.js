"use strict";
// tslint:disable:no-console
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const Util = require("util");
const Chalk = require("chalk");
const core_1 = require("../core");
/**
 * A Clime command line interface shim for pure Node.js.
 */
class Shim {
    constructor(cli) {
        this.cli = cli;
    }
    /**
     * Execute CLI with an array as `argv`.
     * @param argv - The `argv` array to execute, typically `process.argv`.
     * @param cwd - Current working directory.
     */
    execute(argv, cwd) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let result = yield this.cli.execute(argv.slice(2), cwd);
                if (core_1.isPrintable(result)) {
                    yield result.print(process.stdout, process.stderr);
                }
                else if (result !== undefined) {
                    // tslint:disable-next-line:no-console
                    console.log(result);
                }
            }
            catch (error) {
                let exitCode = 1;
                if (core_1.isPrintable(error)) {
                    yield error.print(process.stdout, process.stderr);
                    if (error instanceof core_1.ExpectedError) {
                        exitCode = error.code;
                    }
                }
                else if (error instanceof Error) {
                    console.error(Chalk.red(error.stack || error.message));
                }
                else {
                    console.error(Chalk.red(Util.format(error)));
                }
                process.exit(exitCode);
            }
        });
    }
}
exports.Shim = Shim;
//# sourceMappingURL=shim.js.map