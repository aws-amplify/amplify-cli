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
exports.getPermissionPolicies = exports.console = exports.migrate = exports.updateConfigOnEnvInit = exports.updateResource = exports.addResource = exports.importResource = void 0;
const inquirer_1 = __importDefault(require("inquirer"));
const lodash_1 = __importDefault(require("lodash"));
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const amplify_environment_parameters_1 = require("@aws-amplify/amplify-environment-parameters");
const getAuthResourceName_1 = require("../../utils/getAuthResourceName");
const synthesize_resources_1 = require("./utils/synthesize-resources");
const constants_1 = require("./constants");
const resource_handlers_1 = require("./handlers/resource-handlers");
const supported_services_1 = require("../supported-services");
const import_1 = require("./import");
var import_2 = require("./import");
Object.defineProperty(exports, "importResource", { enumerable: true, get: function () { return import_2.importResource; } });
const serviceQuestions = async (context, defaultValuesFilename, stringMapsFilename, serviceWalkthroughFilename, serviceMetadata) => {
    var _a;
    const serviceWalkthroughSrc = `${__dirname}/service-walkthroughs/${serviceWalkthroughFilename}`;
    const { serviceWalkthrough } = await (_a = serviceWalkthroughSrc, Promise.resolve().then(() => __importStar(require(_a))));
    return serviceWalkthrough(context, defaultValuesFilename, stringMapsFilename, serviceMetadata);
};
const addResource = async (context, service) => {
    const serviceMetadata = (0, supported_services_1.getSupportedServices)()[service];
    const { defaultValuesFilename, stringMapsFilename, serviceWalkthroughFilename } = serviceMetadata;
    return (0, resource_handlers_1.getAddAuthHandler)(context)(await serviceQuestions(context, defaultValuesFilename, stringMapsFilename, serviceWalkthroughFilename, serviceMetadata));
};
exports.addResource = addResource;
const updateResource = async (context, { service }) => {
    const serviceMetadata = (0, supported_services_1.getSupportedServices)()[service];
    const { defaultValuesFilename, stringMapsFilename, serviceWalkthroughFilename } = serviceMetadata;
    return (0, resource_handlers_1.getUpdateAuthHandler)(context)(await serviceQuestions(context, defaultValuesFilename, stringMapsFilename, serviceWalkthroughFilename, serviceMetadata));
};
exports.updateResource = updateResource;
const updateConfigOnEnvInit = async (context, category, service) => {
    var _a;
    const serviceMetadata = (0, supported_services_1.getSupportedServices)().Cognito;
    const { defaultValuesFilename, stringMapsFilename, serviceWalkthroughFilename, provider } = serviceMetadata;
    const providerPlugin = context.amplify.getPluginInstance(context, provider);
    await (0, amplify_environment_parameters_1.ensureEnvParamManager)();
    const resourceParams = providerPlugin.loadResourceParameters(context, 'auth', service);
    let currentEnvSpecificValues = context.amplify.loadEnvResourceParameters(context, category, service);
    const resource = lodash_1.default.get(context.exeInfo, ['amplifyMeta', category, service]);
    if (resource && resource.serviceType === 'imported') {
        let envSpecificParametersResult;
        const { doServiceWalkthrough, succeeded, resourceCleanupRequired, envSpecificParameters } = await (0, import_1.importedAuthEnvInit)(context, service, resource, resourceParams, provider, providerPlugin, currentEnvSpecificValues, isInHeadlessMode(context), isInHeadlessMode(context) ? getHeadlessParams(context) : {});
        if (doServiceWalkthrough === true) {
            const importResult = await (0, import_1.importResource)(context, {
                providerName: provider,
                provider: undefined,
                service: 'Cognito',
            }, resourceParams, providerPlugin, false);
            if (importResult) {
                envSpecificParametersResult = importResult.envSpecificParameters;
            }
            else {
                throw new Error('There was an error importing the previously configured auth configuration to the new environment.');
            }
        }
        else if (succeeded) {
            if (resourceCleanupRequired) {
                return {};
            }
            envSpecificParametersResult = envSpecificParameters;
        }
        else {
            throw new Error('There was an error importing the previously configured auth configuration to the new environment.');
        }
        const currentMeta = amplify_cli_core_1.stateManager.getCurrentMeta(undefined, {
            throwIfNotExist: false,
        });
        if (currentMeta) {
            const meta = amplify_cli_core_1.stateManager.getMeta(undefined, {
                throwIfNotExist: false,
            });
            const cloudTimestamp = lodash_1.default.get(currentMeta, [category, service, 'lastPushTimeStamp'], undefined);
            if (cloudTimestamp) {
                resource.lastPushTimeStamp = cloudTimestamp;
            }
            else {
                resource.lastPushTimeStamp = new Date();
            }
            lodash_1.default.setWith(meta, [category, service, 'lastPushTimeStamp'], cloudTimestamp);
            amplify_cli_core_1.stateManager.setMeta(undefined, meta);
        }
        return envSpecificParametersResult;
    }
    const { hostedUIProviderMeta } = resourceParams;
    if (hostedUIProviderMeta) {
        currentEnvSpecificValues = getOAuthProviderKeys(currentEnvSpecificValues, resourceParams);
    }
    if (isInHeadlessMode(context)) {
        const envParams = {};
        let mergedValues;
        if (resourceParams.thirdPartyAuth || hostedUIProviderMeta) {
            const authParams = getHeadlessParams(context);
            const projectType = context.amplify.getProjectConfig().frontend;
            mergedValues = { ...resourceParams, ...authParams, ...currentEnvSpecificValues };
            const requiredParams = getRequiredParamsForHeadlessInit(projectType, resourceParams);
            const missingParams = [];
            requiredParams.forEach((param) => {
                if (Object.keys(mergedValues !== null && mergedValues !== void 0 ? mergedValues : {}).includes(param)) {
                    envParams[param] = mergedValues === null || mergedValues === void 0 ? void 0 : mergedValues[param];
                }
                else {
                    missingParams.push(param);
                }
            });
            if (missingParams.length) {
                throw new amplify_cli_core_1.AmplifyError('InputValidationError', {
                    message: `auth headless is missing the following inputParameters ${missingParams.join(', ')}`,
                    link: 'https://docs.amplify.aws/cli/usage/headless/#--categories',
                });
            }
        }
        if (hostedUIProviderMeta) {
            parseCredsForHeadless(mergedValues, envParams);
        }
        return envParams;
    }
    const isPullingOrEnv = context.input.command === 'pull' ||
        (context.input.command === 'env' && context.input.subCommands && !context.input.subCommands.includes('add'));
    serviceMetadata.inputs = serviceMetadata.inputs.filter((input) => constants_1.ENV_SPECIFIC_PARAMS.includes(input.key) && !Object.keys(currentEnvSpecificValues).includes(input.key) && !isPullingOrEnv);
    const serviceWalkthroughSrc = `${__dirname}/service-walkthroughs/${serviceWalkthroughFilename}`;
    const { serviceWalkthrough } = await (_a = serviceWalkthroughSrc, Promise.resolve().then(() => __importStar(require(_a))));
    const result = await serviceWalkthrough(context, defaultValuesFilename, stringMapsFilename, serviceMetadata, resourceParams);
    let envParams = {};
    if (resourceParams.hostedUIProviderMeta) {
        envParams = formatCredentialsForEnvParams(currentEnvSpecificValues, result, resourceParams);
    }
    constants_1.ENV_SPECIFIC_PARAMS.forEach((paramName) => {
        if (paramName in result && paramName !== 'hostedUIProviderCreds' && constants_1.privateKeys.indexOf(paramName) === -1) {
            envParams[paramName] = result[paramName];
        }
    });
    return envParams;
};
exports.updateConfigOnEnvInit = updateConfigOnEnvInit;
const migrate = async (context) => {
    var _a;
    const category = 'auth';
    const { amplify } = context;
    const existingAuth = context.migrationInfo.amplifyMeta.auth || {};
    if (!(Object.keys(existingAuth).length > 0)) {
        return;
    }
    const { provider, cfnFilename, defaultValuesFilename } = (0, supported_services_1.getSupportedServices)().Cognito;
    const defaultValuesSrc = `${__dirname}/assets/${defaultValuesFilename}`;
    const { roles } = await (_a = defaultValuesSrc, Promise.resolve().then(() => __importStar(require(_a))));
    const providerInstance = amplify.getPluginInstance(context, provider);
    const resourceName = await (0, getAuthResourceName_1.getAuthResourceName)(context);
    const props = providerInstance.loadResourceParameters(context, 'auth', resourceName);
    Object.keys(roles).forEach((key) => {
        delete props[key];
    });
    await (0, synthesize_resources_1.copyCfnTemplate)(context, category, props, cfnFilename);
    (0, synthesize_resources_1.saveResourceParameters)(context, provider, category, resourceName, { ...roles, ...props }, constants_1.ENV_SPECIFIC_PARAMS);
};
exports.migrate = migrate;
const isInHeadlessMode = (context) => context.exeInfo.inputParams.yes;
const getHeadlessParams = (context) => {
    const { inputParams } = context.exeInfo;
    try {
        const { categories = {} } = typeof inputParams === 'string' ? JSON.parse(inputParams) : inputParams;
        return categories.auth || {};
    }
    catch (err) {
        throw new Error(`Failed to parse auth headless parameters: ${err}`);
    }
};
const getOAuthProviderKeys = (currentEnvSpecificValues, resourceParams) => {
    const oAuthProviders = JSON.parse(resourceParams.hostedUIProviderMeta).map((h) => h.ProviderName);
    const { hostedUIProviderCreds = '[]' } = currentEnvSpecificValues;
    const configuredProviders = JSON.parse(hostedUIProviderCreds).map((h) => h.ProviderName);
    const deltaProviders = lodash_1.default.intersection(oAuthProviders, configuredProviders);
    deltaProviders.forEach((provider) => {
        const lowerCaseProvider = provider.toLowerCase();
        if (provider === 'SignInWithApple') {
            currentEnvSpecificValues[`${lowerCaseProvider}ClientIdUserPool`] = configuredProviders[`${lowerCaseProvider}ClientIdUserPool`];
            currentEnvSpecificValues[`${lowerCaseProvider}TeamIdUserPool`] = configuredProviders[`${lowerCaseProvider}TeamIdUserPool`];
            currentEnvSpecificValues[`${lowerCaseProvider}KeyIdUserPool`] = configuredProviders[`${lowerCaseProvider}KeyIdUserPool`];
            currentEnvSpecificValues[`${lowerCaseProvider}PrivateKeyUserPool`] = configuredProviders[`${lowerCaseProvider}PrivateKeyUserPool`];
        }
        else {
            currentEnvSpecificValues[`${lowerCaseProvider}AppIdUserPool`] = configuredProviders[`${lowerCaseProvider}AppIdUserPool`];
            currentEnvSpecificValues[`${lowerCaseProvider}AppSecretUserPool`] = configuredProviders[`${lowerCaseProvider}AppSecretUserPool`];
        }
    });
    return currentEnvSpecificValues;
};
const formatCredentialsForEnvParams = (currentEnvSpecificValues, result, resourceParams) => {
    const partialParams = {};
    if (currentEnvSpecificValues.hostedUIProviderCreds && result.hostedUIProviderCreds) {
        partialParams.hostedUIProviderCreds = [];
        const inputResult = JSON.parse(result.hostedUIProviderCreds);
        const previousResult = JSON.parse(currentEnvSpecificValues.hostedUIProviderCreds);
        if (resourceParams.hostedUIProviderMeta) {
            const currentProviders = JSON.parse(resourceParams.hostedUIProviderMeta).map((h) => h.ProviderName);
            currentProviders.forEach((currentProvider) => {
                const previousProvider = previousResult.find((provider) => provider.ProviderName === currentProvider);
                const resultProvider = inputResult.find((provider) => provider.ProviderName === currentProvider);
                partialParams.hostedUIProviderCreds.push(Object.assign(resultProvider, previousProvider));
            });
            partialParams.hostedUIProviderCreds = JSON.stringify(partialParams.hostedUIProviderCreds);
        }
    }
    else if (currentEnvSpecificValues.hostedUIProviderCreds && !result.hostedUIProviderCreds) {
        partialParams.hostedUIProviderCreds = currentEnvSpecificValues.hostedUIProviderCreds;
    }
    else if (!currentEnvSpecificValues.hostedUIProviderCreds && result.hostedUIProviderCreds) {
        partialParams.hostedUIProviderCreds = result.hostedUIProviderCreds;
    }
    return partialParams;
};
const parseCredsForHeadless = (mergedValues, envParams) => {
    const oAuthProviders = JSON.parse(mergedValues.hostedUIProviderMeta).map((h) => h.ProviderName);
    envParams.hostedUIProviderCreds = JSON.stringify(oAuthProviders.map((provider) => {
        const lowerCaseProvider = provider.toLowerCase();
        if (provider === 'SignInWithApple') {
            return {
                ProviderName: provider,
                client_id: mergedValues[`${lowerCaseProvider}ClientIdUserPool`],
                team_id: mergedValues[`${lowerCaseProvider}TeamIdUserPool`],
                key_id: mergedValues[`${lowerCaseProvider}KeyIdUserPool`],
                private_key: mergedValues[`${lowerCaseProvider}PrivateKeyUserPool`],
            };
        }
        return {
            ProviderName: provider,
            client_id: mergedValues[`${lowerCaseProvider}AppIdUserPool`],
            client_secret: mergedValues[`${lowerCaseProvider}AppSecretUserPool`],
        };
    }));
    oAuthProviders.forEach((provider) => {
        const lowerCaseProvider = provider.toLowerCase();
        if (provider === 'SignInWithApple') {
            delete envParams[`${lowerCaseProvider}ClientIdUserPool`];
            delete envParams[`${lowerCaseProvider}TeamIdUserPool`];
            delete envParams[`${lowerCaseProvider}KeyIdUserPool`];
            delete envParams[`${lowerCaseProvider}PrivateKeyUserPool`];
        }
        else {
            delete envParams[`${lowerCaseProvider}AppIdUserPool`];
            delete envParams[`${lowerCaseProvider}AppSecretUserPool`];
        }
    });
};
const getRequiredParamsForHeadlessInit = (projectType, previousValues) => {
    const requiredParams = [];
    if (previousValues.thirdPartyAuth) {
        if (previousValues.authProviders.includes('accounts.google.com')) {
            requiredParams.push('googleClientId');
            if (projectType === 'ios') {
                requiredParams.push('googleIos');
            }
            if (projectType === 'android') {
                requiredParams.push('googleAndroid');
            }
        }
        if (previousValues.authProviders.includes('graph.facebook.com')) {
            requiredParams.push('facebookAppId');
        }
        if (previousValues.authProviders.includes('www.amazon.com')) {
            requiredParams.push('amazonAppId');
        }
        if (previousValues.authProviders.includes('appleid.apple.com')) {
            requiredParams.push('appleAppId');
        }
    }
    if (previousValues.hostedUIProviderMeta) {
        const oAuthProviders = JSON.parse(previousValues.hostedUIProviderMeta).map((hostedUIProvider) => hostedUIProvider.ProviderName);
        if (oAuthProviders && oAuthProviders.length > 0) {
            oAuthProviders.forEach((provider) => {
                const lowerCaseProvider = provider.toLowerCase();
                if (provider !== 'SignInWithApple') {
                    requiredParams.push(`${lowerCaseProvider}AppIdUserPool`);
                    requiredParams.push(`${lowerCaseProvider}AppSecretUserPool`);
                }
            });
        }
    }
    return requiredParams;
};
const console = async (context, amplifyMeta) => {
    var _a;
    const cognitoOutput = getCognitoOutput(amplifyMeta);
    if (cognitoOutput) {
        const { AmplifyAppId, Region } = amplifyMeta.providers.awscloudformation;
        if (cognitoOutput.UserPoolId && cognitoOutput.IdentityPoolId) {
            let choices = [constants_1.UserPool, constants_1.IdentityPool, constants_1.BothPools];
            let isAdminApp = false;
            let region;
            if (AmplifyAppId) {
                const providerPlugin = await (_a = context.amplify.getProviderPlugins(context).awscloudformation, Promise.resolve().then(() => __importStar(require(_a))));
                const res = await providerPlugin.isAmplifyAdminApp(AmplifyAppId);
                isAdminApp = res.isAdminApp;
                region = res.region;
            }
            if (isAdminApp) {
                if (region !== Region) {
                    context.print.warning(`Region mismatch: Amplify service returned '${region}', but found '${Region}' in amplify-meta.json.`);
                }
                if (!AmplifyAppId) {
                    throw new Error('Missing AmplifyAppId in amplify-meta.json');
                }
                choices = [constants_1.AmplifyAdmin, ...choices];
            }
            const answer = await inquirer_1.default.prompt({
                name: 'selection',
                type: 'list',
                message: 'Which console',
                choices,
                default: isAdminApp ? constants_1.AmplifyAdmin : constants_1.BothPools,
            });
            switch (answer.selection) {
                case constants_1.AmplifyAdmin:
                    await openAdminUI(context, AmplifyAppId, Region);
                    break;
                case constants_1.UserPool:
                    await openUserPoolConsole(context, Region, cognitoOutput.UserPoolId);
                    break;
                case constants_1.IdentityPool:
                    await openIdentityPoolConsole(context, Region, cognitoOutput.IdentityPoolId);
                    break;
                case constants_1.BothPools:
                default:
                    await openUserPoolConsole(context, Region, cognitoOutput.UserPoolId);
                    await openIdentityPoolConsole(context, Region, cognitoOutput.IdentityPoolId);
                    break;
            }
        }
        else if (cognitoOutput.UserPoolId) {
            await openUserPoolConsole(context, Region, cognitoOutput.UserPoolId);
        }
        else {
            await openIdentityPoolConsole(context, Region, cognitoOutput.IdentityPoolId);
        }
        context.print.info('');
    }
    else {
        context.print.error('Amazon Cognito resources have NOT been created for your project.');
    }
};
exports.console = console;
const getCognitoOutput = (amplifyMeta) => {
    let cognitoOutput;
    const categoryMeta = amplifyMeta.auth;
    const services = Object.keys(categoryMeta);
    for (let i = 0; i < services.length; i += 1) {
        const serviceMeta = categoryMeta[services[i]];
        if (serviceMeta.service === 'Cognito' && serviceMeta.output && (serviceMeta.output.UserPoolId || serviceMeta.output.IdentityPoolId)) {
            cognitoOutput = serviceMeta.output;
            break;
        }
    }
    return cognitoOutput;
};
const openAdminUI = async (context, appId, region) => {
    var _a;
    const { envName } = context.amplify.getEnvInfo();
    const providerPlugin = await (_a = context.amplify.getProviderPlugins(context).awscloudformation, Promise.resolve().then(() => __importStar(require(_a))));
    const baseUrl = providerPlugin.adminBackendMap[region].amplifyAdminUrl;
    const adminUrl = `${baseUrl}/admin/${appId}/${envName}/auth`;
    await (0, amplify_cli_core_1.open)(adminUrl, { wait: false });
    context.print.success(adminUrl);
};
const openUserPoolConsole = async (context, region, userPoolId) => {
    const userPoolConsoleUrl = `https://${region}.console.aws.amazon.com/cognito/users/?region=${region}#/pool/${userPoolId}/details`;
    await (0, amplify_cli_core_1.open)(userPoolConsoleUrl, { wait: false });
    context.print.info('User Pool console:');
    context.print.success(userPoolConsoleUrl);
};
const openIdentityPoolConsole = async (context, region, identityPoolId) => {
    const identityPoolConsoleUrl = `https://${region}.console.aws.amazon.com/cognito/pool/?region=${region}&id=${identityPoolId}`;
    await (0, amplify_cli_core_1.open)(identityPoolConsoleUrl, { wait: false });
    context.print.info('Identity Pool console:');
    context.print.success(identityPoolConsoleUrl);
};
const getPermissionPolicies = (context, service, resourceName, crudOptions) => {
    const { serviceWalkthroughFilename } = (0, supported_services_1.getSupportedServices)()[service];
    const serviceWalkthroughSrc = `${__dirname}/service-walkthroughs/${serviceWalkthroughFilename}`;
    const { getIAMPolicies } = require(serviceWalkthroughSrc);
    if (!exports.getPermissionPolicies) {
        context.print.info(`No policies found for ${resourceName}`);
        return undefined;
    }
    return getIAMPolicies(context, resourceName, crudOptions);
};
exports.getPermissionPolicies = getPermissionPolicies;
//# sourceMappingURL=index.js.map