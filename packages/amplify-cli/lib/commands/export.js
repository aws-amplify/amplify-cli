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
exports.run = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const chalk_1 = __importDefault(require("chalk"));
const get_resource_outputs_1 = require("../extensions/amplify-helpers/get-resource-outputs");
const ora_1 = __importDefault(require("ora"));
const build_1 = require("./build");
const _ = __importStar(require("lodash"));
const run = async (context) => {
    const subCommands = context.input.subCommands;
    const showHelp = getSafeInputOptionsFlag(context, 'help') || false;
    const isPull = !!(subCommands && subCommands.includes('pull'));
    const frontend = getSafeInputOptionsFlag(context, 'frontend');
    const rootStackName = getSafeInputOptionsFlag(context, 'rootStackName');
    const showPullHelp = (showHelp || !frontend || !rootStackName) && isPull;
    if (showHelp && !showPullHelp) {
        amplify_prompts_1.printer.blankLine();
        amplify_prompts_1.printer.info("'amplify export', exports your Amplify backend into CDK app");
        amplify_prompts_1.printer.blankLine();
        amplify_prompts_1.printer.info(`${chalk_1.default.yellow('--cdk')}         Exports all Amplify-generated resources as CDK`);
        amplify_prompts_1.printer.info(`${chalk_1.default.yellow('--out')}         Folder to export stack to`);
        amplify_prompts_1.printer.blankLine();
        amplify_prompts_1.printer.info(`Example: ${chalk_1.default.green('amplify export --cdk --out ~/myCDKApp')}`);
        amplify_prompts_1.printer.blankLine();
        amplify_prompts_1.printer.info("'amplify export pull' To export front-end config files'");
        amplify_prompts_1.printer.info("'amplify export pull --help'  to learn");
        amplify_prompts_1.printer.blankLine();
        return;
    }
    if (showPullHelp) {
        const frontendPlugins = context.amplify.getFrontendPlugins(context);
        const frontends = Object.keys(frontendPlugins);
        amplify_prompts_1.printer.blankLine();
        amplify_prompts_1.printer.info("'amplify export pull', Allows you to generate frontend config files at a desired location");
        amplify_prompts_1.printer.blankLine();
        amplify_prompts_1.printer.info(`${chalk_1.default.yellow('--rootStackName')}         Amplify CLI deployed Root Stack name`);
        amplify_prompts_1.printer.info(`${chalk_1.default.yellow('--frontend')}             Front end type ex: ${frontends.join(', ')}`);
        amplify_prompts_1.printer.info(`${chalk_1.default.yellow('--out')}                  Directory to write the front-end config files`);
        amplify_prompts_1.printer.blankLine();
        amplify_prompts_1.printer.info(`Example: ${chalk_1.default.green('amplify export pull --rootStackName amplify-myapp-stack-123 --out ~/myCDKApp/src/config/ --frontend javascript')}`);
        amplify_prompts_1.printer.blankLine();
        amplify_prompts_1.printer.blankLine();
        return;
    }
    const exportPath = _.get(context, ['input', 'options', 'out']);
    if (isPull) {
        await createFrontEndConfigFile(context, exportPath);
    }
    else {
        await exportBackend(context, exportPath);
    }
};
exports.run = run;
async function exportBackend(context, exportPath) {
    await buildAllResources(context);
    const resources = await context.amplify.getResourceStatus();
    await context.amplify.showResourceTable();
    const providerPlugin = context.amplify.getProviderPlugins(context);
    const providers = Object.keys(providerPlugin);
    for await (const provider of providers) {
        const plugin = await Promise.resolve().then(() => __importStar(require(providerPlugin[provider])));
        await plugin.exportResources(context, resources, exportPath);
    }
}
async function buildAllResources(context) {
    const resourcesToBuild = await (0, build_1.getChangedResources)(context);
    await context.amplify.executeProviderUtils(context, 'awscloudformation', 'buildOverrides', { resourcesToBuild, forceCompile: true });
}
async function createFrontEndConfigFile(context, exportPath) {
    var _a;
    const { rootStackName, frontend } = (_a = context.input.options) !== null && _a !== void 0 ? _a : {};
    const frontendSet = new Set(Object.keys(context.amplify.getFrontendPlugins(context)));
    if (!frontend || (frontend && !frontendSet.has(frontend))) {
        throw new amplify_cli_core_1.UnrecognizedFrontendError(`${frontend} is not a supported Amplify frontend`);
    }
    const spinner = (0, ora_1.default)(`Extracting outputs from ${rootStackName}`);
    spinner.start();
    const providerPlugin = context.amplify.getProviderPlugins(context);
    const providers = Object.keys(providerPlugin);
    try {
        for await (const provider of providers) {
            const plugin = await Promise.resolve().then(() => __importStar(require(providerPlugin[provider])));
            await plugin.exportedStackResourcesUpdateMeta(context, rootStackName);
        }
        spinner.text = `Generating files at ${exportPath}`;
        const meta = amplify_cli_core_1.stateManager.getMeta();
        const cloudMeta = amplify_cli_core_1.stateManager.getCurrentMeta();
        const frontendPlugins = context.amplify.getFrontendPlugins(context);
        const frontendHandlerModule = await Promise.resolve().then(() => __importStar(require(frontendPlugins[frontend])));
        const validatedExportPath = (0, amplify_cli_core_1.validateExportDirectoryPath)(exportPath, amplify_cli_core_1.PathConstants.DefaultFrontEndExportFolder);
        await frontendHandlerModule.createFrontendConfigsAtPath(context, (0, get_resource_outputs_1.getResourceOutputs)(meta), (0, get_resource_outputs_1.getResourceOutputs)(cloudMeta), validatedExportPath);
        spinner.succeed('Successfully generated frontend config files');
    }
    catch (ex) {
        spinner.fail('Failed to generate frontend config files ' + ex.message);
        throw ex;
    }
    finally {
        spinner.stop();
    }
}
const getSafeInputOptionsFlag = (context, flag) => _.get(context, ['input', 'options', flag]);
//# sourceMappingURL=export.js.map