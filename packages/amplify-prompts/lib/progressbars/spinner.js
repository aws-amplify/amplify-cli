"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AmplifySpinner = void 0;
const terminal_1 = require("./terminal");
class AmplifySpinner {
    constructor() {
        this.frameCount = 0;
        this.frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
        this.prefixText = '';
        this.refreshRate = 50;
        this.terminal = null;
    }
    render() {
        if (!this.terminal) {
            return;
        }
        if (this.timer) {
            clearTimeout(this.timer);
        }
        const lines = [
            {
                renderString: `${this.frames[this.frameCount]} ${this.prefixText}`,
                color: '',
            },
        ];
        this.frameCount = ++this.frameCount % this.frames.length;
        this.terminal.writeLines(lines);
        this.timer = setTimeout(() => this.render(), this.refreshRate);
    }
    start(text) {
        if (!this.terminal) {
            this.terminal = new terminal_1.AmplifyTerminal();
        }
        this.prefixText = text ? text.replace('\n', '') : this.prefixText;
        this.terminal.cursor(false);
        this.render();
    }
    resetMessage(text) {
        if (!this.terminal) {
            this.start(text);
            return;
        }
        this.prefixText = text ? text.replace('\n', '') : this.prefixText;
    }
    stop(text, success = true) {
        if (!this.terminal) {
            return;
        }
        const lines = [
            {
                renderString: text || '',
                color: success ? 'green' : 'red',
            },
        ];
        clearTimeout(this.timer);
        this.terminal.writeLines(lines);
        this.terminal.cursor(true);
        this.terminal = null;
    }
}
exports.AmplifySpinner = AmplifySpinner;
//# sourceMappingURL=spinner.js.map