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
exports.migrateResourceToSupportOverride = void 0;
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const path = __importStar(require("path"));
const uuid_1 = require("uuid");
const fs = __importStar(require("fs-extra"));
const lodash_1 = __importDefault(require("lodash"));
const migrateResourceToSupportOverride = async (resourceName) => {
    var _a;
    amplify_prompts_1.printer.debug('Starting Migration Process');
    const projectPath = amplify_cli_core_1.pathManager.findProjectRoot();
    if (!projectPath) {
        throw (0, amplify_cli_core_1.projectNotInitializedError)();
    }
    const authResourceDirPath = amplify_cli_core_1.pathManager.getResourceDirectoryPath(undefined, amplify_cli_core_1.AmplifyCategories.AUTH, resourceName);
    const userPoolGroupResourceDirPath = amplify_cli_core_1.pathManager.getResourceDirectoryPath(undefined, amplify_cli_core_1.AmplifyCategories.AUTH, 'userPoolGroups');
    const backupAuthResourceFolder = backup(authResourceDirPath, projectPath, resourceName);
    const backupUserPoolGroupResourceFolder = backup(userPoolGroupResourceDirPath, projectPath, 'userPoolGroups');
    try {
        const parameters = amplify_cli_core_1.JSONUtilities.readJson(path.join(authResourceDirPath, 'parameters.json'), { throwIfNotExist: true });
        fs.emptyDirSync(authResourceDirPath);
        if (((_a = parameters === null || parameters === void 0 ? void 0 : parameters.userPoolGroupList) === null || _a === void 0 ? void 0 : _a.length) > 0) {
            fs.unlinkSync(path.join(userPoolGroupResourceDirPath, 'template.json'));
            fs.unlinkSync(path.join(userPoolGroupResourceDirPath, 'parameters.json'));
        }
        const cliInputs = mapParametersJsonToCliInputs(parameters);
        const cliInputsPath = path.join(authResourceDirPath, 'cli-inputs.json');
        amplify_cli_core_1.JSONUtilities.writeJson(cliInputsPath, cliInputs);
        amplify_prompts_1.printer.debug('Migration is Successful');
    }
    catch (e) {
        rollback(authResourceDirPath, backupAuthResourceFolder);
        rollback(userPoolGroupResourceDirPath, backupUserPoolGroupResourceFolder);
        throw new amplify_cli_core_1.AmplifyError('MigrationError', {
            message: `There was an error migrating your project: ${e.message}`,
            details: `Migration operations are rolled back.`,
        }, e);
    }
    finally {
        cleanUp(backupAuthResourceFolder);
        cleanUp(backupUserPoolGroupResourceFolder);
    }
};
exports.migrateResourceToSupportOverride = migrateResourceToSupportOverride;
const backup = (authResourcePath, projectPath, resourceName) => {
    if (fs.existsSync(authResourcePath)) {
        const backupAuthResourceDirName = `${resourceName}-BACKUP-${(0, uuid_1.v4)().split('-')[0]}`;
        const backupAuthResourceDirPath = path.join(projectPath, backupAuthResourceDirName);
        if (fs.existsSync(backupAuthResourceDirPath)) {
            throw new amplify_cli_core_1.AmplifyError('MigrationError', {
                message: `Backup folder for ${resourceName} already exists.`,
                resolution: `Delete the backup folder and try again.`,
            });
        }
        fs.copySync(authResourcePath, backupAuthResourceDirPath);
        return backupAuthResourceDirPath;
    }
    return undefined;
};
const rollback = (authResourcePath, backupAuthResourceDirPath) => {
    if (fs.existsSync(authResourcePath) && fs.existsSync(backupAuthResourceDirPath)) {
        fs.removeSync(authResourcePath);
        fs.moveSync(backupAuthResourceDirPath, authResourcePath);
    }
};
const cleanUp = (authResourcePath) => {
    if (!!authResourcePath && fs.existsSync(authResourcePath))
        fs.removeSync(authResourcePath);
};
const mapParametersJsonToCliInputs = (parameters) => {
    const baseResult = {
        authSelections: parameters.authSelections,
        requiredAttributes: parameters.requiredAttributes,
        resourceName: parameters.resourceName,
        serviceName: parameters.serviceName,
        useDefault: parameters.useDefault,
        userpoolClientReadAttributes: parameters.userpoolClientReadAttributes,
        userpoolClientWriteAttributes: parameters.userpoolClientWriteAttributes,
        aliasAttributes: parameters.aliasAttributes,
        resourceNameTruncated: parameters.resourceNameTruncated,
        sharedId: parameters.sharedId,
        updateFlow: parameters.updateFlow,
        userPoolGroupList: parameters.userPoolGroupList,
        userPoolGroups: parameters.userPoolGroups,
        userPoolName: parameters.userPoolName,
        usernameAttributes: parameters.usernameAttributes,
        usernameCaseSensitive: parameters.usernameCaseSensitive,
        userpoolClientRefreshTokenValidity: parameters.userpoolClientRefreshTokenValidity,
        userpoolClientSetAttributes: parameters.userpoolClientSetAttributes,
        verificationBucketName: parameters.verificationBucketName,
        userpoolClientGenerateSecret: parameters.userpoolClientGenerateSecret,
        userpoolClientLambdaRole: parameters.userpoolClientLambdaRole,
    };
    const oAuthResult = {
        hostedUI: parameters.hostedUI,
        hostedUIDomainName: parameters.hostedUIDomainName,
        hostedUIProviderMeta: parameters.hostedUIProviderMeta,
        oAuthMetadata: parameters.oAuthMetadata,
    };
    const socialProviderResult = {
        authProvidersUserPool: parameters.authProvidersUserPool,
    };
    const identityPoolResult = {
        thirdPartyAuth: parameters.thirdPartyAuth,
        identityPoolName: parameters.identityPoolName,
        allowUnauthenticatedIdentities: parameters.allowUnauthenticatedIdentities,
        authProviders: parameters.authProviders,
        googleClientId: parameters.googleClientId,
        googleIos: parameters.googleIos,
        googleAndroid: parameters.googleAndroid,
        facebookAppId: parameters.facebookAppId,
        amazonAppId: parameters.amazonAppId,
        appleAppId: parameters.appleAppId,
        selectedParties: parameters.selectedParties,
        audiences: parameters.audiences,
    };
    const passwordRecoveryResult = {
        emailVerificationMessage: parameters.emailVerificationMessage,
        emailVerificationSubject: parameters.emailVerificationSubject,
        smsVerificationMessage: parameters.smsVerificationMessage,
        autoVerifiedAttributes: parameters.autoVerifiedAttributes,
    };
    const mfaResult = {
        mfaConfiguration: parameters.mfaConfiguration,
        mfaTypes: parameters.mfaTypes,
        smsAuthenticationMessage: parameters.smsAuthenticationMessage,
    };
    const adminQueriesResult = {
        adminQueries: parameters.adminQueries,
        adminQueryGroup: parameters.adminQueryGroup,
    };
    const passwordPolicyResult = {
        passwordPolicyCharacters: parameters.passwordPolicyCharacters,
        passwordPolicyMinLength: parameters.passwordPolicyMinLength,
    };
    const cliInputs = {
        ...baseResult,
        ...passwordPolicyResult,
        ...adminQueriesResult,
        ...mfaResult,
        ...passwordRecoveryResult,
        ...oAuthResult,
        ...socialProviderResult,
        ...identityPoolResult,
    };
    if (parameters.triggers) {
        cliInputs.triggers = JSON.parse(parameters.triggers);
    }
    const filteredCliInputs = lodash_1.default.pickBy(cliInputs, (v) => v !== undefined);
    return {
        version: '1',
        cognitoConfig: filteredCliInputs,
    };
};
//# sourceMappingURL=migrate-override-resource.js.map