"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AmplifyTerminal = void 0;
const os_1 = __importDefault(require("os"));
const chalk_1 = __importDefault(require("chalk"));
const ESC = '\u001b';
const BUFFER_LENGTH = 10;
const cursorUp = (n) => {
    const dy = typeof n === 'number' ? n : 1;
    return dy > 0 ? `${ESC}[${dy}A` : '';
};
const clearLine = () => `${ESC}[K`;
const SHOW_CURSOR = '\x1b[?25h';
const HIDE_CURSOR = '\x1b[?25l';
const getColoredLine = (line, color) => {
    if (color) {
        return chalk_1.default.keyword(color)(line);
    }
    return line;
};
class AmplifyTerminal {
    constructor() {
        this.lastHeight = 0;
        this.trailingEmptyLines = 0;
        this.stream = process.stdout;
    }
    isTTY() {
        return this.stream.isTTY;
    }
    get width() {
        return this.stream.columns;
    }
    getLastHeight() {
        return this.lastHeight;
    }
    get height() {
        return this.stream.rows;
    }
    writeLines(lines) {
        this.stream.write(cursorUp(this.lastHeight));
        lines.forEach((line) => {
            const { renderString, color } = line;
            let truncatedLine = renderString.substring(0, Math.min(renderString.length, this.width - BUFFER_LENGTH));
            if (truncatedLine.length) {
                truncatedLine = getColoredLine(truncatedLine, color);
            }
            this.stream.write(`${clearLine()}${truncatedLine}${os_1.default.EOL}`);
        });
        this.trailingEmptyLines = Math.max(0, this.lastHeight - lines.length);
        for (let i = 0; i < this.trailingEmptyLines; i++) {
            this.stream.write(`${clearLine()}${os_1.default.EOL}`);
        }
        this.lastHeight = lines.length;
    }
    cursor(enabled) {
        if (!this.isTTY()) {
            return;
        }
        if (enabled) {
            this.stream.write(SHOW_CURSOR);
        }
        else {
            this.stream.write(HIDE_CURSOR);
        }
    }
    newLine() {
        this.stream.write(os_1.default.EOL);
    }
}
exports.AmplifyTerminal = AmplifyTerminal;
//# sourceMappingURL=terminal.js.map