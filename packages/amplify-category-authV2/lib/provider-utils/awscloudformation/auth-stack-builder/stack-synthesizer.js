'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.AuthStackSythesizer = void 0;
const core_1 = require('@aws-cdk/core');
const auth_cognito_stack_builder_1 = require('./auth-cognito-stack-builder');
class AuthStackSythesizer extends core_1.LegacyStackSynthesizer {
  constructor() {
    super(...arguments);
    this.stacks = new Map();
    this.getStack = stackName => {
      if (this.stacks.has(stackName)) {
        return this.stacks.get(stackName);
      }
      throw new Error(`Stack ${stackName} is not created`);
    };
  }
  synthesizeStackTemplate(stack, session) {
    if (stack instanceof auth_cognito_stack_builder_1.AmplifyAuthCognitoStack) {
      this.addStack(stack);
      const template = stack.renderCloudFormationTemplate(session);
      const templateName = stack.node.id;
      this.setStackAsset(templateName, template);
    } else {
      throw new Error('Error synthesizing the template. Expected Stack to be either instance of AmplifyRootStack');
    }
  }
  setStackAsset(templateName, template) {
    AuthStackSythesizer.stackAssets.set(templateName, JSON.parse(template));
  }
  collectStacks() {
    return new Map(AuthStackSythesizer.stackAssets.entries());
  }
  addStack(stack) {
    this.stacks.set(stack.node.id, stack);
  }
}
exports.AuthStackSythesizer = AuthStackSythesizer;
AuthStackSythesizer.stackAssets = new Map();
//# sourceMappingURL=stack-synthesizer.js.map
