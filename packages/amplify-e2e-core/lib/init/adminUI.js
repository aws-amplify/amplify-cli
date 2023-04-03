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
Object.defineProperty(exports, "__esModule", { value: true });
exports.enableAdminUI = void 0;
// eslint-disable-next-line import/no-cycle
const utils_1 = require("../utils");
const sdk_calls_1 = require("../utils/sdk-calls");
/**
 * Kick off Amplify backend provisioning and poll until provisioning complete (or failed)
 */
const enableAdminUI = (appId, __envName, region) => __awaiter(void 0, void 0, void 0, function* () {
    const { JobId, BackendEnvironmentName } = yield (0, sdk_calls_1.setupAmplifyAdminUI)(appId, region);
    try {
        yield (0, utils_1.retry)(() => (0, sdk_calls_1.getAmplifyBackendJobStatus)(JobId, appId, BackendEnvironmentName, region), (jobDetails) => jobDetails.Status === 'COMPLETED', {
            timeoutMS: 1000 * 60 * 5,
            stopOnError: false,
        }, (jobDetails) => jobDetails.Status === 'FAILED');
    }
    catch (_a) {
        throw new Error('Setting up Amplify Studio failed');
    }
});
exports.enableAdminUI = enableAdminUI;
//# sourceMappingURL=adminUI.js.map