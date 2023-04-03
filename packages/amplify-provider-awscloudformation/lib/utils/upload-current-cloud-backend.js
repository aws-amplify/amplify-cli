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
exports.storeCurrentCloudBackend = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const fs = __importStar(require("fs-extra"));
const glob_1 = __importDefault(require("glob"));
const path = __importStar(require("path"));
const aws_s3_1 = require("../aws-utils/aws-s3");
const archiver_1 = __importDefault(require("./archiver"));
const aws_logger_1 = require("./aws-logger");
const logger = (0, aws_logger_1.fileLogger)('upload-current-cloud-backend');
const uploadStudioBackendFiles = async (s3, bucketName) => {
    const amplifyDirPath = amplify_cli_core_1.pathManager.getAmplifyDirPath();
    const studioBackendDirName = 'studio-backend';
    await s3.deleteDirectory(bucketName, studioBackendDirName);
    const uploadFileParams = [
        'cli.json',
        'amplify-meta.json',
        'backend-config.json',
        'schema.graphql',
        'transform.conf.json',
        'parameters.json',
    ]
        .flatMap((baseName) => glob_1.default.sync(`**/${baseName}`, { cwd: amplifyDirPath }))
        .filter((filePath) => !filePath.startsWith('backend'))
        .map((filePath) => ({
        Body: fs.createReadStream(path.join(amplifyDirPath, filePath)),
        Key: path.join(studioBackendDirName, filePath.replace('#current-cloud-backend', '')),
    }));
    await Promise.all(uploadFileParams.map((params) => s3.uploadFile(params, false)));
};
const storeCurrentCloudBackend = async (context) => {
    const zipFilename = '#current-cloud-backend.zip';
    const backendDir = amplify_cli_core_1.pathManager.getBackendDirPath();
    const tempDir = path.join(backendDir, '.temp');
    const currentCloudBackendDir = amplify_cli_core_1.pathManager.getCurrentCloudBackendDirPath();
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir);
    }
    const spinner = new amplify_prompts_1.AmplifySpinner();
    try {
        spinner.start('Saving deployment state...');
        const tagFilePath = amplify_cli_core_1.pathManager.getTagFilePath();
        const tagCloudFilePath = amplify_cli_core_1.pathManager.getCurrentTagFilePath();
        if (fs.existsSync(tagFilePath)) {
            fs.copySync(tagFilePath, tagCloudFilePath, { overwrite: true });
        }
        const cliJSONFiles = glob_1.default.sync(amplify_cli_core_1.PathConstants.CLIJSONFileNameGlob, {
            cwd: amplify_cli_core_1.pathManager.getAmplifyDirPath(),
            absolute: true,
        });
        const zipFilePath = path.normalize(path.join(tempDir, zipFilename));
        const result = await archiver_1.default.run(currentCloudBackendDir, zipFilePath, undefined, cliJSONFiles);
        const s3Key = `${result.zipFilename}`;
        const s3 = await aws_s3_1.S3.getInstance(context);
        const s3Params = {
            Body: fs.createReadStream(result.zipFilePath),
            Key: s3Key,
        };
        logger('storeCurrentCloudBackend.s3.uploadFile', [{ Key: s3Key }])();
        const deploymentBucketName = await s3.uploadFile(s3Params);
        await uploadStudioBackendFiles(s3, deploymentBucketName);
        spinner.stop('Deployment state saved successfully.');
    }
    catch (e) {
        spinner.stop('Deployment state save failed.', false);
        throw new amplify_cli_core_1.AmplifyFault('DeploymentStateUploadFault', {
            message: e.message,
        }, e);
    }
    finally {
        fs.removeSync(tempDir);
    }
};
exports.storeCurrentCloudBackend = storeCurrentCloudBackend;
//# sourceMappingURL=upload-current-cloud-backend.js.map