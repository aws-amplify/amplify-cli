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
exports.supportedServices = void 0;
const lambda_walkthrough_1 = require("./awscloudformation/service-walkthroughs/lambda-walkthrough");
const lambdaLayerWalkthrough_1 = require("./awscloudformation/service-walkthroughs/lambdaLayerWalkthrough");
const lambdaController = __importStar(require("./awscloudformation"));
const cloudformationHelpers_1 = require("./awscloudformation/utils/cloudformationHelpers");
const execPermissionsWalkthrough_1 = require("./awscloudformation/service-walkthroughs/execPermissionsWalkthrough");
exports.supportedServices = {
    Lambda: {
        alias: 'Lambda function (serverless function)',
        walkthroughs: {
            createWalkthrough: lambda_walkthrough_1.createWalkthrough,
            updateWalkthrough: lambda_walkthrough_1.updateWalkthrough,
            migrate: lambda_walkthrough_1.migrate,
            getIAMPolicies: cloudformationHelpers_1.getIAMPolicies,
            askExecRolePermissionsQuestions: execPermissionsWalkthrough_1.askExecRolePermissionsQuestions,
        },
        cfnFilename: `${__dirname}/../../resources/awscloudformation/cloudformation-templates/lambda-function-cloudformation-template.json.ejs`,
        provider: 'awscloudformation',
        providerController: lambdaController,
    },
    LambdaLayer: {
        alias: 'Lambda layer (shared code & resource used across functions)',
        walkthroughs: {
            createWalkthrough: lambdaLayerWalkthrough_1.createLayerWalkthrough,
            updateWalkthrough: lambdaLayerWalkthrough_1.updateLayerWalkthrough,
        },
        provider: 'awscloudformation',
        providerController: lambdaController,
    },
};
//# sourceMappingURL=supported-services.js.map