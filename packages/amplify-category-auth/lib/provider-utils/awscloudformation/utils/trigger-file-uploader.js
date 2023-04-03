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
exports.uploadFiles = void 0;
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const fs_extra_1 = require("fs-extra");
const mime_types_1 = __importDefault(require("mime-types"));
const path = __importStar(require("path"));
const getAuthResourceName_1 = require("../../../utils/getAuthResourceName");
const providerName = 'awscloudformation';
const getS3Client = async (context, action) => {
    var _a;
    const providerPlugins = context.amplify.getProviderPlugins(context);
    const provider = await (_a = providerPlugins[providerName], Promise.resolve().then(() => __importStar(require(_a))));
    const aws = await provider.getConfiguredAWSClient(context, amplify_cli_core_1.AmplifyCategories.AUTH, action);
    return new aws.S3();
};
const uploadFiles = async (context) => {
    try {
        const s3Client = await getS3Client(context, 'update');
        const authResource = await (0, getAuthResourceName_1.getAuthResourceName)(context);
        const authPath = amplify_cli_core_1.pathManager.getResourceDirectoryPath(undefined, amplify_cli_core_1.AmplifyCategories.AUTH, authResource);
        if (!authPath) {
            return;
        }
        const assetPath = path.join(authPath, 'assets');
        const env = context.amplify.getEnvInfo().envName;
        const authParams = amplify_cli_core_1.stateManager.getResourceParametersJson(undefined, amplify_cli_core_1.AmplifyCategories.AUTH, authResource);
        const bucketName = `${authParams.verificationBucketName}-${env}`;
        if (!(0, fs_extra_1.existsSync)(assetPath)) {
            return;
        }
        const fileList = (0, fs_extra_1.readdirSync)(assetPath);
        const uploadFileTasks = [];
        fileList.forEach((file) => {
            uploadFileTasks.push(async () => uploadFile(s3Client, bucketName, path.join(assetPath, file), file));
        });
        try {
            amplify_cli_core_1.spinner.start('Uploading files.');
            await Promise.all(uploadFileTasks);
            amplify_cli_core_1.spinner.succeed('Uploaded files successfully.');
        }
        catch (e) {
            amplify_cli_core_1.spinner.fail('Error has occurred during file upload.');
            throw e;
        }
    }
    catch (e) {
        throw new amplify_cli_core_1.AmplifyFault('TriggerUploadFault', { message: 'Unable to upload trigger files to S3' }, e);
    }
};
exports.uploadFiles = uploadFiles;
const uploadFile = async (s3Client, hostingBucketName, filePath, file) => {
    const fileStream = (0, fs_extra_1.createReadStream)(filePath);
    const contentType = mime_types_1.default.lookup(filePath);
    const uploadParams = {
        Bucket: hostingBucketName,
        Key: file,
        Body: fileStream,
        ContentType: contentType || 'text/plain',
        ACL: 'public-read',
    };
    return s3Client.upload(uploadParams).promise();
};
//# sourceMappingURL=trigger-file-uploader.js.map