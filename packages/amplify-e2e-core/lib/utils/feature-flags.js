"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addFeatureFlag = exports.saveFeatureFlagFile = exports.loadFeatureFlags = void 0;
const lodash_1 = __importDefault(require("lodash"));
const amplify_cli_core_1 = require("amplify-cli-core");
const getFeatureFlagFilePath = (projectRoot) => {
    return amplify_cli_core_1.pathManager.getCLIJSONFilePath(projectRoot);
};
const loadFeatureFlags = (projectRoot) => {
    var _a;
    const ffPath = getFeatureFlagFilePath(projectRoot);
    return ((_a = amplify_cli_core_1.JSONUtilities.readJson(ffPath, { throwIfNotExist: false, preserveComments: true })) !== null && _a !== void 0 ? _a : {
        features: {},
    });
};
exports.loadFeatureFlags = loadFeatureFlags;
const saveFeatureFlagFile = (projectRoot, data) => {
    const ffPath = getFeatureFlagFilePath(projectRoot);
    amplify_cli_core_1.JSONUtilities.writeJson(ffPath, data);
};
exports.saveFeatureFlagFile = saveFeatureFlagFile;
/**
 * Set an feature flag
 * @param section Feature flag section
 * @param name feature flag name
 * @param value value for the feature flag
 */
const addFeatureFlag = (projectRoot, section, name, value) => {
    const ff = (0, exports.loadFeatureFlags)(projectRoot);
    const nameLowerCase = name.toLowerCase();
    if (lodash_1.default.get(ff, ['features', section, nameLowerCase])) {
        lodash_1.default.setWith(ff, ['features', section, nameLowerCase], value);
    }
    else {
        lodash_1.default.setWith(ff, ['features', section, name], value);
    }
    (0, exports.saveFeatureFlagFile)(projectRoot, ff);
};
exports.addFeatureFlag = addFeatureFlag;
//# sourceMappingURL=feature-flags.js.map