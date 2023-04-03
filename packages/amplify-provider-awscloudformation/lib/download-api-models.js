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
exports.downloadAPIModels = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const extract_zip_1 = __importDefault(require("extract-zip"));
const fs = __importStar(require("fs-extra"));
const promise_sequential_1 = __importDefault(require("promise-sequential"));
const aws_apigw_1 = require("./aws-utils/aws-apigw");
const downloadAPIModels = async (context, allResources) => {
    const { amplify } = context;
    const projectConfig = amplify.getProjectConfig();
    const framework = projectConfig.frontend;
    if (['javascript', 'flutter'].includes(framework)) {
        return;
    }
    const resources = allResources.filter((resource) => resource.service === 'API Gateway');
    const promises = [];
    if (resources.length > 0) {
        amplify_prompts_1.printer.blankLine();
        amplify_prompts_1.printer.info('Creating API models...');
    }
    for (const resource of resources) {
        if (resource.output.ApiName) {
            promises.push(() => extractAPIModel(context, resource, framework));
        }
    }
    return (0, promise_sequential_1.default)(promises);
};
exports.downloadAPIModels = downloadAPIModels;
const extractAPIModel = async (context, resource, framework) => {
    const apigw = await aws_apigw_1.APIGateway.getInstance(context);
    const apigwParams = getAPIGWRequestParams(resource, framework);
    const apiName = resource.output.ApiName;
    const data = await apigw.apigw.getSdk(apigwParams).promise();
    const backendDir = amplify_cli_core_1.pathManager.getBackendDirPath();
    const tempDir = `${backendDir}/.temp`;
    fs.ensureDirSync(tempDir);
    const buff = Buffer.from(data.body);
    fs.writeFileSync(`${tempDir}/${apiName}.zip`, buff);
    await (0, extract_zip_1.default)(`${tempDir}/${apiName}.zip`, { dir: tempDir });
    copyFilesToSrc(context, apiName, framework);
    fs.removeSync(tempDir);
};
const copyFilesToSrc = (context, apiName, framework) => {
    const backendDir = amplify_cli_core_1.pathManager.getBackendDirPath();
    const tempDir = `${backendDir}/.temp`;
    switch (framework) {
        case 'android':
            {
                const generatedSrc = `${tempDir}/${apiName}-Artifact-1.0/src/main/java`;
                const target = `${context.amplify.getEnvInfo().projectPath}/app/src/main/java`;
                fs.ensureDirSync(target);
                fs.copySync(generatedSrc, target);
            }
            break;
        case 'ios':
            {
                const generatedSrc = `${tempDir}/aws-apigateway-ios-swift/generated-src`;
                const target = `${context.amplify.getEnvInfo().projectPath}/generated-src`;
                fs.ensureDirSync(target);
                fs.copySync(generatedSrc, target);
            }
            break;
        default:
            throw new amplify_cli_core_1.AmplifyError('FrameworkNotSupportedError', {
                message: `Unsupported framework. ${framework}`,
            });
    }
};
const getAPIGWRequestParams = (resource, framework) => {
    const apiUrl = resource.output.RootUrl;
    const apiName = resource.output.ApiName;
    const firstSplit = apiUrl.split('/');
    const stage = firstSplit[3];
    const secondSplit = firstSplit[2].split('.');
    const apiId = secondSplit[0];
    switch (framework) {
        case 'android':
            return {
                restApiId: apiId,
                sdkType: framework,
                stageName: stage,
                parameters: {
                    groupId: `${apiName}-GroupID`,
                    invokerPackage: apiName,
                    artifactId: `${apiName}-Artifact`,
                    artifactVersion: '1.0',
                },
            };
        case 'ios':
            return {
                restApiId: apiId,
                sdkType: 'swift',
                stageName: stage,
                parameters: {
                    classPrefix: apiName,
                },
            };
        default:
            throw new amplify_cli_core_1.AmplifyError('FrameworkNotSupportedError', {
                message: `Unsupported framework. ${framework}`,
            });
    }
};
//# sourceMappingURL=download-api-models.js.map