"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MultiProgressBar = void 0;
const terminal_1 = require("./terminal");
const progressbar_1 = require("./progressbar");
class MultiProgressBar {
    constructor(options) {
        this.terminal = new terminal_1.AmplifyTerminal();
        this.options = options;
        this.bars = [];
        if (this.options.hideCursor === true) {
            this.terminal.cursor(false);
        }
        this.lastDrawnTime = Date.now();
        this.isActive = false;
        this.count = 0;
        this.frameCount = 0;
        this.frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
        this.prefixText = options.prefixText;
        this.refreshRate = 200;
        this.updated = false;
        this.lastDrawnStrings = [];
    }
    isTTY() {
        return this.terminal.isTTY();
    }
    writeLines(terminalLine) {
        let barStrings = [];
        let stringsToRender = [];
        if (Object.keys(terminalLine).length !== 0) {
            stringsToRender.push(terminalLine);
        }
        if (this.updated) {
            barStrings = this.bars.reduce((prev, _current) => prev.concat(_current.bar.getRenderStrings()), barStrings);
            stringsToRender = stringsToRender.concat(barStrings);
            this.lastDrawnStrings = barStrings;
        }
        else {
            stringsToRender = stringsToRender.concat(this.lastDrawnStrings);
        }
        this.terminal.writeLines(stringsToRender);
    }
    render() {
        const initLine = {
            renderString: '',
            color: '',
        };
        if (this.timer) {
            clearTimeout(this.timer);
        }
        if (this.prefixText.length) {
            initLine.renderString = `${this.prefixText} ${this.frames[this.frameCount]}`;
        }
        this.writeLines(initLine);
        this.frameCount = ++this.frameCount % this.frames.length;
        this.lastDrawnTime = Date.now();
        if (!this.isTTY()) {
            this.terminal.newLine();
        }
        this.updated = false;
        this.timer = setTimeout(this.render.bind(this), this.refreshRate);
    }
    getBar(name) {
        return this.bars.find((obj) => obj.name === name);
    }
    updateBar(name, updateObj) {
        const barDetails = this.getBar(name);
        if (!barDetails) {
            return;
        }
        const barToUpdate = barDetails.bar;
        const item = barToUpdate.getItem(updateObj.name);
        let finishedStatus = false;
        let itemFailure = false;
        if (item) {
            finishedStatus = item.finished;
            itemFailure = this.options.itemFailedStatus.includes(item.status);
            if (item.status !== updateObj.payload.ResourceStatus && !itemFailure) {
                barToUpdate.updateItem(updateObj.name, updateObj.payload);
                this.updated = true;
            }
        }
        else {
            barToUpdate.addItem(updateObj.name, updateObj.payload);
            this.updated = true;
        }
        if (this.options.itemCompleteStatus.includes(updateObj.payload.ResourceStatus) && !finishedStatus && !itemFailure) {
            barToUpdate.increment();
            this.updated = true;
        }
    }
    incrementBar(name, value) {
        const barDetails = this.getBar(name);
        if (!barDetails) {
            return;
        }
        const barToUpdate = barDetails.bar;
        barToUpdate.increment(value);
        this.updated = true;
    }
    finishBar(name) {
        const barDetails = this.getBar(name);
        if (!barDetails) {
            return;
        }
        const barToUpdate = barDetails.bar;
        if (!barToUpdate.isFinished() && !barToUpdate.isFailed()) {
            barToUpdate.finish();
            this.updated = true;
        }
    }
    finishAllBars() {
        this.bars.forEach((bar) => this.finishBar(bar.name));
    }
    create(bars) {
        if (!this.bars.length) {
            this.terminal.newLine();
            if (this.options.hideCursor === true) {
                this.terminal.cursor(false);
            }
            this.isActive = true;
        }
        bars.forEach((config) => {
            const newBar = new progressbar_1.ProgressBar(this.options);
            newBar.start(config.total, config.value, config.payload);
            this.bars.push({ name: config.name, bar: newBar });
            this.count += 1;
        });
        if (bars.length) {
            this.updated = true;
            this.render();
        }
        this.count += bars.length;
    }
    updatePrefixText(newPrefixText) {
        this.prefixText = newPrefixText;
    }
    getBarCount() {
        return this.count;
    }
    stop() {
        this.isActive = false;
        clearTimeout(this.timer);
        let initLine = {
            renderString: this.options.successText || '',
            color: 'green',
        };
        for (const { bar } of this.bars) {
            if (bar.isFailed()) {
                initLine = {
                    renderString: this.options.failureText || '',
                    color: 'red',
                };
                break;
            }
        }
        this.writeLines(initLine);
        this.bars.forEach((bar) => bar.bar.stop());
        this.bars = [];
        this.count = 0;
        if (this.options.hideCursor) {
            this.terminal.cursor(true);
        }
        this.terminal.newLine();
    }
}
exports.MultiProgressBar = MultiProgressBar;
//# sourceMappingURL=multibar.js.map