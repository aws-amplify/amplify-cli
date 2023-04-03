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
exports.getNetworkResourceCfn = exports.createEnvLevelConstructs = void 0;
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const aws_s3_1 = require("../aws-utils/aws-s3");
const constants_1 = __importDefault(require("../constants"));
const environment_info_1 = require("../network/environment-info");
const stack_1 = require("../network/stack");
const pre_push_cfn_modifier_1 = require("../pre-push-cfn-processor/pre-push-cfn-modifier");
const consolidate_apigw_policies_1 = require("./consolidate-apigw-policies");
const upload_auth_trigger_template_1 = require("./upload-auth-trigger-template");
const { ProviderName: providerName } = constants_1.default;
const createEnvLevelConstructs = async (context) => {
    const { StackName: stackName } = context.amplify.getProjectMeta().providers[constants_1.default.ProviderName];
    const hasContainers = envHasContainers(context);
    const updatedMeta = {};
    Object.assign(updatedMeta, await createNetworkResources(context, stackName, hasContainers), await (0, consolidate_apigw_policies_1.consolidateApiGatewayPolicies)(context, stackName), await (0, upload_auth_trigger_template_1.uploadAuthTriggerTemplate)(context));
    context.amplify.updateProviderAmplifyMeta(providerName, updatedMeta);
    if (hasContainers) {
        const containerResourcesFilenames = ['custom-resource-pipeline-awaiter.zip', 'codepipeline-action-buildspec-generator-lambda.zip'];
        for (const file of containerResourcesFilenames) {
            await uploadResourceFile(context, file);
        }
    }
};
exports.createEnvLevelConstructs = createEnvLevelConstructs;
const createNetworkResources = async (context, stackName, needsVpc) => {
    if (!needsVpc) {
        return {
            NetworkStackS3Url: undefined,
        };
    }
    const cfn = await (0, exports.getNetworkResourceCfn)(context, stackName);
    await (0, pre_push_cfn_modifier_1.prePushCfnTemplateModifier)(cfn);
    const cfnFile = 'networkingStackTemplate.json';
    const s3 = await aws_s3_1.S3.getInstance(context);
    const s3Params = {
        Body: JSON.stringify(cfn, null, 2),
        Key: `amplify-cfn-templates/${cfnFile}`,
    };
    const projectBucket = await s3.uploadFile(s3Params);
    const templateURL = `https://s3.amazonaws.com/${projectBucket}/amplify-cfn-templates/${cfnFile}`;
    return {
        NetworkStackS3Url: templateURL,
    };
};
const getNetworkResourceCfn = async (context, stackName) => {
    const vpcName = 'Amplify/VPC-do-not-delete';
    const { vpcId, internetGatewayId, subnetCidrs } = await (0, environment_info_1.getEnvironmentNetworkInfo)(context, {
        stackName,
        vpcName,
        vpcCidr: '10.0.0.0/16',
        subnetsCount: 3,
        subnetMask: 24,
    });
    const stack = new stack_1.NetworkStack(undefined, 'Amplify', {
        stackName,
        vpcName,
        vpcId,
        internetGatewayId,
        subnetCidrs,
    });
    return stack.toCloudFormation();
};
exports.getNetworkResourceCfn = getNetworkResourceCfn;
const envHasContainers = (context) => {
    const { api: apiObj, hosting: hostingObj } = context.amplify.getProjectMeta();
    if (apiObj) {
        const found = Object.keys(apiObj).some((key) => {
            const api = apiObj[key];
            if (api.providerPlugin === providerName && api.service === 'ElasticContainer') {
                return true;
            }
        });
        if (found) {
            return true;
        }
    }
    if (hostingObj) {
        const found = Object.keys(hostingObj).some((key) => {
            const hosting = hostingObj[key];
            if (hosting.providerPlugin === providerName && hosting.service === 'ElasticContainer') {
                return true;
            }
        });
        if (found) {
            return true;
        }
    }
    return false;
};
const uploadResourceFile = async (context, fileName) => {
    const filePath = path.join(__dirname, '..', '..', 'resources', fileName);
    const s3 = await aws_s3_1.S3.getInstance(context);
    const s3Params = {
        Body: fs.createReadStream(filePath),
        Key: fileName,
    };
    return s3.uploadFile(s3Params, true);
};
//# sourceMappingURL=env-level-constructs.js.map