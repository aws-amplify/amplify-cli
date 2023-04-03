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
exports.loadLambdaConfig = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const lambda_1 = require("../../CFNParser/resource-processors/lambda");
const path = __importStar(require("path"));
const populate_cfn_params_1 = require("./populate-cfn-params");
const detect_port_1 = __importDefault(require("detect-port"));
const api_1 = require("../../api/api");
const populate_lambda_mock_env_vars_1 = require("./populate-lambda-mock-env-vars");
const CFN_DEFAULT_CONDITIONS = {
    ShouldNotCreateEnvResources: true,
};
const loadLambdaConfig = async (context, resourceName, overrideApiToLocal = false) => {
    overrideApiToLocal = overrideApiToLocal || (await isApiRunning());
    const resourcePath = path.join(amplify_cli_core_1.pathManager.getBackendDirPath(), 'function', resourceName);
    const { Resources: cfnResources } = amplify_cli_core_1.JSONUtilities.readJson(path.join(resourcePath, `${resourceName}-cloudformation-template.json`));
    const lambdaDef = Object.entries(cfnResources).find(([_, resourceDef]) => resourceDef.Type === 'AWS::Lambda::Function');
    if (!lambdaDef) {
        return undefined;
    }
    const cfnParams = (0, populate_cfn_params_1.populateCfnParams)(resourceName, overrideApiToLocal);
    const processedLambda = (0, lambda_1.lambdaFunctionHandler)(lambdaDef[0], lambdaDef[1], {
        conditions: CFN_DEFAULT_CONDITIONS,
        params: cfnParams,
        exports: {},
        resources: {},
    });
    await (0, populate_lambda_mock_env_vars_1.populateLambdaMockEnvVars)(context, processedLambda);
    return processedLambda;
};
exports.loadLambdaConfig = loadLambdaConfig;
const isApiRunning = async () => {
    const result = await (0, detect_port_1.default)(api_1.MOCK_API_PORT);
    return result !== api_1.MOCK_API_PORT;
};
//# sourceMappingURL=load-lambda-config.js.map