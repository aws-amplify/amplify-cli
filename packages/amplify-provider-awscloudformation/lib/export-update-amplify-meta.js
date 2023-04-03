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
exports.run = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const _ = __importStar(require("lodash"));
const aws_cfn_1 = __importDefault(require("./aws-utils/aws-cfn"));
const run = async (context, stackName) => {
    const cfn = await new aws_cfn_1.default(context);
    let rootStack = null;
    let nextToken = null;
    let continueListing = false;
    do {
        const stacks = await cfn.listStacks(nextToken, []);
        rootStack = _.find(stacks.StackSummaries, (summary) => summary.StackName === stackName);
        if (rootStack) {
            continueListing = false;
            continue;
        }
        if (!stacks.NextToken) {
            continueListing = false;
            continue;
        }
        if (stacks.NextToken) {
            nextToken = stacks.NextToken;
            continueListing = true;
            continue;
        }
    } while (continueListing);
    if (!rootStack) {
        throw new amplify_cli_core_1.AmplifyError('StackNotFoundError', {
            message: `${stackName} could not be found.`,
            resolution: 'Please check the stack name and credentials.',
        });
    }
    if (rootStack.StackStatus !== 'UPDATE_COMPLETE' && rootStack.StackStatus !== 'CREATE_COMPLETE') {
        throw new amplify_cli_core_1.AmplifyError('StackNotFoundError', {
            message: `${stackName} not in UPDATE_COMPLETE or CREATE_COMPLETE state`,
        });
    }
    await cfn.updateamplifyMetaFileWithStackOutputs(stackName);
};
exports.run = run;
//# sourceMappingURL=export-update-amplify-meta.js.map