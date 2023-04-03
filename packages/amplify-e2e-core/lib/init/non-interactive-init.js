"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAwsProviderGeneralConfig = exports.getAwsProviderConfig = exports.getAmplifyInitConfig = exports.nonInteractiveInitWithForcePushAttach = exports.nonInteractiveInitAttach = void 0;
const execa_1 = __importDefault(require("execa"));
// eslint-disable-next-line import/no-cycle
const __1 = require("..");
/**
 * Executes a non-interactive init to attach a local project to an existing cloud environment
 */
const nonInteractiveInitAttach = (projRoot, amplifyInitConfig, awsProviderConfig, categoriesConfig) => __awaiter(void 0, void 0, void 0, function* () {
    const args = [
        'init',
        '--yes',
        '--amplify',
        JSON.stringify(amplifyInitConfig),
        '--providers',
        JSON.stringify({
            awscloudformation: awsProviderConfig,
        }),
    ];
    if (categoriesConfig) {
        args.push('--categories', JSON.stringify(categoriesConfig));
    }
    yield (0, execa_1.default)((0, __1.getCLIPath)(), args, { cwd: projRoot });
});
exports.nonInteractiveInitAttach = nonInteractiveInitAttach;
/**
 * Executes a non-interactive init to migrate a local project to an existing cloud environment with forcePush flag
 */
const nonInteractiveInitWithForcePushAttach = (projRoot, amplifyInitConfig, categoriesConfig, testingWithLatestCodebase = false, awsProviderConfig = (0, exports.getAwsProviderConfig)(), rejectOnFailure = true) => __awaiter(void 0, void 0, void 0, function* () {
    const args = [
        'init',
        '--yes',
        '--amplify',
        JSON.stringify(amplifyInitConfig),
        '--providers',
        JSON.stringify({
            awscloudformation: awsProviderConfig,
        }),
        '--forcePush',
        '--debug',
    ];
    if (categoriesConfig) {
        args.push('--categories', JSON.stringify(categoriesConfig));
    }
    return (0, execa_1.default)((0, __1.getCLIPath)(testingWithLatestCodebase), args, { cwd: projRoot, reject: rejectOnFailure });
});
exports.nonInteractiveInitWithForcePushAttach = nonInteractiveInitWithForcePushAttach;
/**
 * Returns an AmplifyConfig object with a default editor
 */
const getAmplifyInitConfig = (projectName, envName) => ({
    projectName,
    envName,
    defaultEditor: 'code',
});
exports.getAmplifyInitConfig = getAmplifyInitConfig;
/**
 * Returns a default AwsProviderConfig
 */
const getAwsProviderConfig = (profileType) => {
    if (profileType === 'general') {
        return (0, exports.getAwsProviderGeneralConfig)();
    }
    else {
        return {
            configLevel: 'project',
            useProfile: true,
            profileName: __1.TEST_PROFILE_NAME,
        };
    }
};
exports.getAwsProviderConfig = getAwsProviderConfig;
/**
 * Returns a general AwsProviderConfig
 */
const getAwsProviderGeneralConfig = () => ({
    configLevel: 'general',
});
exports.getAwsProviderGeneralConfig = getAwsProviderGeneralConfig;
//# sourceMappingURL=non-interactive-init.js.map