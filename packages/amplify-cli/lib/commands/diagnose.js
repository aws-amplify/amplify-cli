"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = exports.reportError = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const archiver_1 = __importDefault(require("archiver"));
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const amplify_cli_logger_1 = require("@aws-amplify/amplify-cli-logger");
const columnify_1 = __importDefault(require("columnify"));
const _ = __importStar(require("lodash"));
const os_1 = __importDefault(require("os"));
const uuid_1 = require("uuid");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const collect_files_1 = require("./helpers/collect-files");
const encryption_helpers_1 = require("./helpers/encryption-helpers");
const debug_config_1 = require("../app-config/debug-config");
const headless_input_utils_1 = require("../utils/headless-input-utils");
const reporter_apis_1 = require("./helpers/reporter-apis");
const reportError = async (context, error) => {
    let sendReport;
    const rootPath = amplify_cli_core_1.pathManager.findProjectRoot();
    if (!rootPath) {
        return;
    }
    const isHeadless = (0, headless_input_utils_1.isHeadlessCommand)(context) || _.get(context, ['input', 'options', 'yes'], false);
    if (!isHeadless && debug_config_1.DebugConfig.Instance.promptSendReport()) {
        sendReport = await amplify_prompts_1.prompter.yesOrNo('An unexpected error has occurred, opt in to send an error report to AWS Amplify with non-sensitive project configuration files. Confirm ', false);
        if (sendReport) {
            showLearnMore(true);
        }
        if (!isHeadless) {
            debug_config_1.DebugConfig.Instance.setAndWriteShareProject(sendReport);
        }
    }
    else {
        sendReport = debug_config_1.DebugConfig.Instance.getCanSendReport();
    }
    if (sendReport) {
        await zipSend(context, true, error);
    }
};
exports.reportError = reportError;
const run = async (context, error = undefined) => {
    const skipPrompts = _.get(context, ['input', 'options', 'send-report'], false);
    const turnOff = _.get(context, ['input', 'options', 'auto-send-off'], false);
    const turnOn = _.get(context, ['input', 'options', 'auto-send-on'], false);
    if (turnOff) {
        debug_config_1.DebugConfig.Instance.setAndWriteShareProject(false);
        return;
    }
    if (turnOn) {
        debug_config_1.DebugConfig.Instance.setAndWriteShareProject(true);
        return;
    }
    showLearnMore(false);
    await zipSend(context, skipPrompts, error);
};
exports.run = run;
const showLearnMore = (showOptOut) => {
    amplify_prompts_1.printer.blankLine();
    amplify_prompts_1.printer.info('Learn more at https://docs.amplify.aws/cli/reference/diagnose/');
    if (showOptOut) {
        amplify_prompts_1.printer.blankLine();
        amplify_prompts_1.printer.info("This project has been opted in automatically to share non-sensitive project configuration files. you can opt out by running 'amplify diagnose --auto-send-off'");
    }
};
const zipSend = async (context, skipPrompts, error) => {
    const choices = ['Generate report', 'Nothing'];
    if (!skipPrompts) {
        const diagnoseAction = await amplify_prompts_1.prompter.pick('What would you like to do?', choices);
        if (diagnoseAction !== choices[0]) {
            return;
        }
    }
    try {
        amplify_cli_core_1.spinner.start('Creating Zip');
        const fileDestination = await createZip(context, error);
        amplify_cli_core_1.spinner.stop();
        amplify_prompts_1.printer.blankLine();
        amplify_prompts_1.printer.success(`Report saved: ${fileDestination}`);
        amplify_prompts_1.printer.blankLine();
        let canSendReport = true;
        if (!skipPrompts) {
            canSendReport = await amplify_prompts_1.prompter.yesOrNo('Send Report', false);
        }
        if (canSendReport) {
            amplify_cli_core_1.spinner.start('Sending zip');
            const projectId = await sendReport(context, fileDestination);
            amplify_cli_core_1.spinner.succeed('Done');
            amplify_prompts_1.printer.blankLine();
            amplify_prompts_1.printer.info(`Project Identifier: ${projectId}`);
            amplify_prompts_1.printer.blankLine();
        }
    }
    catch (ex) {
        amplify_prompts_1.printer.blankLine();
        amplify_prompts_1.printer.info(ex.message);
        void context.usageData.emitError(ex);
        amplify_cli_core_1.spinner.fail();
    }
};
const createZip = async (context, error) => {
    const rootPath = amplify_cli_core_1.pathManager.findProjectRoot();
    if (!rootPath) {
        throw (0, amplify_cli_core_1.projectNotInitializedError)();
    }
    const backend = amplify_cli_core_1.stateManager.getBackendConfig(rootPath);
    const resources = [];
    const categoryResources = Object.keys(backend).reduce((array, key) => {
        Object.keys(backend[key]).forEach((resourceKey) => {
            array.push({
                category: key,
                resourceName: resourceKey,
                service: backend[key][resourceKey].service,
            });
        });
        return array;
    }, resources);
    const filePaths = (0, collect_files_1.collectFiles)(categoryResources, rootPath);
    const zipper = archiver_1.default.create('zip');
    filePaths.forEach((file) => {
        zipper.append(file.redact ? (0, amplify_cli_logger_1.Redactor)(fs.readFileSync(file.filePath, { encoding: 'utf-8' })) : fs.readFileSync(file.filePath, { encoding: 'utf-8' }), {
            name: path.relative(rootPath, file.filePath),
        });
    });
    if (context.exeInfo && context.exeInfo.cloudformationEvents) {
        const COLUMNS = ['ResourceStatus', 'LogicalResourceId', 'ResourceType', 'Timestamp', 'ResourceStatusReason'];
        const events = context.exeInfo.cloudformationEvents.map((r) => ({
            ...r,
            LogicalResourceId: (0, amplify_cli_logger_1.stringMasker)(r.LogicalResourceId),
        }));
        const cloudformation = (0, columnify_1.default)(events, {
            columns: COLUMNS,
            showHeaders: false,
        });
        zipper.append(cloudformation, {
            name: 'cloudformation_log.txt',
        });
    }
    if (error) {
        zipper.append(JSON.stringify(error, null, 4), {
            name: 'error.json',
        });
    }
    const { projectName } = amplify_cli_core_1.stateManager.getProjectConfig();
    const fileDestination = path.join(os_1.default.tmpdir(), projectName, `report-${Date.now()}.zip`);
    fs.ensureFileSync(fileDestination);
    const output = fs.createWriteStream(fileDestination);
    zipper.pipe(output);
    await zipper.finalize();
    return new Promise((resolve, reject) => {
        output.on('close', () => resolve(fileDestination));
        output.on('error', (err) => {
            reject(err);
        });
    });
};
const sendReport = async (context, fileDestination) => {
    const ids = hashedProjectIdentifiers();
    const usageDataPayload = context.usageData.getUsageDataPayload(null, '');
    await sendFile(fileDestination, {
        ...ids,
        sessionUuid: usageDataPayload.sessionUuid,
        installationUuid: usageDataPayload.installationUuid,
        amplifyCliVersion: usageDataPayload.amplifyCliVersion,
        nodeVersion: usageDataPayload.nodeVersion,
    });
    return ids.projectEnvIdentifier;
};
const sendFile = async (zipPath, metaData) => {
    const report = (0, reporter_apis_1.reporterEndpoint)();
    const stream = fs.readFileSync(zipPath);
    const passKey = (0, uuid_1.v4)();
    const cipherTextBlob = await (0, encryption_helpers_1.encryptBuffer)(stream, passKey);
    const key = await (0, encryption_helpers_1.encryptKey)(passKey);
    const data = JSON.stringify({ ...metaData, key, encryptedFile: cipherTextBlob });
    const response = await (0, node_fetch_1.default)(report, {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            'content-length': data.length.toString(),
        },
        body: data,
    });
    if (response.status !== 200) {
        throw new amplify_cli_core_1.DiagnoseReportUploadError();
    }
};
const hashedProjectIdentifiers = () => {
    const projectConfig = amplify_cli_core_1.stateManager.getProjectConfig();
    const envName = amplify_cli_core_1.stateManager.getCurrentEnvName();
    const appId = getAppId();
    return (0, encryption_helpers_1.createHashedIdentifier)(projectConfig.projectName, appId, envName);
};
const getAppId = () => {
    const meta = amplify_cli_core_1.stateManager.getMeta();
    return _.get(meta, ['providers', 'awscloudformation', 'AmplifyAppId']);
};
//# sourceMappingURL=diagnose.js.map