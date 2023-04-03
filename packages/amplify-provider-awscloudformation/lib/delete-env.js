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
exports.run = void 0;
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const amplify_cli_core_1 = require("amplify-cli-core");
const configuration_manager_1 = require("./configuration-manager");
const aws_cfn_1 = __importDefault(require("./aws-utils/aws-cfn"));
const aws_s3_1 = require("./aws-utils/aws-s3");
const amplify_service_manager_1 = require("./amplify-service-manager");
const constants_1 = require("./constants");
const zip_util_1 = require("./zip-util");
const run = async (context, envName, deleteS3) => {
    var _a, _b, _c;
    const credentials = await (0, configuration_manager_1.loadConfigurationForEnv)(context, envName);
    const cfn = await new aws_cfn_1.default(context, null, credentials);
    const s3 = await aws_s3_1.S3.getInstance(context, credentials);
    let removeBucket = false;
    let deploymentBucketName;
    let storageCategoryBucketName;
    if (deleteS3) {
        deploymentBucketName = (_c = (_b = (_a = amplify_cli_core_1.stateManager.getTeamProviderInfo()) === null || _a === void 0 ? void 0 : _a[envName]) === null || _b === void 0 ? void 0 : _b[constants_1.ProviderName]) === null || _c === void 0 ? void 0 : _c.DeploymentBucketName;
        if (await s3.ifBucketExists(deploymentBucketName)) {
            const amplifyDir = context.amplify.pathManager.getAmplifyDirPath();
            const tempDir = path.join(amplifyDir, envName, '.temp');
            storageCategoryBucketName = await getStorageCategoryBucketNameFromCloud(context, envName, s3, tempDir);
            fs.removeSync(tempDir);
            if (storageCategoryBucketName) {
                await s3.emptyS3Bucket(storageCategoryBucketName);
            }
            removeBucket = true;
        }
        else {
            context.print.info(`Unable to remove env: ${envName} because deployment bucket ${deploymentBucketName} does not exist or has been deleted.`);
        }
    }
    await cfn.deleteResourceStack(envName);
    if (storageCategoryBucketName) {
        await s3.deleteS3Bucket(storageCategoryBucketName);
    }
    await (0, amplify_service_manager_1.deleteEnv)(context, envName);
    if (removeBucket && deploymentBucketName) {
        await s3.deleteS3Bucket(deploymentBucketName);
    }
};
exports.run = run;
const getStorageCategoryBucketNameFromCloud = async (context, envName, s3, tempDir) => {
    const sourceZipFile = await (0, zip_util_1.downloadZip)(s3, tempDir, constants_1.S3BackendZipFileName, envName);
    const unZippedDir = await (0, zip_util_1.extractZip)(tempDir, sourceZipFile);
    const amplifyMeta = context.amplify.readJsonFile(`${unZippedDir}/amplify-meta.json`);
    const storage = amplifyMeta.storage || {};
    const s3Storage = Object.keys(storage).filter((r) => storage[r].service === 'S3' && storage[r].serviceType !== 'imported');
    if (!s3Storage.length) {
        return undefined;
    }
    const fStorageName = s3Storage[0];
    return storage[fStorageName].output.BucketName;
};
//# sourceMappingURL=delete-env.js.map