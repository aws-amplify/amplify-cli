"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoUsageData = void 0;
const command_input_1 = require("../command-input");
const NoFlowReport_1 = require("./NoFlowReport");
const UsageDataPayload_1 = require("./UsageDataPayload");
class NoUsageData {
    constructor() {
        this.pushInteractiveFlow = () => {
        };
        this.pushHeadlessFlow = () => {
        };
        this.setIsHeadless = () => {
        };
    }
    getUsageDataPayload(error, state) {
        return new UsageDataPayload_1.UsageDataPayload('', '', '', new command_input_1.CLIInput([]), error, state, '', {}, {}, {}, {
            version: '',
            category: '',
            cmd: '',
            executable: '',
            input: { argv: [], command: '' },
            isHeadless: true,
            optionFlowData: [],
            runtime: '',
            subCmd: '',
            timestamp: '',
        });
    }
    calculatePushNormalizationFactor() {
    }
    getSessionUuid() {
        return '';
    }
    emitError() {
        return Promise.resolve();
    }
    emitAbort() {
        return Promise.resolve();
    }
    emitSuccess() {
        return Promise.resolve();
    }
    init() {
    }
    startCodePathTimer() {
    }
    stopCodePathTimer() {
    }
    getFlowReport() {
        return {};
    }
    assignProjectIdentifier() {
        return undefined;
    }
    static get Instance() {
        if (!NoUsageData.instance) {
            NoUsageData.instance = new NoUsageData();
        }
        return NoUsageData.instance;
    }
    static get flowInstance() {
        if (!NoUsageData.flow)
            NoUsageData.flow = NoFlowReport_1.CLINoFlowReport.instance;
        return NoUsageData.flow;
    }
}
exports.NoUsageData = NoUsageData;
//# sourceMappingURL=NoUsageData.js.map