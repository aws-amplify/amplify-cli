"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsageData = void 0;
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const https_1 = __importDefault(require("https"));
const lodash_1 = require("lodash");
const uuid_1 = require("uuid");
const command_input_1 = require("../command-input");
const amplify_cli_core_1 = require("amplify-cli-core");
const FlowReport_1 = require("./FlowReport");
const getUsageDataUrl_1 = require("./getUsageDataUrl");
const identifiable_input_regex_1 = __importDefault(require("./identifiable-input-regex"));
const Timer_1 = require("./Timer");
const UsageDataPayload_1 = require("./UsageDataPayload");
class UsageData {
    constructor() {
        this.accountId = '';
        this.installationUuid = '';
        this.version = '';
        this.requestTimeout = 100;
        this.codePathTimers = new Map();
        this.codePathDurations = new Map();
        this.flow = new FlowReport_1.CLIFlowReport();
        this.pushNormalizationFactor = 1;
        this.internalStopCodePathTimer = (codePath) => {
            const timer = this.codePathTimers.get(codePath);
            if (!timer) {
                return;
            }
            this.codePathDurations.set(codePath, timer.stop());
            this.codePathTimers.delete(codePath);
        };
        this.sessionUuid = (0, uuid_1.v4)();
        this.url = (0, getUsageDataUrl_1.getUrl)();
        this.input = new command_input_1.CLIInput([]);
        this.projectSettings = {};
        this.inputOptions = {};
    }
    init(installationUuid, version, input, accountId, projectSettings, processStartTimeStamp) {
        this.installationUuid = installationUuid;
        this.accountId = accountId;
        this.projectSettings = projectSettings;
        this.version = version;
        this.inputOptions = input.options ? (0, lodash_1.pick)(input.options, ['sandboxId']) : {};
        this.input = (0, identifiable_input_regex_1.default)(input, true);
        this.codePathTimers.set(amplify_cli_core_1.FromStartupTimedCodePaths.PLATFORM_STARTUP, Timer_1.Timer.start(processStartTimeStamp));
        this.codePathTimers.set(amplify_cli_core_1.FromStartupTimedCodePaths.TOTAL_DURATION, Timer_1.Timer.start(processStartTimeStamp));
        this.flow.setInput(input);
        this.flow.setVersion(version);
    }
    static get Instance() {
        if (!UsageData.instance) {
            UsageData.instance = new UsageData();
        }
        return UsageData.instance;
    }
    getSessionUuid() {
        return this.sessionUuid;
    }
    async emitError(error) {
        await this.emit(error, WorkflowState.FAILED);
    }
    async emitAbort() {
        await this.emit(null, WorkflowState.ABORTED);
    }
    async emitSuccess() {
        await this.emit(null, WorkflowState.SUCCESSFUL);
    }
    startCodePathTimer(codePath) {
        if (this.codePathTimers.has(codePath)) {
            throw new Error(`${codePath} already has a running timer`);
        }
        this.codePathTimers.set(codePath, Timer_1.Timer.start());
    }
    stopCodePathTimer(codePath) {
        this.internalStopCodePathTimer(codePath);
    }
    setIsHeadless(isHeadless) {
        this.flow.setIsHeadless(isHeadless);
    }
    pushHeadlessFlow(headlessParameterString, input) {
        this.flow.pushHeadlessFlow(headlessParameterString, input);
    }
    pushInteractiveFlow(prompt, input) {
        this.flow.pushInteractiveFlow(prompt, input);
    }
    getFlowReport() {
        return this.flow.getFlowReport();
    }
    assignProjectIdentifier() {
        return this.flow.assignProjectIdentifier();
    }
    calculatePushNormalizationFactor(events, StackId) {
        const cfnStackStack = [StackId];
        let count = 0;
        while (cfnStackStack.length !== 0) {
            const head = cfnStackStack.pop();
            const children = events
                .filter((r) => r.StackId === head && r.PhysicalResourceId !== head)
                .map((r) => r.PhysicalResourceId)
                .reduce((set, val) => set.add(val), new Set());
            if (children.size > 0) {
                cfnStackStack.push(...children.values());
            }
            else {
                count++;
            }
        }
        this.pushNormalizationFactor = count;
    }
    async emit(error, state) {
        this.flow.assignProjectIdentifier();
        this.codePathDurations.set(amplify_cli_core_1.ManuallyTimedCodePath.PROMPT_TIME, amplify_prompts_1.prompter.getTotalPromptElapsedTime());
        Array.from(this.codePathTimers.keys()).forEach(this.internalStopCodePathTimer);
        const payload = new UsageDataPayload_1.UsageDataPayload(this.sessionUuid, this.installationUuid, this.version, this.input, error, state, this.accountId, this.projectSettings, this.inputOptions, Object.fromEntries(this.codePathDurations), this.flow.getFlowReport());
        payload.pushNormalizationFactor = this.pushNormalizationFactor;
        await this.send(payload);
        return payload;
    }
    getUsageDataPayload(error, state) {
        return new UsageDataPayload_1.UsageDataPayload(this.sessionUuid, this.installationUuid, this.version, this.input, error, state, this.accountId, this.projectSettings, this.inputOptions, Object.fromEntries(this.codePathDurations), this.flow.getFlowReport());
    }
    async send(payload) {
        return new Promise((resolve) => {
            const data = amplify_cli_core_1.JSONUtilities.stringify(payload, {
                minify: true,
            });
            const req = https_1.default.request({
                hostname: this.url.hostname,
                port: this.url.port,
                path: this.url.path,
                method: 'POST',
                headers: {
                    'content-type': 'application/json',
                    'content-length': data.length,
                },
            });
            req.on('error', () => {
            });
            req.setTimeout(this.requestTimeout, () => {
                resolve();
            });
            req.write(data);
            req.end(() => {
                resolve();
            });
        });
    }
}
exports.UsageData = UsageData;
var WorkflowState;
(function (WorkflowState) {
    WorkflowState["ABORTED"] = "ABORTED";
    WorkflowState["FAILED"] = "FAILED";
    WorkflowState["SUCCESSFUL"] = "SUCCEEDED";
})(WorkflowState || (WorkflowState = {}));
//# sourceMappingURL=UsageData.js.map