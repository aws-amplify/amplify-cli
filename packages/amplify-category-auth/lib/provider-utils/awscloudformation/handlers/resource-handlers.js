"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUpdateAuthHandler = exports.getAddAuthHandler = void 0;
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const amplify_environment_parameters_1 = require("@aws-amplify/amplify-environment-parameters");
const supported_services_1 = require("../../supported-services");
const string_maps_1 = require("../assets/string-maps");
const auth_input_state_1 = require("../auth-inputs-manager/auth-input-state");
const constants_1 = require("../constants");
const amplify_meta_updaters_1 = require("../utils/amplify-meta-updaters");
const auth_defaults_appliers_1 = require("../utils/auth-defaults-appliers");
const auth_sms_workflow_helper_1 = require("../utils/auth-sms-workflow-helper");
const generate_auth_stack_template_1 = require("../utils/generate-auth-stack-template");
const message_printer_1 = require("../utils/message-printer");
const synthesize_resources_1 = require("../utils/synthesize-resources");
const getAddAuthHandler = (context) => async (request) => {
    const serviceMetadata = (0, supported_services_1.getSupportedServices)()[request.serviceName];
    const { defaultValuesFilename, provider } = serviceMetadata;
    let projectName = context.amplify.getProjectConfig().projectName.toLowerCase();
    const disallowedChars = /[^A-Za-z0-9]+/g;
    projectName = projectName.replace(disallowedChars, '');
    const requestWithDefaults = await (0, auth_defaults_appliers_1.getAddAuthDefaultsApplier)(context, defaultValuesFilename, projectName)(request);
    let sharedParams = { ...requestWithDefaults };
    constants_1.privateKeys.forEach((p) => delete sharedParams[p]);
    sharedParams = (0, synthesize_resources_1.removeDeprecatedProps)(sharedParams);
    const envSpecificParams = {};
    const cliInputs = { ...sharedParams };
    constants_1.ENV_SPECIFIC_PARAMS.forEach((paramName) => {
        if (paramName in request) {
            envSpecificParams[paramName] = cliInputs[paramName];
            delete cliInputs[paramName];
        }
    });
    const cognitoCLIInputs = {
        version: '1',
        cognitoConfig: cliInputs,
    };
    await (0, amplify_environment_parameters_1.ensureEnvParamManager)();
    context.amplify.saveEnvResourceParameters(context, constants_1.category, cognitoCLIInputs.cognitoConfig.resourceName, envSpecificParams);
    try {
        const cliState = new auth_input_state_1.AuthInputState(context, cognitoCLIInputs.cognitoConfig.resourceName);
        await cliState.saveCLIInputPayload(cognitoCLIInputs);
        await (0, generate_auth_stack_template_1.generateAuthStackTemplate)(context, cognitoCLIInputs.cognitoConfig.resourceName);
        await (0, synthesize_resources_1.getResourceSynthesizer)(context, requestWithDefaults);
        (0, amplify_meta_updaters_1.getPostAddAuthMetaUpdater)(context, { service: cognitoCLIInputs.cognitoConfig.serviceName, providerName: provider })(cliInputs.resourceName);
        (0, message_printer_1.getPostAddAuthMessagePrinter)(cognitoCLIInputs.cognitoConfig.resourceName);
        if ((0, auth_sms_workflow_helper_1.doesConfigurationIncludeSMS)(request)) {
            await (0, message_printer_1.printSMSSandboxWarning)();
        }
    }
    catch (err) {
        amplify_prompts_1.printer.info(err.stack);
        amplify_prompts_1.printer.error('There was an error adding the auth resource');
        void context.usageData.emitError(err);
        process.exitCode = 1;
    }
    return cognitoCLIInputs.cognitoConfig.resourceName;
};
exports.getAddAuthHandler = getAddAuthHandler;
const getUpdateAuthHandler = (context) => async (request) => {
    const { defaultValuesFilename } = (0, supported_services_1.getSupportedServices)()[request.serviceName];
    const requestWithDefaults = await (0, auth_defaults_appliers_1.getUpdateAuthDefaultsApplier)(context, defaultValuesFilename, context.updatingAuth)(request);
    const resources = amplify_cli_core_1.stateManager.getMeta();
    if (resources.auth.userPoolGroups) {
        await (0, synthesize_resources_1.updateUserPoolGroups)(context, requestWithDefaults.resourceName, requestWithDefaults.userPoolGroupList);
    }
    else {
        await (0, synthesize_resources_1.createUserPoolGroups)(context, requestWithDefaults.resourceName, requestWithDefaults.userPoolGroupList);
    }
    if ((!requestWithDefaults.updateFlow && !requestWithDefaults.thirdPartyAuth) ||
        (requestWithDefaults.updateFlow === 'manual' && !requestWithDefaults.thirdPartyAuth)) {
        delete requestWithDefaults.selectedParties;
        requestWithDefaults.authProviders = [];
        string_maps_1.authProviders.forEach((a) => delete requestWithDefaults[a.answerHashKey]);
        if (requestWithDefaults.googleIos) {
            delete requestWithDefaults.googleIos;
        }
        if (requestWithDefaults.googleAndroid) {
            delete requestWithDefaults.googleAndroid;
        }
        if (requestWithDefaults.audiences) {
            delete requestWithDefaults.audiences;
        }
    }
    if (requestWithDefaults.useDefault === 'default' || requestWithDefaults.hostedUI === false) {
        delete requestWithDefaults.oAuthMetadata;
        delete requestWithDefaults.hostedUIProviderMeta;
        delete requestWithDefaults.hostedUIProviderCreds;
        delete requestWithDefaults.hostedUIDomainName;
        delete requestWithDefaults.authProvidersUserPool;
    }
    let sharedParams = { ...requestWithDefaults };
    constants_1.privateKeys.forEach((p) => delete sharedParams[p]);
    sharedParams = (0, synthesize_resources_1.removeDeprecatedProps)(sharedParams);
    const envSpecificParams = {};
    const cliInputs = { ...sharedParams };
    constants_1.ENV_SPECIFIC_PARAMS.forEach((paramName) => {
        if (paramName in cliInputs) {
            envSpecificParams[paramName] = cliInputs[paramName];
            delete cliInputs[paramName];
        }
    });
    context.amplify.saveEnvResourceParameters(context, constants_1.category, requestWithDefaults.resourceName, envSpecificParams);
    await (0, synthesize_resources_1.getResourceUpdater)(context, cliInputs);
    const cognitoCLIInputs = {
        version: '1',
        cognitoConfig: cliInputs,
    };
    try {
        const cliState = new auth_input_state_1.AuthInputState(context, cognitoCLIInputs.cognitoConfig.resourceName);
        const { triggers } = cognitoCLIInputs.cognitoConfig;
        if (triggers && typeof triggers === 'string') {
            cognitoCLIInputs.cognitoConfig.triggers = JSON.parse(triggers);
        }
        await cliState.saveCLIInputPayload(cognitoCLIInputs);
        if (request.updateFlow !== 'updateUserPoolGroups' && request.updateFlow !== 'updateAdminQueries') {
            await (0, generate_auth_stack_template_1.generateAuthStackTemplate)(context, cognitoCLIInputs.cognitoConfig.resourceName);
        }
        await (0, amplify_meta_updaters_1.getPostUpdateAuthMetaUpdater)(context)(cognitoCLIInputs.cognitoConfig.resourceName);
        await (0, message_printer_1.getPostUpdateAuthMessagePrinter)()(cognitoCLIInputs.cognitoConfig.resourceName);
        if ((0, auth_sms_workflow_helper_1.doesConfigurationIncludeSMS)(cliInputs)) {
            await (0, message_printer_1.printSMSSandboxWarning)();
        }
    }
    catch (err) {
        amplify_prompts_1.printer.info(err.stack);
        amplify_prompts_1.printer.error('There was an error updating the auth resource');
        void context.usageData.emitError(err);
        process.exitCode = 1;
    }
    return cognitoCLIInputs.cognitoConfig.resourceName;
};
exports.getUpdateAuthHandler = getUpdateAuthHandler;
//# sourceMappingURL=resource-handlers.js.map