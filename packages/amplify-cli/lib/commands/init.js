"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = void 0;
const amplify_service_helper_1 = require("../amplify-service-helper");
const execution_manager_1 = require("../execution-manager");
const postInitSetup_1 = require("../init-steps/postInitSetup");
const preInitSetup_1 = require("../init-steps/preInitSetup");
const s0_analyzeProject_1 = require("../init-steps/s0-analyzeProject");
const s1_initFrontend_1 = require("../init-steps/s1-initFrontend");
const s2_initProviders_1 = require("../init-steps/s2-initProviders");
const s8_scaffoldHeadless_1 = require("../init-steps/s8-scaffoldHeadless");
const s9_onSuccess_1 = require("../init-steps/s9-onSuccess");
const verify_expected_env_params_1 = require("../utils/verify-expected-env-params");
const projectUtils_1 = require("./helpers/projectUtils");
const constructExeInfo = (context) => {
    context.exeInfo = {
        inputParams: (0, amplify_service_helper_1.constructInputParams)(context),
        localEnvInfo: {},
    };
};
const runStrategy = (quickstart) => quickstart
    ? [preInitSetup_1.preInitSetup, s0_analyzeProject_1.analyzeProjectHeadless, s8_scaffoldHeadless_1.scaffoldProjectHeadless, s9_onSuccess_1.onHeadlessSuccess]
    : [preInitSetup_1.preInitSetup, s0_analyzeProject_1.analyzeProject, s1_initFrontend_1.initFrontend, s2_initProviders_1.initProviders, s9_onSuccess_1.onSuccess, postInitSetup_1.postInitSetup];
const run = async (context) => {
    var _a, _b, _c, _d;
    constructExeInfo(context);
    (0, projectUtils_1.checkForNestedProject)();
    if (((_b = (_a = context === null || context === void 0 ? void 0 : context.input) === null || _a === void 0 ? void 0 : _a.options) === null || _b === void 0 ? void 0 : _b.forcePush) === true) {
        await (0, verify_expected_env_params_1.verifyExpectedEnvParams)(context);
        await (0, execution_manager_1.raisePrePushEvent)(context);
    }
    const steps = runStrategy(!!((_d = (_c = context === null || context === void 0 ? void 0 : context.parameters) === null || _c === void 0 ? void 0 : _c.options) === null || _d === void 0 ? void 0 : _d.quickstart));
    for (const step of steps) {
        await step(context);
    }
    if (context.exeInfo.sourceEnvName && context.exeInfo.localEnvInfo.envName) {
        await (0, execution_manager_1.raisePostEnvAddEvent)(context, context.exeInfo.sourceEnvName, context.exeInfo.localEnvInfo.envName);
    }
};
exports.run = run;
//# sourceMappingURL=init.js.map