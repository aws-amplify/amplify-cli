"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
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
exports.postPullCodegen = exports.constructInputParams = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const graphql_transformer_core_1 = require("graphql-transformer-core");
const path = __importStar(require("path"));
const lodash_1 = __importDefault(require("lodash"));
const input_params_manager_1 = require("./input-params-manager");
const constructInputParams = (context) => {
    const inputParams = (0, input_params_manager_1.normalizeInputParams)(context);
    if (inputParams.appId) {
        inputParams.amplify.appId = inputParams.appId;
        delete inputParams.appId;
    }
    if (inputParams.envName) {
        inputParams.amplify.envName = inputParams.envName;
        delete inputParams.envName;
    }
    if (inputParams['no-override'] !== undefined) {
        inputParams.amplify.noOverride = inputParams['no-override'];
        delete inputParams['no-override'];
    }
    return inputParams;
};
exports.constructInputParams = constructInputParams;
const postPullCodegen = async (context) => {
    var _a, _b, _c;
    if ((_b = (_a = context === null || context === void 0 ? void 0 : context.exeInfo) === null || _a === void 0 ? void 0 : _a.inputParams) === null || _b === void 0 ? void 0 : _b['no-codegen']) {
        return;
    }
    const meta = amplify_cli_core_1.stateManager.getCurrentMeta(undefined, { throwIfNotExist: false });
    const gqlApiName = (_c = lodash_1.default.entries(meta === null || meta === void 0 ? void 0 : meta.api).find(([, value]) => value.service === 'AppSync')) === null || _c === void 0 ? void 0 : _c[0];
    await context.amplify.invokePluginMethod(context, 'ui-builder', undefined, 'executeAmplifyCommand', [context, 'generateComponents']);
    if (!gqlApiName) {
        return;
    }
    if (await (0, graphql_transformer_core_1.isDataStoreEnabled)(path.join(amplify_cli_core_1.pathManager.getBackendDirPath(), 'api', gqlApiName))) {
        await context.amplify.invokePluginMethod(context, 'codegen', undefined, 'generateModels', [context]);
    }
};
exports.postPullCodegen = postPullCodegen;
//# sourceMappingURL=amplify-service-helper.js.map