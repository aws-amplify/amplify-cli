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
exports.adminModelgen = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const fs = __importStar(require("fs-extra"));
const lodash_1 = __importDefault(require("lodash"));
const path = __importStar(require("path"));
const aws_s3_1 = require("./aws-utils/aws-s3");
const constants_1 = require("./constants");
const adminModelgen = async (context, resources) => {
    var _a, _b;
    const appSyncResources = resources.filter((resource) => resource.service === 'AppSync');
    if (appSyncResources.length === 0) {
        return;
    }
    const appSyncResource = appSyncResources[0];
    const { resourceName } = appSyncResource;
    const amplifyMeta = amplify_cli_core_1.stateManager.getMeta();
    const appId = (_b = (_a = amplifyMeta === null || amplifyMeta === void 0 ? void 0 : amplifyMeta.providers) === null || _a === void 0 ? void 0 : _a[constants_1.ProviderName]) === null || _b === void 0 ? void 0 : _b.AmplifyAppId;
    if (!appId) {
        return;
    }
    const originalProjectConfig = amplify_cli_core_1.stateManager.getProjectConfig();
    const relativeTempOutputDir = 'amplify-codegen-temp';
    const absoluteTempOutputDir = path.join(amplify_cli_core_1.pathManager.findProjectRoot(), relativeTempOutputDir);
    const forceJSCodegenProjectConfig = {
        frontend: 'javascript',
        javascript: {
            framework: 'none',
            config: {
                SourceDir: relativeTempOutputDir,
            },
        },
    };
    const originalStdoutWrite = process.stdout.write;
    let tempStdoutWrite = null;
    try {
        amplify_cli_core_1.stateManager.setProjectConfig(undefined, forceJSCodegenProjectConfig);
        await fs.ensureDir(absoluteTempOutputDir);
        const tempLogFilePath = path.join(absoluteTempOutputDir, 'temp-console-log.txt');
        await fs.ensureFile(tempLogFilePath);
        tempStdoutWrite = fs.createWriteStream(tempLogFilePath);
        process.stdout.write = tempStdoutWrite.write.bind(tempStdoutWrite);
        await context.amplify.invokePluginMethod(context, 'codegen', undefined, 'generateModels', [context]);
        lodash_1.default.setWith(context, ['parameters', 'options', 'output-dir'], relativeTempOutputDir);
        await context.amplify.invokePluginMethod(context, 'codegen', undefined, 'generateModelIntrospection', [context]);
        const localSchemaPath = path.join(amplify_cli_core_1.pathManager.getResourceDirectoryPath(undefined, 'api', resourceName), 'schema.graphql');
        const localSchemaJsPath = path.join(absoluteTempOutputDir, 'models', 'schema.js');
        const localModelIntrospectionPath = path.join(absoluteTempOutputDir, 'model-introspection.json');
        const s3ApiModelsPrefix = `models/${resourceName}/`;
        const cmsArtifactLocalToS3KeyMap = {
            [localSchemaPath]: `${s3ApiModelsPrefix}schema.graphql`,
            [localSchemaJsPath]: `${s3ApiModelsPrefix}schema.js`,
            [localModelIntrospectionPath]: `${s3ApiModelsPrefix}modelIntrospection.json`,
        };
        await uploadCMSArtifacts(await aws_s3_1.S3.getInstance(context), cmsArtifactLocalToS3KeyMap);
    }
    finally {
        amplify_cli_core_1.stateManager.setProjectConfig(undefined, originalProjectConfig);
        process.stdout.write = originalStdoutWrite;
        if (tempStdoutWrite) {
            await new Promise((resolve, reject) => {
                tempStdoutWrite.close((err) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(null);
                    }
                });
            });
        }
        await fs.remove(absoluteTempOutputDir);
    }
};
exports.adminModelgen = adminModelgen;
const uploadCMSArtifacts = async (s3Client, uploadMap) => {
    const doNotShowSpinner = false;
    const uploadPromises = Object.entries(uploadMap)
        .map(([localPath, s3Key]) => ({
        Body: fs.createReadStream(localPath),
        Key: s3Key,
    }))
        .map((uploadParams) => s3Client.uploadFile(uploadParams, doNotShowSpinner));
    await Promise.all(uploadPromises);
};
//# sourceMappingURL=admin-modelgen.js.map