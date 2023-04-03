"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleCloudFormationError = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const cloudformation_error_serializer_1 = require("./aws-utils/cloudformation-error-serializer");
const s3Indicator = '(AWS::S3::Bucket)';
const handleS3Error = (err) => {
    const deserializedErrorMessages = (0, cloudformation_error_serializer_1.deserializeErrorMessages)(err.details);
    const bucketNameRegex = /(S3Bucket|CustomMessageConfirmationBucket) \(AWS::S3::Bucket\)*/;
    const bucketReasonRegex = /.* already exists*/;
    const bucketExistsLines = deserializedErrorMessages.messages.filter((message) => bucketNameRegex.test(message.name) && bucketReasonRegex.test(message.reason));
    if (bucketExistsLines.length) {
        const messageWithError = bucketExistsLines[0];
        const bucketRegex = /(.*) already exists*/;
        const bucketName = messageWithError.reason.match(bucketRegex)[1];
        throw new amplify_cli_core_1.AmplifyError('ResourceAlreadyExistsError', {
            message: `The S3 bucket ${bucketName} already exists.`,
            resolution: `Please delete this bucket in the AWS S3 console and try again. The bucket can be found at: https://s3.console.aws.amazon.com/s3/buckets/${bucketName}.`,
        });
    }
};
const handleCloudFormationError = (err) => {
    var _a, _b;
    if ((err === null || err === void 0 ? void 0 : err.name) === 'ValidationError' && (err === null || err === void 0 ? void 0 : err.message) === 'No updates are to be performed.') {
        return;
    }
    if ((err === null || err === void 0 ? void 0 : err.name) === 'ValidationError' && ((_a = err === null || err === void 0 ? void 0 : err.message) !== null && _a !== void 0 ? _a : '').includes('_IN_PROGRESS state and can not be updated.')) {
        throw new amplify_cli_core_1.AmplifyError('DeploymentInProgressError', {
            message: 'Deployment is already in progress.',
            resolution: 'Wait for the other deployment to finish and try again.',
            code: err.code,
        }, err);
    }
    if ((_b = err === null || err === void 0 ? void 0 : err.details) === null || _b === void 0 ? void 0 : _b.includes(s3Indicator)) {
        handleS3Error(err);
    }
    throw err;
};
exports.handleCloudFormationError = handleCloudFormationError;
//# sourceMappingURL=cloud-formation-error-handler.js.map