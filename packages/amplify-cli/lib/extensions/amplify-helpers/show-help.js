"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.showHelp = void 0;
const print_1 = require("./print");
function showHelp(header, commands) {
    print_1.print.info(header);
    print_1.print.info('');
    const tableOptions = [];
    for (let i = 0; i < commands.length; i += 1) {
        tableOptions.push([commands[i].name, commands[i].description]);
    }
    const { table } = print_1.print;
    table(tableOptions, { format: 'default' });
}
exports.showHelp = showHelp;
//# sourceMappingURL=show-help.js.map