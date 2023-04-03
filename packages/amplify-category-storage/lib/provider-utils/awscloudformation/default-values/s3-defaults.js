"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllDefaults = void 0;
const uuid_1 = require("uuid");
const s3_user_input_types_1 = require("../service-walkthrough-types/s3-user-input-types");
const getAllDefaults = (project, shortId) => {
    const name = project.projectConfig.projectName.toLowerCase();
    const defaults = {
        resourceName: `s3${shortId}`,
        policyUUID: shortId,
        bucketName: `${name}${(0, uuid_1.v4)().replace(/-/g, '')}`.substr(0, 47),
        storageAccess: s3_user_input_types_1.S3AccessType.AUTH_ONLY,
        guestAccess: [],
        authAccess: [],
        triggerFunction: undefined,
        groupAccess: {},
    };
    return defaults;
};
exports.getAllDefaults = getAllDefaults;
//# sourceMappingURL=s3-defaults.js.map