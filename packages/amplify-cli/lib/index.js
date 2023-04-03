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
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeAmplifyCommand = exports.execute = exports.run = exports.UsageData = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const ci_info_1 = require("ci-info");
const events_1 = require("events");
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const amplify_environment_parameters_1 = require("@aws-amplify/amplify-environment-parameters");
const conditional_local_logging_init_1 = require("./conditional-local-logging-init");
const context_manager_1 = require("./context-manager");
const display_banner_messages_1 = require("./display-banner-messages");
const execution_manager_1 = require("./execution-manager");
const input_manager_1 = require("./input-manager");
const plugin_manager_1 = require("./plugin-manager");
const project_config_version_check_1 = require("./project-config-version-check");
const rewireDeprecatedCommands_1 = require("./rewireDeprecatedCommands");
const mobilehub_support_1 = require("./utils/mobilehub-support");
const team_provider_migrate_1 = require("./utils/team-provider-migrate");
const win_utils_1 = require("./utils/win-utils");
const version_notifier_1 = require("./version-notifier");
const get_amplify_version_1 = require("./extensions/amplify-helpers/get-amplify-version");
const amplify_exception_handler_1 = require("./amplify-exception-handler");
var amplify_usageData_1 = require("./domain/amplify-usageData");
Object.defineProperty(exports, "UsageData", { enumerable: true, get: function () { return amplify_usageData_1.UsageData; } });
events_1.EventEmitter.defaultMaxListeners = 1000;
Error.stackTraceLimit = Number.MAX_SAFE_INTEGER;
process.on('uncaughtException', (e) => void (0, amplify_exception_handler_1.handleException)(e));
process.on('unhandledRejection', amplify_exception_handler_1.handleUnhandledRejection);
const disableCDKDeprecationWarning = () => {
    const isDebug = process.argv.includes('--debug') || process.env.AMPLIFY_ENABLE_DEBUG_OUTPUT === 'true';
    if (!isDebug) {
        process.env.JSII_DEPRECATED = 'quiet';
    }
};
const run = async (startTime) => {
    var _a, _b;
    (0, win_utils_1.deleteOldVersion)();
    disableCDKDeprecationWarning();
    let pluginPlatform = await (0, plugin_manager_1.getPluginPlatform)();
    let input = (0, input_manager_1.getCommandLineInput)(pluginPlatform);
    if (input.command !== 'help') {
        (0, version_notifier_1.notify)({ defer: false, isGlobal: true });
    }
    const pkg = amplify_cli_core_1.JSONUtilities.readJson(path.join(__dirname, '..', 'package.json'));
    amplify_cli_core_1.BannerMessage.initialize(pkg.version);
    ensureFilePermissions(amplify_cli_core_1.pathManager.getAWSCredentialsFilePath());
    ensureFilePermissions(amplify_cli_core_1.pathManager.getAWSConfigFilePath());
    let verificationResult = (0, input_manager_1.verifyInput)(pluginPlatform, input);
    if (!verificationResult.verified) {
        if (verificationResult.message) {
            amplify_prompts_1.printer.warn(verificationResult.message);
        }
        pluginPlatform = await (0, plugin_manager_1.scan)();
        input = (0, input_manager_1.getCommandLineInput)(pluginPlatform);
        verificationResult = (0, input_manager_1.verifyInput)(pluginPlatform, input);
    }
    if (!verificationResult.verified) {
        if (verificationResult.helpCommandAvailable) {
            input.command = amplify_cli_core_1.constants.HELP;
            input.plugin = amplify_cli_core_1.constants.CORE;
        }
        else {
            throw new amplify_cli_core_1.AmplifyError('InputValidationError', {
                message: (_a = verificationResult.message) !== null && _a !== void 0 ? _a : 'Invalid input',
                details: JSON.stringify(verificationResult),
                link: 'https://docs.amplify.aws/cli/project/troubleshooting/',
            });
        }
    }
    const context = (0, context_manager_1.constructContext)(pluginPlatform, input);
    await (0, context_manager_1.attachUsageData)(context, startTime);
    (0, amplify_exception_handler_1.init)(context);
    (0, rewireDeprecatedCommands_1.rewireDeprecatedCommands)(input);
    (0, conditional_local_logging_init_1.logInput)(input);
    const hooksMeta = amplify_cli_core_1.HooksMeta.getInstance(input);
    hooksMeta.setAmplifyVersion((0, get_amplify_version_1.getAmplifyVersion)());
    const contextEnvironmentProvider = new amplify_cli_core_1.CLIContextEnvironmentProvider({
        getEnvInfo: context.amplify.getEnvInfo,
    });
    const projectPath = (_b = amplify_cli_core_1.pathManager.findProjectRoot()) !== null && _b !== void 0 ? _b : process.cwd();
    const useNewDefaults = !amplify_cli_core_1.stateManager.projectConfigExists(projectPath);
    await amplify_cli_core_1.FeatureFlags.initialize(contextEnvironmentProvider, useNewDefaults);
    amplify_prompts_1.prompter.setFlowData(context.usageData);
    if (!(await (0, team_provider_migrate_1.migrateTeamProviderInfo)(context))) {
        throw new amplify_cli_core_1.AmplifyError('MigrationError', {
            message: 'An error occurred while migrating team provider info',
            link: 'https://docs.amplify.aws/cli/project/troubleshooting/',
        });
    }
    process.on('SIGINT', () => void sigIntHandler(context));
    if (!ci_info_1.isCI && context.input.command === 'push') {
        await (0, project_config_version_check_1.checkProjectConfigVersion)(context);
    }
    (0, mobilehub_support_1.ensureMobileHubCommandCompatibility)(context);
    await (0, display_banner_messages_1.displayBannerMessages)(input);
    await (0, execution_manager_1.executeCommand)(context);
    if (input.command === 'help') {
        (0, version_notifier_1.notify)({ defer: true, isGlobal: true });
    }
    if (context.input.command === 'push') {
        const { providers } = amplify_cli_core_1.stateManager.getProjectConfig(undefined, { throwIfNotExist: false, default: {} });
        const CloudFormationProviderName = 'awscloudformation';
        let uploadHandler;
        if (Array.isArray(providers) && providers.find((value) => value === CloudFormationProviderName)) {
            uploadHandler = await context.amplify.invokePluginMethod(context, CloudFormationProviderName, undefined, 'getEnvParametersUploadHandler', [context]);
        }
        await (0, amplify_environment_parameters_1.saveAll)(uploadHandler);
    }
    else {
        await (0, amplify_environment_parameters_1.saveAll)();
    }
    const exitCode = process.exitCode || 0;
    if (exitCode === 0) {
        await context.usageData.emitSuccess();
    }
};
exports.run = run;
const ensureFilePermissions = (filePath) => {
    if (fs.existsSync(filePath) && (fs.statSync(filePath).mode & 0o777) === 0o644) {
        fs.chmodSync(filePath, '600');
    }
};
async function sigIntHandler(context) {
    void context.usageData.emitAbort();
    try {
        await context.amplify.runCleanUpTasks(context);
    }
    catch (err) {
        context.print.warning(`Could not run clean up tasks\nError: ${err.message}`);
    }
    context.print.warning('^Aborted!');
    (0, amplify_cli_core_1.exitOnNextTick)(2);
}
const execute = async (input) => {
    let pluginPlatform = await (0, plugin_manager_1.getPluginPlatform)();
    let verificationResult = (0, input_manager_1.verifyInput)(pluginPlatform, input);
    if (!verificationResult.verified) {
        if (verificationResult.message) {
            amplify_prompts_1.printer.warn(verificationResult.message);
        }
        pluginPlatform = await (0, plugin_manager_1.scan)();
        verificationResult = (0, input_manager_1.verifyInput)(pluginPlatform, input);
    }
    if (!verificationResult.verified) {
        if (verificationResult.helpCommandAvailable) {
            input.command = amplify_cli_core_1.constants.HELP;
            input.plugin = amplify_cli_core_1.constants.CORE;
        }
        else {
            throw new Error(verificationResult.message);
        }
    }
    const context = (0, context_manager_1.constructContext)(pluginPlatform, input);
    await (0, context_manager_1.attachUsageData)(context, Date.now());
    (0, amplify_exception_handler_1.init)(context);
    process.on('SIGINT', () => void sigIntHandler(context));
    await (0, execution_manager_1.executeCommand)(context);
    const exitCode = process.exitCode || 0;
    if (exitCode === 0) {
        void context.usageData.emitSuccess();
    }
};
exports.execute = execute;
const executeAmplifyCommand = async (context) => {
    if (context.input.command) {
        const commandPath = path.normalize(path.join(__dirname, 'commands', context.input.command));
        const commandModule = await Promise.resolve().then(() => __importStar(require(commandPath)));
        await commandModule.run(context);
    }
};
exports.executeAmplifyCommand = executeAmplifyCommand;
//# sourceMappingURL=index.js.map