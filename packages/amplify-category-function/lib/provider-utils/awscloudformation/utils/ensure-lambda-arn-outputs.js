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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureLambdaExecutionRoleOutputs = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const path = __importStar(require("path"));
const ensureLambdaExecutionRoleOutputs = async () => {
    var _a, _b;
    const backendConfig = amplify_cli_core_1.stateManager.getBackendConfig();
    const functionNames = Object.keys((_a = backendConfig === null || backendConfig === void 0 ? void 0 : backendConfig[amplify_cli_core_1.AmplifyCategories.FUNCTION]) !== null && _a !== void 0 ? _a : []);
    const lambdaFunctionNames = functionNames.filter((functionName) => {
        var _a;
        const functionObj = (_a = backendConfig === null || backendConfig === void 0 ? void 0 : backendConfig[amplify_cli_core_1.AmplifyCategories.FUNCTION]) === null || _a === void 0 ? void 0 : _a[functionName];
        return functionObj.service === amplify_cli_core_1.AmplifySupportedService.LAMBDA;
    });
    for (const functionName of lambdaFunctionNames) {
        const templateSourceFilePath = path.join(amplify_cli_core_1.pathManager.getBackendDirPath(), amplify_cli_core_1.AmplifyCategories.FUNCTION, functionName, `${functionName}-cloudformation-template.json`);
        const { cfnTemplate } = (0, amplify_cli_core_1.readCFNTemplate)(templateSourceFilePath);
        if (cfnTemplate.Outputs !== undefined && !((_b = cfnTemplate === null || cfnTemplate === void 0 ? void 0 : cfnTemplate.Outputs) === null || _b === void 0 ? void 0 : _b.LambdaExecutionRoleArn)) {
            cfnTemplate.Outputs.LambdaExecutionRoleArn = {
                Value: {
                    'Fn::GetAtt': ['LambdaExecutionRole', 'Arn'],
                },
            };
            await (0, amplify_cli_core_1.writeCFNTemplate)(cfnTemplate, templateSourceFilePath);
        }
    }
};
exports.ensureLambdaExecutionRoleOutputs = ensureLambdaExecutionRoleOutputs;
//# sourceMappingURL=ensure-lambda-arn-outputs.js.map