"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.print = void 0;
const safe_1 = __importDefault(require("colors/safe"));
const cli_table3_1 = __importDefault(require("cli-table3"));
safe_1.default.setTheme({
    highlight: 'cyan',
    info: 'reset',
    warning: 'yellow',
    success: 'green',
    error: 'red',
    line: 'grey',
    muted: 'grey',
});
const colors = safe_1.default;
function info(message) {
    console.log(colors.info(message));
}
function warning(message) {
    console.log(colors.warning(message));
}
function error(message) {
    console.log(colors.error(message));
}
function success(message) {
    console.log(colors.success(message));
}
function debug(message, title = 'DEBUG') {
    const topLine = `vvv -----[ ${title} ]----- vvv`;
    const botLine = `^^^ -----[ ${title} ]----- ^^^`;
    console.log(colors.rainbow(topLine));
    console.log(message);
    console.log(colors.rainbow(botLine));
}
function table(data, options = {}) {
    let t;
    switch (options.format) {
        case 'markdown': {
            const header = data.shift();
            t = new cli_table3_1.default({
                style: { head: ['reset'] },
                head: header,
                chars: CLI_TABLE_MARKDOWN,
            });
            t.push(...data);
            t.unshift(columnHeaderDivider(t));
            break;
        }
        case 'lean': {
            t = new cli_table3_1.default({
                style: { head: ['reset'] },
            });
            t.push(...data);
            break;
        }
        default: {
            t = new cli_table3_1.default({
                style: { head: ['reset'] },
                chars: CLI_TABLE_COMPACT,
            });
            t.push(...data);
        }
    }
    console.log(t.toString());
}
function columnHeaderDivider(cliTable) {
    return findWidths(cliTable).map((w) => Array(w).join('-'));
}
function findWidths(cliTable) {
    return [cliTable.options.head]
        .concat(getRows(cliTable))
        .reduce((colWidths, row) => row.map((str, i) => Math.max(`${str}`.length + 1, colWidths[i] || 1)), []);
}
function getRows(cliTable) {
    const list = new Array(cliTable.length);
    for (let i = 0; i < cliTable.length; i++) {
        list[i] = cliTable[i];
    }
    return list;
}
const CLI_TABLE_COMPACT = {
    top: '',
    'top-mid': '',
    'top-left': '',
    'top-right': '',
    bottom: '',
    'bottom-mid': '',
    'bottom-left': '',
    'bottom-right': '',
    left: ' ',
    'left-mid': '',
    mid: '',
    'mid-mid': '',
    right: '',
    'right-mid': '',
    middle: ' ',
};
const CLI_TABLE_MARKDOWN = {
    ...CLI_TABLE_COMPACT,
    left: '|',
    right: '|',
    middle: '|',
};
exports.print = {
    info,
    warning,
    error,
    success,
    table,
    debug,
};
//# sourceMappingURL=print.js.map