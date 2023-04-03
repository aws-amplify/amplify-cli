"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CLIFlowReport = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const amplify_cli_logger_1 = require("@aws-amplify/amplify-cli-logger");
const encryption_helpers_1 = require("../../commands/helpers/encryption-helpers");
class CLIFlowReport {
    constructor() {
        const currentTime = Date.now();
        this.logger = (0, amplify_cli_logger_1.getAmplifyLogger)();
        this.timestamp = currentTime.toString();
        this.isHeadless = false;
        this.optionFlowData = [];
    }
    assignProjectIdentifier() {
        if (!this.projectIdentifier) {
            try {
                const projectName = amplify_cli_core_1.stateManager.getProjectName();
                const envName = amplify_cli_core_1.stateManager.getCurrentEnvName();
                const appId = amplify_cli_core_1.stateManager.getAppID();
                const { projectEnvIdentifier, projectIdentifier } = (0, encryption_helpers_1.createHashedIdentifier)(projectName, appId, envName);
                this.projectEnvIdentifier = projectEnvIdentifier;
                this.projectIdentifier = projectIdentifier;
                return this.projectEnvIdentifier;
            }
            catch (e) {
                return undefined;
            }
        }
        return undefined;
    }
    setInput(input) {
        var _a;
        this.input = input;
        this.runtime = input.argv[0];
        this.executable = input.argv[1];
        this.cmd = input.argv[2];
        this.subCmd = input.argv[3] ? input.argv[3] : undefined;
        this.optionFlowData = [];
        if ((_a = input.options) === null || _a === void 0 ? void 0 : _a.prompt) {
            const prompt = input.options.prompt;
            this.pushInteractiveFlow(prompt, input.options.input);
        }
    }
    setVersion(version) {
        this.version = version;
    }
    getFlowReport() {
        const result = {
            runtime: this.runtime,
            executable: this.executable,
            version: this.version,
            cmd: this.cmd,
            subCmd: this.subCmd,
            isHeadless: this.isHeadless,
            optionFlowData: this.optionFlowData,
            category: this.category,
            input: this.input,
            timestamp: this.timestamp,
            projectEnvIdentifier: this.projectEnvIdentifier,
            projectIdentifier: this.projectIdentifier,
        };
        return result;
    }
    setIsHeadless(isHeadless) {
        this.isHeadless = isHeadless;
    }
    pushInteractiveFlow(prompt, input) {
        const redactedString = (0, amplify_cli_logger_1.Redactor)(JSON.stringify({ prompt, input }));
        const cleanOption = JSON.parse(redactedString);
        const timeStampedCLIFlowOption = { ...cleanOption, timestamp: new Date().valueOf() };
        this.optionFlowData.push(timeStampedCLIFlowOption);
    }
    pushHeadlessFlow(headlessParameterString, cliInput) {
        this.assignProjectIdentifier();
        this.setIsHeadless(true);
        this.setInput(cliInput);
        const cleanOption = (0, amplify_cli_logger_1.Redactor)(headlessParameterString);
        const timeStampedOption = { input: cleanOption, timestamp: new Date().valueOf() };
        this.optionFlowData.push(timeStampedOption);
    }
}
exports.CLIFlowReport = CLIFlowReport;
//# sourceMappingURL=FlowReport.js.map