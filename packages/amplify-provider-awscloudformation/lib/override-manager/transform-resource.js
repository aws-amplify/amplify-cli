"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
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
exports.transformResourceWithOverrides = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const fs = __importStar(require("fs-extra"));
const ora_1 = __importDefault(require("ora"));
const path = __importStar(require("path"));
const _1 = require(".");
const pre_push_cfn_modifier_1 = require("../pre-push-cfn-processor/pre-push-cfn-modifier");
const push_resources_1 = require("../push-resources");
const root_stack_utils_1 = require("./root-stack-utils");
const transformResourceWithOverrides = async (context, resource) => {
    var _a;
    let spinner;
    try {
        if (resource) {
            const pluginInfo = context.amplify.getCategoryPluginInfo(context, resource.category, resource.resourceName);
            const { transformCategoryStack } = pluginInfo ? await (_a = pluginInfo.packageLocation, Promise.resolve().then(() => __importStar(require(_a)))) : { transformCategoryStack: null };
            if (transformCategoryStack) {
                spinner = (0, ora_1.default)(`Building resource ${resource.category}/${resource.resourceName}`);
                spinner.start();
                await transformCategoryStack(context, resource);
                await amplify_cli_core_1.FeatureFlags.ensureFeatureFlag('project', 'overrides');
                spinner.stop();
                return;
            }
            amplify_prompts_1.printer.debug('Overrides functionality is not implemented for this category');
        }
        else {
            const projectRoot = amplify_cli_core_1.pathManager.findProjectRoot();
            const rootStackBackendBuildDir = amplify_cli_core_1.pathManager.getRootStackBuildDirPath(projectRoot);
            fs.ensureDirSync(rootStackBackendBuildDir);
            const rootStackBackendFilePath = path.join(rootStackBackendBuildDir, push_resources_1.rootStackFileName);
            if ((0, root_stack_utils_1.isMigrateProject)()) {
                const template = await (0, _1.transformRootStack)(context);
                await (0, pre_push_cfn_modifier_1.prePushCfnTemplateModifier)(template);
                amplify_cli_core_1.JSONUtilities.writeJson(rootStackBackendFilePath, template);
            }
            else if ((0, root_stack_utils_1.isRootOverrideFileModifiedSinceLastPush)()) {
                const template = await (0, _1.transformRootStack)(context);
                await (0, pre_push_cfn_modifier_1.prePushCfnTemplateModifier)(template);
                amplify_cli_core_1.JSONUtilities.writeJson(rootStackBackendFilePath, template);
            }
        }
    }
    catch (err) {
        const overrideOrCustomStackErrorsList = [
            'MissingOverridesInstallationRequirementsError',
            'InvalidOverrideError',
            'InvalidCustomResourceError',
        ];
        if ((err instanceof amplify_cli_core_1.AmplifyException && overrideOrCustomStackErrorsList.find((v) => v === err.name)) ||
            err['_amplifyErrorType'] === 'InvalidOverrideError') {
            if (err['_amplifyErrorType'] === 'InvalidOverrideError') {
                throw new amplify_cli_core_1.AmplifyError('InvalidOverrideError', {
                    message: `Executing overrides failed.`,
                    details: err.message,
                    resolution: 'There may be runtime errors in your overrides file. If so, fix the errors and try again.',
                }, err);
            }
            throw err;
        }
    }
    finally {
        if (spinner) {
            spinner.stop();
        }
    }
};
exports.transformResourceWithOverrides = transformResourceWithOverrides;
//# sourceMappingURL=transform-resource.js.map