"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthStackSynthesizer = void 0;
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const aws_cdk_lib_1 = require("aws-cdk-lib");
const crypto_1 = __importDefault(require("crypto"));
const auth_cognito_stack_builder_1 = require("./auth-cognito-stack-builder");
const auth_user_pool_group_stack_builder_1 = require("./auth-user-pool-group-stack-builder");
class AuthStackSynthesizer extends aws_cdk_lib_1.LegacyStackSynthesizer {
    constructor() {
        super(...arguments);
        this.stacks = new Map();
        this.getStack = (stackName) => {
            if (this.stacks.has(stackName)) {
                return this.stacks.get(stackName);
            }
            throw new Error(`Stack ${stackName} is not created`);
        };
    }
    synthesizeStackTemplate(stack) {
        if (stack instanceof auth_cognito_stack_builder_1.AmplifyAuthCognitoStack ||
            stack instanceof auth_user_pool_group_stack_builder_1.AmplifyUserPoolGroupStack ||
            stack instanceof auth_user_pool_group_stack_builder_1.AmplifyUserPoolGroupStackOutputs) {
            this.addStack(stack);
            const template = stack.renderCloudFormationTemplate();
            const templateName = stack.node.id;
            this.setStackAsset(templateName, template);
        }
        else {
            throw new amplify_cli_core_1.AmplifyFault('UnknownFault', {
                message: 'Error synthesizing the template. Expected Stack to be either instance of AmplifyAuthCognitoStack or AmplifyUserPoolGroupStack',
            });
        }
    }
    synthesizeTemplate() {
        const stack = this.boundStack;
        if (stack instanceof auth_cognito_stack_builder_1.AmplifyAuthCognitoStack ||
            stack instanceof auth_user_pool_group_stack_builder_1.AmplifyUserPoolGroupStack ||
            stack instanceof auth_user_pool_group_stack_builder_1.AmplifyUserPoolGroupStackOutputs) {
            this.addStack(stack);
            const template = stack.renderCloudFormationTemplate();
            const templateName = stack.node.id;
            this.setStackAsset(templateName, template);
            const contentHash = crypto_1.default.createHash('sha256').update(template).digest('hex');
            return {
                sourceHash: contentHash,
            };
        }
        throw new amplify_cli_core_1.AmplifyFault('UnknownFault', {
            message: 'Error synthesizing the template. Expected Stack to be either instance of AmplifyAuthCognitoStack or AmplifyUserPoolGroupStack',
        });
    }
    setStackAsset(templateName, template) {
        AuthStackSynthesizer.stackAssets.set(templateName, amplify_cli_core_1.JSONUtilities.parse(template));
    }
    collectStacks() {
        return new Map(AuthStackSynthesizer.stackAssets.entries());
    }
    addStack(stack) {
        this.stacks.set(stack.node.id, stack);
    }
}
exports.AuthStackSynthesizer = AuthStackSynthesizer;
AuthStackSynthesizer.stackAssets = new Map();
//# sourceMappingURL=stack-synthesizer.js.map