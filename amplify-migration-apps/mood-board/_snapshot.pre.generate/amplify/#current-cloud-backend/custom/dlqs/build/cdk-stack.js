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
exports.cdkStack = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const AmplifyHelpers = __importStar(require("@aws-amplify/cli-extensibility-helper"));
const sqs = __importStar(require("aws-cdk-lib/aws-sqs"));
const iam = __importStar(require("aws-cdk-lib/aws-iam"));
class cdkStack extends cdk.Stack {
    constructor(scope, id, props, amplifyResourceProps) {
        super(scope, id, props);
        /* Do not remove - Amplify CLI automatically injects the current deployment environment in this input parameter */
        new cdk.CfnParameter(this, 'env', {
            type: 'String',
            description: 'Current Amplify CLI env name',
        });
        const deps = AmplifyHelpers.addResourceDependency(this, amplifyResourceProps.category, amplifyResourceProps.resourceName, [
            { category: 'function', resourceName: 'moodboardKinesisTrigger' },
            { category: 'function', resourceName: 'moodboardKinesisReader' },
        ]);
        const readerDlq = new sqs.Queue(this, 'ReaderDQL');
        const triggerDlq = new sqs.Queue(this, 'TriggerDLQ');
        readerDlq.addToResourcePolicy(new iam.PolicyStatement({
            actions: ['sqs:*'],
            resources: [readerDlq.queueArn],
            principals: [iam.Role.fromRoleArn(this, "ReaderRoleArn", cdk.Fn.ref(deps.function.moodboardKinesisReader.LambdaExecutionRoleArn))],
        }));
        triggerDlq.addToResourcePolicy(new iam.PolicyStatement({
            actions: ['sqs:*'],
            resources: [triggerDlq.queueArn],
            principals: [iam.Role.fromRoleArn(this, "TriggerRoleArn", cdk.Fn.ref(deps.function.moodboardKinesisTrigger.LambdaExecutionRoleArn))],
        }));
    }
}
exports.cdkStack = cdkStack;
