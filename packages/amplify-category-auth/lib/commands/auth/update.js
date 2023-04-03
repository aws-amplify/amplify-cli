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
exports.run = exports.alias = exports.name = void 0;
const amplify_environment_parameters_1 = require("@aws-amplify/amplify-environment-parameters");
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const lodash_1 = __importDefault(require("lodash"));
const __1 = require("../..");
const string_maps_1 = require("../../provider-utils/awscloudformation/assets/string-maps");
const providerController = __importStar(require("../../provider-utils/awscloudformation/index"));
const check_for_auth_migration_1 = require("../../provider-utils/awscloudformation/utils/check-for-auth-migration");
const supported_services_1 = require("../../provider-utils/supported-services");
const getAuthResourceName_1 = require("../../utils/getAuthResourceName");
exports.name = 'update';
exports.alias = ['update'];
const run = async (context) => {
    var _a;
    const { amplify } = context;
    const servicesMetadata = (0, supported_services_1.getSupportedServices)();
    const meta = amplify_cli_core_1.stateManager.getMeta();
    const existingAuth = (_a = meta.auth) !== null && _a !== void 0 ? _a : {};
    if (lodash_1.default.isEmpty(existingAuth)) {
        amplify_prompts_1.printer.warn('Project does not contain auth resources. Add auth using `amplify add auth`.');
        return undefined;
    }
    const authResources = Object.keys(existingAuth);
    for (const authResourceName of authResources) {
        const serviceMeta = existingAuth[authResourceName];
        if (serviceMeta.service === amplify_cli_core_1.AmplifySupportedService.COGNITO && serviceMeta.mobileHubMigrated === true) {
            amplify_prompts_1.printer.error('Auth is migrated from Mobile Hub and cannot be updated with Amplify CLI.');
            return context;
        }
        if (serviceMeta.service === amplify_cli_core_1.AmplifySupportedService.COGNITO && serviceMeta.serviceType === 'imported') {
            amplify_prompts_1.printer.error('Updating imported Auth resource is not supported.');
            return context;
        }
        if (serviceMeta.service === amplify_cli_core_1.AmplifySupportedService.COGNITO && !amplify_cli_core_1.FeatureFlags.getBoolean('auth.forceAliasAttributes')) {
            const authAttributes = amplify_cli_core_1.stateManager.getResourceParametersJson(undefined, amplify_cli_core_1.AmplifyCategories.AUTH, authResourceName);
            if (authAttributes.aliasAttributes && authAttributes.aliasAttributes.length > 0) {
                const authUpdateWarning = await amplify_cli_core_1.BannerMessage.getMessage('AMPLIFY_UPDATE_AUTH_ALIAS_ATTRIBUTES_WARNING');
                if (authUpdateWarning) {
                    amplify_prompts_1.printer.warn(authUpdateWarning);
                }
            }
        }
    }
    amplify_prompts_1.printer.info('Please note that certain attributes may not be overwritten if you choose to use defaults settings.');
    const dependentResources = Object.keys(meta).some((e) => ['analytics', 'api', 'storage', 'function'].includes(e) && Object.keys(meta[e]).length > 0);
    if (dependentResources) {
        amplify_prompts_1.printer.info(string_maps_1.messages.dependenciesExists);
    }
    const resourceName = await (0, getAuthResourceName_1.getAuthResourceName)(context);
    await (0, check_for_auth_migration_1.checkAuthResourceMigration)(context, resourceName, true);
    const providerPlugin = context.amplify.getPluginInstance(context, servicesMetadata.Cognito.provider);
    await (0, amplify_environment_parameters_1.ensureEnvParamManager)();
    context.updatingAuth = providerPlugin.loadResourceParameters(context, 'auth', resourceName);
    try {
        const result = await amplify.serviceSelectionPrompt(context, __1.category, (0, supported_services_1.getSupportedServices)());
        const options = {
            service: result.service,
            providerPlugin: result.providerName,
            resourceName,
        };
        if (!providerController) {
            amplify_prompts_1.printer.error('Provider not configured for this category');
            return undefined;
        }
        const updateResourceResponse = await providerController.updateResource(context, options);
        amplify_prompts_1.printer.success(`Successfully updated resource ${exports.name} locally`);
        amplify_prompts_1.printer.blankLine();
        amplify_prompts_1.printer.success('Some next steps:');
        amplify_prompts_1.printer.info('"amplify push" will build all your local backend resources and provision it in the cloud');
        amplify_prompts_1.printer.info('"amplify publish" will build all your local backend and frontend resources (if you have hosting category added) and provision it in the cloud');
        amplify_prompts_1.printer.blankLine();
        return updateResourceResponse;
    }
    catch (err) {
        amplify_prompts_1.printer.info(err.stack);
        amplify_prompts_1.printer.error('There was an error adding the auth resource');
        void context.usageData.emitError(err);
        process.exitCode = 1;
        return undefined;
    }
};
exports.run = run;
//# sourceMappingURL=update.js.map