"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatter = void 0;
const printer_1 = require("./printer");
class AmplifyPrintFormatter {
    constructor(printer = printer_1.printer) {
        this.printer = printer;
        this.list = (items) => items.forEach((item) => this.printer.info(`- ${item}`));
    }
}
exports.formatter = new AmplifyPrintFormatter();
//# sourceMappingURL=formatter.js.map