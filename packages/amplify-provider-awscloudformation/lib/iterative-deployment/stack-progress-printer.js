"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StackProgressPrinter = void 0;
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const chalk_1 = __importDefault(require("chalk"));
const columnify_1 = __importDefault(require("columnify"));
const progress_bar_helpers_1 = require("../utils/progress-bar-helpers");
class StackProgressPrinter {
    constructor(eventMap) {
        this.events = [];
        this.categoriesPrinted = [];
        this.addActivity = (event) => {
            this.events.push(event);
            if (this.progressBars.isTTY()) {
                const progressBarsConfigs = [];
                const item = this.eventMap.rootResources.find((it) => it.key === event.LogicalResourceId);
                if (!this.categoriesPrinted.includes('projectBar') && (event.LogicalResourceId === this.eventMap.rootStackName || item)) {
                    progressBarsConfigs.push({
                        name: 'projectBar',
                        value: 0,
                        total: 1 + this.eventMap.rootResources.length,
                        payload: {
                            progressName: `root stack-${this.eventMap.projectName}`,
                            envName: this.eventMap.envName,
                        },
                    });
                    this.categoriesPrinted.push('projectBar');
                }
                const category = this.eventMap.eventToCategories.get(event.LogicalResourceId);
                if (category && !this.categoriesPrinted.includes(category)) {
                    const categoryItem = this.eventMap.categories.find((it) => it.name === category);
                    if (categoryItem) {
                        progressBarsConfigs.push({
                            name: categoryItem.name,
                            value: 0,
                            total: categoryItem.size,
                            payload: {
                                progressName: categoryItem === null || categoryItem === void 0 ? void 0 : categoryItem.name,
                                envName: this.eventMap.envName,
                            },
                        });
                        this.categoriesPrinted.push(category);
                    }
                }
                this.progressBars.create(progressBarsConfigs);
            }
        };
        this.updateIndexInHeader = (currentIndex, totalIndices) => {
            this.progressBars.updatePrefixText(`Deploying iterative update ${currentIndex} of ${totalIndices} into ${this.eventMap.envName} environment. This will take a few minutes.`);
        };
        this.print = () => {
            if (this.progressBars.isTTY()) {
                this.printEventProgress();
            }
            else {
                this.printDefaultLogs();
            }
        };
        this.printEventProgress = () => {
            if (this.events.length > 0) {
                this.events = this.events.reverse();
                this.events.forEach((event) => {
                    const finishStatus = progress_bar_helpers_1.CFN_SUCCESS_STATUS.includes(event.ResourceStatus);
                    const updateObj = {
                        name: event.LogicalResourceId,
                        payload: {
                            LogicalResourceId: event.LogicalResourceId,
                            ResourceType: event.ResourceType,
                            ResourceStatus: event.ResourceStatus,
                            Timestamp: event.Timestamp.toString(),
                        },
                    };
                    const item = this.eventMap.rootResources.find((it) => it.key === event.LogicalResourceId);
                    if (event.LogicalResourceId === this.eventMap.rootStackName || item) {
                        if (finishStatus && item && item.category) {
                            this.progressBars.finishBar(item.category);
                        }
                        this.progressBars.updateBar('projectBar', updateObj);
                    }
                    else if (this.eventMap.eventToCategories) {
                        const category = this.eventMap.eventToCategories.get(event.LogicalResourceId);
                        if (category) {
                            this.progressBars.updateBar(category, updateObj);
                        }
                    }
                });
                this.events = [];
            }
        };
        this.printDefaultLogs = () => {
            this.events = this.events.reverse();
            if (this.events.length > 0) {
                console.log('\n');
                const COLUMNS = ['ResourceStatus', 'LogicalResourceId', 'ResourceType', 'Timestamp', 'ResourceStatusReason'];
                const e = this.events.map((ev) => {
                    const res = {};
                    const { ResourceStatus: resourceStatus } = ev;
                    let colorFn = chalk_1.default.reset;
                    if (progress_bar_helpers_1.CNF_ERROR_STATUS.includes(resourceStatus)) {
                        colorFn = chalk_1.default.red;
                    }
                    else if (progress_bar_helpers_1.CFN_SUCCESS_STATUS.includes(resourceStatus)) {
                        colorFn = chalk_1.default.green;
                    }
                    Object.entries(ev)
                        .filter(([name]) => COLUMNS.includes(name))
                        .forEach(([name, value]) => {
                        res[name] = colorFn(value);
                    });
                    return res;
                });
                console.log((0, columnify_1.default)(e, {
                    columns: COLUMNS,
                    showHeaders: false,
                }));
                this.events = [];
            }
        };
        this.finishBars = () => {
            this.progressBars.finishAllBars();
        };
        this.stopBars = () => {
            this.progressBars.stop();
        };
        this.isRunning = () => this.progressBars.getBarCount() !== 0;
        this.progressBars = new amplify_prompts_1.MultiProgressBar({
            progressBarFormatter: progress_bar_helpers_1.createProgressBarFormatter,
            itemFormatter: progress_bar_helpers_1.createItemFormatter,
            loneWolf: false,
            hideCursor: true,
            barSize: 40,
            itemCompleteStatus: progress_bar_helpers_1.CFN_SUCCESS_STATUS,
            itemFailedStatus: progress_bar_helpers_1.CNF_ERROR_STATUS,
            prefixText: `Deploying resources into ${eventMap.envName} environment. This will take a few minutes.`,
            successText: 'Deployment completed.',
            failureText: 'Deployment failed.',
            barCompleteChar: '=',
            barIncompleteChar: '-',
        });
        this.eventMap = eventMap;
    }
}
exports.StackProgressPrinter = StackProgressPrinter;
//# sourceMappingURL=stack-progress-printer.js.map