"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.S3 = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const lodash_1 = __importDefault(require("lodash"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const ora_1 = __importDefault(require("ora"));
const paged_call_1 = require("./paged-call");
const configuration_manager_1 = require("../configuration-manager");
const aws_1 = __importDefault(require("./aws"));
const providerName = require('../constants').ProviderName;
const minChunkSize = 5 * 1024 * 1024;
const { fileLogger } = require('../utils/aws-logger');
const logger = fileLogger('aws-s3');
class S3 {
    static async getInstance(context, options = {}) {
        if (!S3.instance) {
            let cred = {};
            try {
                cred = await (0, configuration_manager_1.loadConfiguration)(context);
            }
            catch (e) {
            }
            S3.instance = new S3(context, cred, options);
        }
        return S3.instance;
    }
    constructor(context, cred, options = {}) {
        this.getStringObjectFromBucket = async (bucketName, objectKey) => {
            try {
                const result = await this.s3
                    .getObject({
                    Bucket: bucketName,
                    Key: objectKey,
                })
                    .promise();
                return result.Body.toString();
            }
            catch (e) {
                if (e.statusCode === 404) {
                    return undefined;
                }
                throw new amplify_cli_core_1.AmplifyFault('UnexpectedS3Fault', {
                    message: e.message,
                }, e);
            }
        };
        this.context = context;
        this.s3 = new aws_1.default.S3({ ...cred, ...options });
    }
    populateUploadState() {
        var _a, _b;
        const amplifyMeta = amplify_cli_core_1.stateManager.getMeta();
        const teamProviderInfo = amplify_cli_core_1.stateManager.getTeamProviderInfo();
        const { envName } = amplify_cli_core_1.stateManager.getLocalEnvInfo();
        const projectBucket = amplifyMeta.providers
            ? amplifyMeta.providers[providerName].DeploymentBucketName
            : (_b = (_a = teamProviderInfo === null || teamProviderInfo === void 0 ? void 0 : teamProviderInfo[envName]) === null || _a === void 0 ? void 0 : _a[providerName]) === null || _b === void 0 ? void 0 : _b.DeploymentBucketName;
        this.uploadState = {
            envName,
            s3Params: {
                Bucket: projectBucket,
            },
        };
    }
    attachBucketToParams(s3Params, envName) {
        if (!s3Params.hasOwnProperty('Bucket')) {
            if (!envName)
                envName = this.context.amplify.getEnvInfo().envName;
            const teamProviderInfo = amplify_cli_core_1.stateManager.getTeamProviderInfo();
            const projectBucket = teamProviderInfo[envName][providerName].DeploymentBucketName;
            s3Params.Bucket = projectBucket;
        }
        return s3Params;
    }
    async uploadFile(s3Params, showSpinner = true) {
        if (this.uploadState === undefined) {
            this.populateUploadState();
        }
        const spinner = showSpinner ? (0, ora_1.default)('Uploading files.') : undefined;
        const augmentedS3Params = {
            ...s3Params,
            ...this.uploadState.s3Params,
        };
        const { _Body, ...others } = augmentedS3Params;
        let uploadTask;
        try {
            showSpinner && spinner.start('Uploading files.');
            if ((s3Params.Body instanceof fs_extra_1.default.ReadStream && fs_extra_1.default.statSync(s3Params.Body.path).size > minChunkSize) ||
                (Buffer.isBuffer(s3Params.Body) && s3Params.Body.length > minChunkSize)) {
                logger('uploadFile.s3.upload', [others])();
                uploadTask = this.s3.upload(augmentedS3Params);
                uploadTask.on('httpUploadProgress', (max) => {
                    if (showSpinner)
                        spinner.text = `Uploading files...${Math.round((max.loaded / max.total) * 100)}%`;
                });
            }
            else {
                logger('uploadFile.s3.putObject', [others])();
                uploadTask = this.s3.putObject(augmentedS3Params);
            }
            await uploadTask.promise();
            return this.uploadState.s3Params.Bucket;
        }
        finally {
            showSpinner && spinner.stop();
        }
    }
    async getFile(s3Params, envName) {
        s3Params = this.attachBucketToParams(s3Params, envName);
        logger('s3.getFile', [s3Params])();
        const result = await this.s3.getObject(s3Params).promise();
        return result.Body;
    }
    async createBucket(bucketName, throwIfExists = false) {
        const params = {
            Bucket: bucketName,
        };
        logger('createBucket.ifBucketExists', [bucketName])();
        if (!(await this.ifBucketExists(bucketName))) {
            this.context.print.warning('The specified S3 bucket to store the CloudFormation templates is not present. We are creating one for you....');
            this.context.print.warning(`Bucket name: ${bucketName}`);
            logger('createBucket.s3.createBucket', [params])();
            await this.s3.createBucket(params).promise();
            logger('createBucket.s3.waitFor', ['bucketExists', params])();
            await this.s3.waitFor('bucketExists', params).promise();
            this.context.print.success('S3 bucket successfully created');
        }
        else if (throwIfExists) {
            throw new amplify_cli_core_1.AmplifyError('BucketAlreadyExistsError', {
                message: `Bucket ${bucketName} already exists`,
            });
        }
        return bucketName;
    }
    async getAllObjectVersions(bucketName, options = null) {
        const result = await (0, paged_call_1.pagedAWSCall)(async (param, nextToken) => {
            const parmaWithNextToken = nextToken ? { ...param, ...nextToken } : param;
            logger('getAllObjectKey.s3.listObjectVersions', [parmaWithNextToken])();
            const objVersionList = await this.s3.listObjectVersions(parmaWithNextToken).promise();
            return objVersionList;
        }, {
            Bucket: bucketName,
            ...options,
        }, (response) => { var _a; return (_a = response.Versions) === null || _a === void 0 ? void 0 : _a.map(({ Key, VersionId }) => ({ Key, VersionId })); }, async (response) => (response === null || response === void 0 ? void 0 : response.IsTruncated)
            ? { KeyMarker: response.NextKeyMarker, VersionIdMarker: response.NextVersionIdMarker, Prefix: response.Prefix }
            : undefined);
        return result;
    }
    async deleteDirectory(bucketName, dirPath) {
        logger('deleteDirectory.s3.getAllObjectVersions', [{ BucketName: bucketName }])();
        const allObjects = await this.getAllObjectVersions(bucketName, { Prefix: dirPath });
        const chunkedResult = lodash_1.default.chunk(allObjects, 1000);
        const chunkedResultLength = chunkedResult.length;
        for (let idx = 0; idx < chunkedResultLength; idx += 1) {
            logger(`deleteAllObjects.s3.deleteObjects (${idx} of ${chunkedResultLength})`, [{ Bucket: bucketName }])();
            await this.s3
                .deleteObjects({
                Bucket: bucketName,
                Delete: {
                    Objects: chunkedResult[idx],
                },
            })
                .promise();
        }
    }
    async checkExistObject(bucketName, filePath) {
        logger('checkExistObject.s3', [{ BucketName: bucketName, FilePath: filePath }])();
        try {
            await this.s3
                .headObject({
                Bucket: bucketName,
                Key: filePath,
            })
                .promise();
            return true;
        }
        catch (error) {
            logger('checkExistObject.s3', [{ BucketName: bucketName, FilePath: filePath, Error: error.name }])();
            return false;
        }
    }
    async deleteObject(bucketName, filePath) {
        logger('deleteObject.s3', [{ BucketName: bucketName, FilePath: filePath }])();
        const objExists = await this.checkExistObject(bucketName, filePath);
        if (objExists) {
            await this.s3
                .deleteObject({
                Bucket: bucketName,
                Key: filePath,
            })
                .promise();
        }
    }
    async deleteAllObjects(bucketName) {
        logger('deleteAllObjects.s3.getAllObjectVersions', [{ BucketName: bucketName }])();
        const allObjects = await this.getAllObjectVersions(bucketName);
        const chunkedResult = lodash_1.default.chunk(allObjects, 1000);
        const chunkedResultLength = chunkedResult.length;
        for (let idx = 0; idx < chunkedResultLength; idx += 1) {
            logger(`deleteAllObjects.s3.deleteObjects (${idx} of ${chunkedResultLength})`, [{ Bucket: bucketName }])();
            await this.s3
                .deleteObjects({
                Bucket: bucketName,
                Delete: {
                    Objects: chunkedResult[idx],
                },
            })
                .promise();
        }
    }
    async deleteS3Bucket(bucketName) {
        logger('deleteS3Bucket.s3.ifBucketExists', [{ BucketName: bucketName }])();
        if (await this.ifBucketExists(bucketName)) {
            logger('deleteS3Bucket.s3.deleteAllObjects', [{ BucketName: bucketName }])();
            await this.deleteAllObjects(bucketName);
            logger('deleteS3Bucket.s3.deleteBucket', [{ BucketName: bucketName }])();
            await this.s3.deleteBucket({ Bucket: bucketName }).promise();
        }
    }
    async emptyS3Bucket(bucketName) {
        if (await this.ifBucketExists(bucketName)) {
            await this.deleteAllObjects(bucketName);
        }
    }
    async ifBucketExists(bucketName) {
        try {
            logger('ifBucketExists.s3.headBucket', [{ BucketName: bucketName }])();
            await this.s3
                .headBucket({
                Bucket: bucketName,
            })
                .promise();
            return true;
        }
        catch (e) {
            logger('ifBucketExists.s3.headBucket', [{ BucketName: bucketName }])(e);
            if (e.code === 'NotFound') {
                throw new amplify_cli_core_1.AmplifyError('BucketNotFoundError', {
                    message: e.message,
                    resolution: `Check that bucket name is correct: ${bucketName}`,
                }, e);
            }
            throw new amplify_cli_core_1.AmplifyFault('UnknownFault', {
                message: e.message,
            }, e);
        }
    }
}
exports.S3 = S3;
//# sourceMappingURL=aws-s3.js.map