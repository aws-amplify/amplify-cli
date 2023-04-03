"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RootStackSynthesizer = void 0;
const aws_cdk_lib_1 = require("aws-cdk-lib");
const amplify_cli_core_1 = require("amplify-cli-core");
const crypto_1 = __importDefault(require("crypto"));
const root_stack_builder_1 = require("./root-stack-builder");
class RootStackSynthesizer extends aws_cdk_lib_1.LegacyStackSynthesizer {
    constructor() {
        super(...arguments);
        this.stacks = new Map();
        this.setStackAsset = (templateName, template) => {
            RootStackSynthesizer.stackAssets.set(templateName, amplify_cli_core_1.JSONUtilities.parse(template));
        };
        this.collectStacks = () => new Map(RootStackSynthesizer.stackAssets.entries());
        this.getStack = (stackName) => {
            if (this.stacks.has(stackName)) {
                return this.stacks.get(stackName);
            }
            throw new amplify_cli_core_1.AmplifyFault('UnknownFault', {
                message: `Stack ${stackName} is not created`,
            });
        };
    }
    synthesizeStackTemplate(stack) {
        if (stack instanceof root_stack_builder_1.AmplifyRootStack || stack instanceof root_stack_builder_1.AmplifyRootStackOutputs) {
            this.addStack(stack);
            const template = stack.renderCloudFormationTemplate();
            const templateName = stack.node.id;
            this.setStackAsset(templateName, template);
        }
        else {
            throw new amplify_cli_core_1.AmplifyFault('UnknownFault', {
                message: 'Error synthesizing the template. Expected Stack to be either instance of AmplifyRootStack',
            });
        }
    }
    synthesizeTemplate() {
        const stack = this.boundStack;
        if (stack instanceof root_stack_builder_1.AmplifyRootStack || stack instanceof root_stack_builder_1.AmplifyRootStackOutputs) {
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
            message: 'Error synthesizing the template. Expected Stack to be either instance of AmplifyRootStack',
        });
    }
    addStack(stack) {
        this.stacks.set(stack.node.id, stack);
    }
}
exports.RootStackSynthesizer = RootStackSynthesizer;
RootStackSynthesizer.stackAssets = new Map();
//# sourceMappingURL=stack-synthesizer.js.map