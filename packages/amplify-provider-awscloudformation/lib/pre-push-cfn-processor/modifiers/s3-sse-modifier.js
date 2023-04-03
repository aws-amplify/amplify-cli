"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyS3SSEModification = void 0;
const bucket_1 = require("cloudform-types/types/s3/bucket");
const applyS3SSEModification = async (resource) => {
    var _a;
    if ((_a = resource === null || resource === void 0 ? void 0 : resource.Properties) === null || _a === void 0 ? void 0 : _a.BucketEncryption) {
        return resource;
    }
    if (!resource.Properties || typeof resource.Properties !== 'object') {
        resource.Properties = {};
    }
    resource.Properties.BucketEncryption = new bucket_1.BucketEncryption({
        ServerSideEncryptionConfiguration: [
            new bucket_1.ServerSideEncryptionRule({
                ServerSideEncryptionByDefault: new bucket_1.ServerSideEncryptionByDefault({
                    SSEAlgorithm: 'AES256',
                }),
            }),
        ],
    });
    return resource;
};
exports.applyS3SSEModification = applyS3SSEModification;
//# sourceMappingURL=s3-sse-modifier.js.map