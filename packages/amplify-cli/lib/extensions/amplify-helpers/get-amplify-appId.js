"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAmplifyAppId = void 0;
const get_project_meta_1 = require("./get-project-meta");
const getAmplifyAppId = () => {
    var _a, _b;
    const meta = (0, get_project_meta_1.getProjectMeta)();
    return (_b = (_a = meta === null || meta === void 0 ? void 0 : meta.providers) === null || _a === void 0 ? void 0 : _a.awscloudformation) === null || _b === void 0 ? void 0 : _b.AmplifyAppId;
};
exports.getAmplifyAppId = getAmplifyAppId;
//# sourceMappingURL=get-amplify-appId.js.map