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
exports.getUpdateAuthDefaultsApplier = exports.getAddAuthDefaultsApplier = void 0;
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const lodash_1 = __importDefault(require("lodash"));
const constants_1 = require("../constants");
const auth_questions_1 = require("../service-walkthroughs/auth-questions");
const synthesize_resources_1 = require("./synthesize-resources");
const verification_bucket_name_1 = require("./verification-bucket-name");
const getAddAuthDefaultsApplier = (context, defaultValuesFilename, projectName) => async (result) => {
    var _a;
    const { functionMap, generalDefaults, roles, getAllDefaults } = await (_a = `../assets/${defaultValuesFilename}`, Promise.resolve().then(() => __importStar(require(_a))));
    result = assignDefaults({}, generalDefaults(projectName), result);
    await (0, verification_bucket_name_1.verificationBucketName)(result);
    (0, auth_questions_1.structureOAuthMetadata)(result, context, getAllDefaults, context.amplify);
    if (amplify_cli_core_1.FeatureFlags.getBoolean('auth.enableCaseInsensitivity')) {
        result.usernameCaseSensitive = false;
    }
    result.useEnabledMfas = amplify_cli_core_1.FeatureFlags.getBoolean('auth.useEnabledMfas');
    return assignDefaults({}, functionMap[result.authSelections](result.resourceName), result, roles);
};
exports.getAddAuthDefaultsApplier = getAddAuthDefaultsApplier;
const getUpdateAuthDefaultsApplier = (context, defaultValuesFilename, previousResult) => async (result) => {
    var _a;
    var _b;
    const { functionMap, getAllDefaults } = await (_a = `../assets/${defaultValuesFilename}`, Promise.resolve().then(() => __importStar(require(_a))));
    if (!result.authSelections) {
        result.authSelections = (_b = previousResult.authSelections) !== null && _b !== void 0 ? _b : 'identityPoolAndUserPool';
    }
    const defaults = functionMap[result.authSelections](previousResult.resourceName);
    constants_1.immutableAttributes
        .filter((pv) => pv in previousResult)
        .forEach((pv) => {
        delete result[pv];
    });
    if (['default', 'defaultSocial'].includes(result.useDefault)) {
        constants_1.safeDefaults.forEach((sd) => delete previousResult[sd]);
    }
    await (0, verification_bucket_name_1.verificationBucketName)(result, previousResult);
    (0, auth_questions_1.structureOAuthMetadata)(result, context, getAllDefaults, context.amplify);
    if (!lodash_1.default.isEmpty(result.triggers)) {
        previousResult.triggers = Object.assign({}, result.triggers);
    }
    return assignDefaults({}, defaults, (0, synthesize_resources_1.removeDeprecatedProps)(previousResult), result);
};
exports.getUpdateAuthDefaultsApplier = getUpdateAuthDefaultsApplier;
const assignDefaults = lodash_1.default.partialRight(lodash_1.default.assignWith, (objValue, srcValue) => lodash_1.default.isUndefined(srcValue) ? objValue : srcValue);
//# sourceMappingURL=auth-defaults-appliers.js.map