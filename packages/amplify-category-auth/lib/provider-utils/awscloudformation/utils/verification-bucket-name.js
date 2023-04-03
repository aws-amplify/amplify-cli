"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verificationBucketName = void 0;
const verificationBucketName = async (current, previous) => {
    if (current.triggers && current.triggers.CustomMessage && current.triggers.CustomMessage.includes('verification-link')) {
        const name = previous ? previous.resourceName : current.resourceName;
        current.verificationBucketName = `${name.toLowerCase()}verificationbucket`;
    }
    else if (previous &&
        previous.triggers &&
        previous.triggers.CustomMessage &&
        previous.triggers.CustomMessage.includes('verification-link') &&
        previous.verificationBucketName &&
        (!current.triggers || !current.triggers.CustomMessage || !current.triggers.CustomMessage.includes('verification-link'))) {
        delete previous.verificationBucketName;
    }
};
exports.verificationBucketName = verificationBucketName;
//# sourceMappingURL=verification-bucket-name.js.map