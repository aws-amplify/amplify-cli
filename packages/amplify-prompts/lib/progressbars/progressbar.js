"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProgressBar = void 0;
const terminal_1 = require("./terminal");
const DEFAULT_BAR_SIZE = 40;
class ProgressBar {
    constructor(options) {
        if (options.loneWolf) {
            this.terminal = new terminal_1.AmplifyTerminal();
        }
        this.value = 0;
        this.total = 1;
        this.options = options;
        this.items = [];
        this.isActive = false;
        this.lastDrawnTime = 0;
        this.barSize = options.barSize || DEFAULT_BAR_SIZE;
        this.barCompleteString = new Array(this.barSize + 1).join(options.barCompleteChar || '=');
        this.barIncompleteString = new Array(this.barSize + 1).join(options.barIncompleteChar || '-');
    }
    createBarString() {
        const completeSize = Math.round((this.value / this.total) * this.barSize);
        const incompleteSize = this.barSize - completeSize;
        const bar = this.barCompleteString.slice(0, completeSize) + this.barIncompleteString.slice(0, incompleteSize);
        return ` [ ${bar} ] ${this.value}/${this.total}`;
    }
    getRenderStrings() {
        let finalStrings = [];
        const progressBar = this.options.progressBarFormatter.call(this, this.payload, this.value, this.total) + this.createBarString();
        finalStrings.push({
            renderString: progressBar,
            color: '',
        });
        finalStrings = this.items.reduce((prev, _current) => prev.concat({
            renderString: `\t${_current.renderString}`,
            color: `${_current.color}`,
        }), finalStrings);
        return finalStrings;
    }
    getValue() {
        return this.value;
    }
    render() {
        if (this.terminal) {
            const stringsToRender = this.getRenderStrings();
            this.terminal.writeLines(stringsToRender);
        }
    }
    isFinished() {
        return this.value === this.total;
    }
    isFailed() {
        return this.items.some((item) => this.options.itemFailedStatus.includes(item.status));
    }
    start(total, startValue, payload) {
        this.value = startValue || 0;
        this.total = total >= 0 ? total : this.total;
        this.payload = payload || {};
        this.lastDrawnTime = Date.now();
        this.isActive = true;
        if (this.terminal) {
            if (this.options.hideCursor === true) {
                this.terminal.cursor(false);
            }
            this.render();
        }
    }
    stop() {
        this.isActive = false;
        if (this.terminal) {
            if (this.options.hideCursor) {
                this.terminal.cursor(true);
            }
        }
    }
    hasItem(name) {
        return !!this.getItem(name);
    }
    getItem(name) {
        return this.items.find((item) => item.name === name);
    }
    addItem(name, itemPayload) {
        const status = itemPayload.ResourceStatus;
        this.items.push({
            name,
            status,
            ...this.options.itemFormatter.call(this, itemPayload),
            finished: this.options.itemCompleteStatus.includes(status),
        });
        this.render();
    }
    updateItem(name, newPayload) {
        const newItemsSet = this.items.map((item) => {
            let obj = null;
            if (item.name === name) {
                obj = {
                    name: item.name,
                    status: newPayload.ResourceStatus,
                    finished: item.finished || this.options.itemCompleteStatus.includes(newPayload.ResourceStatus),
                    ...this.options.itemFormatter.call(this, newPayload),
                };
            }
            return obj || item;
        });
        this.items = newItemsSet;
        this.render();
    }
    increment(value = 1) {
        this.value += value;
        if (this.options.loneWolf) {
            this.render();
        }
    }
    finish() {
        const diff = this.total - this.value;
        this.increment(diff);
    }
}
exports.ProgressBar = ProgressBar;
//# sourceMappingURL=progressbar.js.map