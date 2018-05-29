"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const stripAnsi = require("strip-ansi");
function buildTableOutput(rows, { separators = '  ', indent = 0, } = {}) {
    let maxTextLengths = [];
    for (let row of rows) {
        let lastNoneEmptyIndex = 0;
        for (let i = 0; i < row.length; i++) {
            let text = row[i] || '';
            let textLength = stripAnsi(text).length;
            if (textLength) {
                lastNoneEmptyIndex = i;
            }
            if (maxTextLengths.length > i) {
                maxTextLengths[i] = Math.max(maxTextLengths[i], textLength);
            }
            else {
                maxTextLengths[i] = textLength;
            }
        }
        row.splice(lastNoneEmptyIndex + 1);
    }
    let indentStr = typeof indent === 'string' ?
        indent :
        new Array(indent + 1).join(' ');
    // tslint:disable-next-line:prefer-template
    return rows
        .map(row => {
        let line = indentStr;
        for (let i = 0; i < row.length; i++) {
            let text = row[i] || '';
            let textLength = stripAnsi(text).length;
            let maxLength = maxTextLengths[i];
            line += text;
            line += new Array(maxLength - textLength + 1).join(' ');
            if (i < row.length - 1) {
                if (typeof separators === 'string') {
                    line += separators;
                }
                else {
                    line += separators[i];
                }
            }
        }
        return line;
    })
        .join('\n') + '\n';
}
exports.buildTableOutput = buildTableOutput;
function indent(text, indent) {
    let indentStr = typeof indent === 'string' ?
        indent.replace(/\r/g, '') :
        Array(indent + 1).join(' ');
    return text.replace(/^/mg, indentStr);
}
exports.indent = indent;
//# sourceMappingURL=string.js.map