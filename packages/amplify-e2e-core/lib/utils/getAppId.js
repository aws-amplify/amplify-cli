"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAppId = void 0;
const projectMeta_1 = require("./projectMeta");
/**
 * fetches appId from amplify meta
 */
const getAppId = (projRoot) => {
    const meta = (0, projectMeta_1.getBackendAmplifyMeta)(projRoot);
    return meta.providers.awscloudformation.AmplifyAppId;
};
exports.getAppId = getAppId;
//# sourceMappingURL=getAppId.js.map