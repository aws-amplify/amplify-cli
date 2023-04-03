"use strict";
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _a, _AmplifyStudioClient_amplifyUiBuilder, _AmplifyStudioClient_amplifyBackend, _AmplifyStudioClient_appId, _AmplifyStudioClient_envName;
Object.defineProperty(exports, "__esModule", { value: true });
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const aws_sdk_1 = require("aws-sdk");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const environmentHelpers_1 = require("../commands/utils/environmentHelpers");
const featureFlags_1 = require("../commands/utils/featureFlags");
const buildAmplifyBackendClient = (awsConfigInfo) => {
    const awsConfig = { ...awsConfigInfo };
    if (process.env.AMPLIFY_BACKEND_ENDPOINT) {
        awsConfig.endpoint = process.env.AMPLIFY_BACKEND_ENDPOINT;
    }
    if (process.env.AMPLIFY_BACKEND_REGION) {
        awsConfig.region = process.env.AMPLIFY_BACKEND_REGION;
    }
    return new aws_sdk_1.AmplifyBackend(awsConfig);
};
const buildAmplifyUiBuilderClient = (awsConfigInfo) => {
    const awsConfig = { ...awsConfigInfo };
    if (process.env.UI_BUILDER_ENDPOINT) {
        awsConfig.endpoint = process.env.UI_BUILDER_ENDPOINT;
    }
    if (process.env.UI_BUILDER_REGION) {
        awsConfig.region = process.env.UI_BUILDER_REGION;
    }
    return new aws_sdk_1.AmplifyUIBuilder(awsConfig);
};
class AmplifyStudioClient {
    static async setClientInfo(context, envName, appId) {
        const resolvedEnvName = (0, environmentHelpers_1.getEnvName)(context, envName);
        const resolvedAppId = (0, environmentHelpers_1.getAppId)(context, appId);
        const awsConfigInfo = (await context.amplify.invokePluginMethod(context, 'awscloudformation', undefined, 'loadConfigurationForEnv', [
            context,
            resolvedEnvName,
            resolvedAppId,
        ]));
        const client = new AmplifyStudioClient(awsConfigInfo, resolvedAppId, resolvedEnvName);
        if ((await (0, featureFlags_1.getTransformerVersion)()) === 2) {
            await client.loadMetadata();
            client.isGraphQLSupported = true;
        }
        else {
            client.isGraphQLSupported = false;
        }
        return client;
    }
    constructor(awsConfigInfo, appId, envName) {
        _AmplifyStudioClient_amplifyUiBuilder.set(this, void 0);
        _AmplifyStudioClient_amplifyBackend.set(this, void 0);
        _AmplifyStudioClient_appId.set(this, void 0);
        _AmplifyStudioClient_envName.set(this, void 0);
        this.isGraphQLSupported = false;
        this.loadMetadata = async (envName, appId) => {
            var _b, _c;
            const environmentName = envName || __classPrivateFieldGet(this, _AmplifyStudioClient_envName, "f");
            const resolvedAppId = appId || __classPrivateFieldGet(this, _AmplifyStudioClient_appId, "f");
            try {
                const response = await __classPrivateFieldGet(this, _AmplifyStudioClient_amplifyUiBuilder, "f")
                    .getMetadata({
                    appId: resolvedAppId,
                    environmentName,
                })
                    .promise();
                this.metadata = {
                    autoGenerateForms: ((_b = response.features) === null || _b === void 0 ? void 0 : _b.autoGenerateForms) === 'true',
                    autoGenerateViews: ((_c = response.features) === null || _c === void 0 ? void 0 : _c.autoGenerateViews) === 'true',
                };
            }
            catch (err) {
                throw new Error(`Failed to load metadata: ${err.message}`);
            }
        };
        this.listComponents = async (envName, appId) => {
            const environmentName = envName || __classPrivateFieldGet(this, _AmplifyStudioClient_envName, "f");
            const resolvedAppId = appId || __classPrivateFieldGet(this, _AmplifyStudioClient_appId, "f");
            try {
                let nextToken;
                const uiBuilderComponents = [];
                do {
                    const response = await __classPrivateFieldGet(this, _AmplifyStudioClient_amplifyUiBuilder, "f")
                        .exportComponents({
                        appId: resolvedAppId,
                        environmentName,
                        nextToken,
                    })
                        .promise();
                    uiBuilderComponents.push(...response.entities);
                    nextToken = response.nextToken;
                } while (nextToken);
                amplify_prompts_1.printer.debug(JSON.stringify(uiBuilderComponents, null, 2));
                return { entities: uiBuilderComponents };
            }
            catch (err) {
                throw new Error(`Failed to list components: ${err.message}`);
            }
        };
        this.listThemes = async (envName, appId) => {
            const environmentName = envName || __classPrivateFieldGet(this, _AmplifyStudioClient_envName, "f");
            const resolvedAppId = appId || __classPrivateFieldGet(this, _AmplifyStudioClient_appId, "f");
            try {
                let nextToken;
                const uiBuilderThemes = [];
                do {
                    const response = await __classPrivateFieldGet(this, _AmplifyStudioClient_amplifyUiBuilder, "f")
                        .exportThemes({
                        appId: resolvedAppId,
                        environmentName,
                        nextToken,
                    })
                        .promise();
                    uiBuilderThemes.push(...response.entities);
                    nextToken = response.nextToken;
                } while (nextToken);
                amplify_prompts_1.printer.debug(JSON.stringify(uiBuilderThemes, null, 2));
                return { entities: uiBuilderThemes };
            }
            catch (err) {
                throw new Error(`Failed to list themes: ${err.message}`);
            }
        };
        this.listForms = async (envName, appId) => {
            const environmentName = envName || __classPrivateFieldGet(this, _AmplifyStudioClient_envName, "f");
            const resolvedAppId = appId || __classPrivateFieldGet(this, _AmplifyStudioClient_appId, "f");
            try {
                let nextToken;
                const uibuilderForms = [];
                do {
                    const response = await __classPrivateFieldGet(this, _AmplifyStudioClient_amplifyUiBuilder, "f")
                        .exportForms({
                        appId: resolvedAppId,
                        environmentName,
                        nextToken,
                    })
                        .promise();
                    uibuilderForms.push(...response.entities);
                    nextToken = response.nextToken;
                } while (nextToken);
                amplify_prompts_1.printer.debug(JSON.stringify(uibuilderForms, null, 2));
                return { entities: uibuilderForms };
            }
            catch (err) {
                throw new Error(`Failed to list forms: ${err.message}`);
            }
        };
        this.createComponent = async (component, envName, appId) => {
            const environmentName = envName || __classPrivateFieldGet(this, _AmplifyStudioClient_envName, "f");
            const resolvedAppId = appId || __classPrivateFieldGet(this, _AmplifyStudioClient_appId, "f");
            try {
                const response = await __classPrivateFieldGet(this, _AmplifyStudioClient_amplifyUiBuilder, "f")
                    .createComponent({
                    appId: resolvedAppId,
                    environmentName,
                    componentToCreate: component,
                })
                    .promise();
                return response.entity;
            }
            catch (err) {
                throw new Error(`Failed to create component: ${err.message}`);
            }
        };
        this.deleteForm = async (formId, envName, appId) => {
            const environmentName = envName || __classPrivateFieldGet(this, _AmplifyStudioClient_envName, "f");
            const resolvedAppId = appId || __classPrivateFieldGet(this, _AmplifyStudioClient_appId, "f");
            try {
                await __classPrivateFieldGet(this, _AmplifyStudioClient_amplifyUiBuilder, "f").deleteForm({ id: formId, environmentName, appId: resolvedAppId }).promise();
            }
            catch (err) {
                amplify_prompts_1.printer.debug(err.toString());
                throw err;
            }
        };
        this.getModels = async (resourceName, envName, appId) => {
            try {
                const environmentName = envName || __classPrivateFieldGet(this, _AmplifyStudioClient_envName, "f");
                const resolvedAppId = appId || __classPrivateFieldGet(this, _AmplifyStudioClient_appId, "f");
                const { Models } = await __classPrivateFieldGet(this, _AmplifyStudioClient_amplifyBackend, "f")
                    .getBackendAPIModels({
                    AppId: resolvedAppId,
                    BackendEnvironmentName: environmentName,
                    ResourceName: resourceName,
                })
                    .promise();
                return Models;
            }
            catch (err) {
                throw new Error(`Models not found in AmplifyBackend:GetBackendAPIModels response: ${err.message}`);
            }
        };
        __classPrivateFieldSet(this, _AmplifyStudioClient_amplifyUiBuilder, buildAmplifyUiBuilderClient(awsConfigInfo), "f");
        __classPrivateFieldSet(this, _AmplifyStudioClient_amplifyBackend, buildAmplifyBackendClient(awsConfigInfo), "f");
        __classPrivateFieldSet(this, _AmplifyStudioClient_appId, appId, "f");
        __classPrivateFieldSet(this, _AmplifyStudioClient_envName, envName, "f");
        this.metadata = {
            autoGenerateForms: false,
            autoGenerateViews: false,
        };
    }
}
exports.default = AmplifyStudioClient;
_a = AmplifyStudioClient, _AmplifyStudioClient_amplifyUiBuilder = new WeakMap(), _AmplifyStudioClient_amplifyBackend = new WeakMap(), _AmplifyStudioClient_appId = new WeakMap(), _AmplifyStudioClient_envName = new WeakMap();
AmplifyStudioClient.isAmplifyApp = async (context, appId) => {
    try {
        const { isAdminApp } = await amplify_cli_core_1.CloudformationProviderFacade.isAmplifyAdminApp(context, appId);
        return isAdminApp;
    }
    catch (err) {
        amplify_prompts_1.printer.debug(`Failed admin app check: ${err.message}`);
        return false;
    }
};
//# sourceMappingURL=amplify-studio-client.js.map