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
exports.uploadAuthTriggerTemplate = exports.AUTH_TRIGGER_STACK = exports.AUTH_TRIGGER_TEMPLATE = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const path = __importStar(require("path"));
const lodash_1 = __importDefault(require("lodash"));
const push_resources_1 = require("../push-resources");
const constants_1 = require("../constants");
exports.AUTH_TRIGGER_TEMPLATE = 'auth-trigger-cloudformation-template.json';
exports.AUTH_TRIGGER_STACK = 'AuthTriggerCustomLambdaStack';
const S3_UPLOAD_PATH = `auth/${exports.AUTH_TRIGGER_TEMPLATE}`;
const uploadAuthTriggerTemplate = async (context) => {
    const defaultResult = {
        AuthTriggerTemplateURL: undefined,
    };
    if (!amplify_cli_core_1.FeatureFlags.getBoolean('auth.breakCircularDependency')) {
        return defaultResult;
    }
    const categoryName = 'auth';
    const serviceName = 'Cognito';
    const { amplifyMeta } = context.amplify.getProjectDetails();
    const cognitoResource = amplify_cli_core_1.stateManager.getResourceFromMeta(amplifyMeta, categoryName, serviceName, undefined, false);
    if (cognitoResource === null) {
        return defaultResult;
    }
    const resourceDir = path.join(amplify_cli_core_1.pathManager.getBackendDirPath(), categoryName, cognitoResource.resourceName);
    const authTriggerCfnFilePath = path.join(resourceDir, 'build', exports.AUTH_TRIGGER_TEMPLATE);
    const deploymentBucketName = lodash_1.default.get(amplifyMeta, ['providers', constants_1.ProviderName, 'DeploymentBucketName']);
    if (!deploymentBucketName) {
        throw new amplify_cli_core_1.AmplifyError('BucketNotFoundError', {
            message: 'DeploymentBucket was not found in amplify-meta.json',
        });
    }
    const triggerCfnContent = amplify_cli_core_1.JSONUtilities.readJson(authTriggerCfnFilePath, {
        throwIfNotExist: false,
    });
    if (!triggerCfnContent) {
        return defaultResult;
    }
    await (0, push_resources_1.uploadTemplateToS3)(context, authTriggerCfnFilePath, categoryName, '', null);
    return {
        AuthTriggerTemplateURL: `https://s3.amazonaws.com/${deploymentBucketName}/amplify-cfn-templates/${S3_UPLOAD_PATH}`,
    };
};
exports.uploadAuthTriggerTemplate = uploadAuthTriggerTemplate;
//# sourceMappingURL=upload-auth-trigger-template.js.map