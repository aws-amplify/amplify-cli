"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.printer = exports.AmplifyPrinter = void 0;
const chalk_1 = __importDefault(require("chalk"));
const os_1 = __importDefault(require("os"));
const flags_1 = require("./flags");
class AmplifyPrinter {
    constructor(outputStream = process.stdout) {
        this.outputStream = outputStream;
        this.debug = (line) => {
            if (flags_1.isDebug) {
                this.writeSilenceableLine(line);
            }
        };
        this.info = (line, color = 'reset') => {
            this.writeSilenceableLine(chalk_1.default[color](line));
        };
        this.blankLine = () => {
            this.writeSilenceableLine();
        };
        this.success = (line) => {
            this.writeSilenceableLine(`${flags_1.isHeadless ? '' : '✅ '}${chalk_1.default.green(line)}`);
        };
        this.warn = (line) => {
            this.writeLine(`${flags_1.isHeadless ? '' : '⚠️ '}${chalk_1.default.yellow(line)}`);
        };
        this.error = (line) => {
            this.writeLine(`${flags_1.isHeadless ? '' : '🛑 '}${chalk_1.default.red(line)}`);
        };
        this.writeSilenceableLine = (line) => {
            if (!flags_1.isSilent) {
                this.writeLine(line);
            }
        };
        this.writeLine = (line = '') => {
            this.outputStream.write(`${line}${os_1.default.EOL}`);
        };
    }
}
exports.AmplifyPrinter = AmplifyPrinter;
exports.printer = new AmplifyPrinter();
//# sourceMappingURL=printer.js.map