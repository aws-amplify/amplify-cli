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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFrontendConfig = exports.getPostUpdateAuthMetaUpdater = exports.getPostAddAuthMetaUpdater = void 0;
const path = __importStar(require("path"));
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const string_maps_1 = require("../assets/string-maps");
const getPostAddAuthMetaUpdater = (context, resultMetadata) => (resourceName) => {
    const options = {
        service: resultMetadata.service,
        providerPlugin: resultMetadata.providerName,
    };
    const parametersJSONPath = path.join(context.amplify.pathManager.getBackendDirPath(), 'auth', resourceName, 'build', 'parameters.json');
    const authParameters = amplify_cli_core_1.JSONUtilities.readJson(parametersJSONPath);
    if (authParameters.dependsOn) {
        options.dependsOn = authParameters.dependsOn;
    }
    let customAuthConfigured = false;
    if (authParameters.triggers) {
        const triggers = amplify_cli_core_1.JSONUtilities.parse(authParameters.triggers);
        customAuthConfigured =
            !!triggers.DefineAuthChallenge &&
                triggers.DefineAuthChallenge.length > 0 &&
                !!triggers.CreateAuthChallenge &&
                triggers.CreateAuthChallenge.length > 0 &&
                !!triggers.VerifyAuthChallengeResponse &&
                triggers.VerifyAuthChallengeResponse.length > 0;
    }
    options.customAuth = customAuthConfigured;
    options.frontendAuthConfig = (0, exports.getFrontendConfig)(authParameters);
    context.amplify.updateamplifyMetaAfterResourceAdd('auth', resourceName, options);
    const allResources = context.amplify.getProjectMeta();
    if (allResources.auth && allResources.auth.userPoolGroups) {
        if (!authParameters.identityPoolName) {
            const userPoolGroupDependsOn = [
                {
                    category: 'auth',
                    resourceName,
                    attributes: ['UserPoolId', 'AppClientIDWeb', 'AppClientID'],
                },
            ];
            context.amplify.updateamplifyMetaAfterResourceUpdate('auth', 'userPoolGroups', 'dependsOn', userPoolGroupDependsOn);
        }
    }
    return resourceName;
};
exports.getPostAddAuthMetaUpdater = getPostAddAuthMetaUpdater;
const getPostUpdateAuthMetaUpdater = (context) => async (resourceName) => {
    const resourceDirPath = path.join(amplify_cli_core_1.pathManager.getBackendDirPath(), 'auth', resourceName, 'build', 'parameters.json');
    const authParameters = amplify_cli_core_1.JSONUtilities.readJson(resourceDirPath);
    if (authParameters.dependsOn) {
        context.amplify.updateamplifyMetaAfterResourceUpdate('auth', resourceName, 'dependsOn', authParameters.dependsOn);
    }
    let customAuthConfigured = false;
    if (authParameters.triggers) {
        const triggers = amplify_cli_core_1.JSONUtilities.parse(authParameters.triggers);
        customAuthConfigured =
            !!triggers.DefineAuthChallenge &&
                triggers.DefineAuthChallenge.length > 0 &&
                !!triggers.CreateAuthChallenge &&
                triggers.CreateAuthChallenge.length > 0 &&
                !!triggers.VerifyAuthChallengeResponse &&
                triggers.VerifyAuthChallengeResponse.length > 0;
    }
    context.amplify.updateamplifyMetaAfterResourceUpdate('auth', resourceName, 'customAuth', customAuthConfigured);
    context.amplify.updateamplifyMetaAfterResourceUpdate('auth', resourceName, 'frontendAuthConfig', (0, exports.getFrontendConfig)(authParameters));
    const allResources = context.amplify.getProjectMeta();
    if (allResources.auth && allResources.auth.userPoolGroups) {
        const attributes = ['UserPoolId', 'AppClientIDWeb', 'AppClientID'];
        if (authParameters.identityPoolName) {
            attributes.push('IdentityPoolId');
        }
        const userPoolGroupDependsOn = [
            {
                category: 'auth',
                resourceName,
                attributes,
            },
        ];
        context.amplify.updateamplifyMetaAfterResourceUpdate('auth', 'userPoolGroups', 'dependsOn', userPoolGroupDependsOn);
    }
    return resourceName;
};
exports.getPostUpdateAuthMetaUpdater = getPostUpdateAuthMetaUpdater;
const getFrontendConfig = (authParameters) => {
    var _a;
    const verificationMechanisms = ((authParameters === null || authParameters === void 0 ? void 0 : authParameters.autoVerifiedAttributes) || []).map((att) => att.toUpperCase());
    const usernameAttributes = [];
    if ((authParameters === null || authParameters === void 0 ? void 0 : authParameters.usernameAttributes) && authParameters.usernameAttributes.length > 0) {
        authParameters.usernameAttributes[0].split(',').forEach((it) => usernameAttributes.push(it.trim().toUpperCase()));
    }
    const socialProviders = [];
    ((_a = authParameters === null || authParameters === void 0 ? void 0 : authParameters.authProvidersUserPool) !== null && _a !== void 0 ? _a : []).forEach((provider) => {
        var _a;
        const key = (_a = string_maps_1.hostedUIProviders.find((it) => it.value === provider)) === null || _a === void 0 ? void 0 : _a.key;
        if (key) {
            socialProviders.push(key);
        }
    });
    const signupAttributes = ((authParameters === null || authParameters === void 0 ? void 0 : authParameters.requiredAttributes) || []).map((att) => att.toUpperCase());
    const passwordProtectionSettings = {
        passwordPolicyMinLength: authParameters === null || authParameters === void 0 ? void 0 : authParameters.passwordPolicyMinLength,
        passwordPolicyCharacters: ((authParameters === null || authParameters === void 0 ? void 0 : authParameters.passwordPolicyCharacters) || []).map((i) => i.replace(/ /g, '_').toUpperCase()),
    };
    const mfaTypes = [];
    if (authParameters.mfaTypes) {
        if (authParameters.mfaTypes.includes('SMS Text Message')) {
            mfaTypes.push('SMS');
        }
        if (authParameters.mfaTypes.includes('TOTP')) {
            mfaTypes.push('TOTP');
        }
    }
    return {
        socialProviders,
        usernameAttributes,
        signupAttributes,
        passwordProtectionSettings,
        mfaConfiguration: authParameters === null || authParameters === void 0 ? void 0 : authParameters.mfaConfiguration,
        mfaTypes,
        verificationMechanisms,
    };
};
exports.getFrontendConfig = getFrontendConfig;
//# sourceMappingURL=amplify-meta-updaters.js.map