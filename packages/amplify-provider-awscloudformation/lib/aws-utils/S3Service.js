"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.S3Service = exports.createS3Service = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const aws_sdk_1 = require("aws-sdk");
const configuration_manager_1 = require("../configuration-manager");
const createS3Service = async (context) => {
    const credentials = await tryGetCredentials(context);
    const s3 = new aws_sdk_1.S3({ ...credentials });
    return new S3Service(s3);
};
exports.createS3Service = createS3Service;
class S3Service {
    constructor(s3) {
        this.s3 = s3;
        this.cachedBucketList = [];
    }
    async listBuckets() {
        if (this.cachedBucketList.length === 0) {
            const response = await this.s3.listBuckets().promise();
            if (response.Buckets) {
                this.cachedBucketList.push(...response.Buckets);
            }
        }
        return this.cachedBucketList;
    }
    async checkIfBucketExists(bucketName, s3) {
        var _a;
        const s3Client = s3 !== null && s3 !== void 0 ? s3 : this.s3;
        try {
            const response = await s3Client.headBucket({ Bucket: bucketName }).promise();
            return Object.keys(response).length === 0;
        }
        catch (error) {
            if (error.region !== s3Client.config.region && error.code === 'BadRequest') {
                return this.checkIfBucketExists(bucketName, new aws_sdk_1.S3({ ...(_a = s3Client.config) === null || _a === void 0 ? void 0 : _a.credentials, region: error.region }));
            }
            return handleS3Error(error);
        }
    }
    async bucketExists(bucketName) {
        return this.checkIfBucketExists(bucketName);
    }
    async getBucketLocation(bucketName) {
        const response = await this.s3
            .getBucketLocation({
            Bucket: bucketName,
        })
            .promise();
        if (response.LocationConstraint === undefined || response.LocationConstraint === '' || response.LocationConstraint === null) {
            return 'us-east-1';
        }
        return response.LocationConstraint;
    }
}
exports.S3Service = S3Service;
const handleS3Error = (error) => {
    if (error.code === 'NotFound') {
        return false;
    }
    throw new amplify_cli_core_1.AmplifyFault('UnknownFault', {
        message: error.message,
    }, error);
};
const tryGetCredentials = async (context) => {
    try {
        return await (0, configuration_manager_1.loadConfiguration)(context);
    }
    catch (e) {
    }
    return {};
};
//# sourceMappingURL=S3Service.js.map