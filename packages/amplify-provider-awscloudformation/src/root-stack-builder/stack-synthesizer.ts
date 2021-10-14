import { ISynthesisSession, Stack, LegacyStackSynthesizer } from '@aws-cdk/core';
import { Template } from 'amplify-cli-core';
import { AmplifyRootStack, AmplifyRootStackOutputs } from './root-stack-builder';

export class RootStackSythesizer extends LegacyStackSynthesizer {
  private stacks: Map<string, Stack> = new Map();
  private static readonly stackAssets: Map<string, Template> = new Map();

  protected synthesizeStackTemplate(stack: Stack, session: ISynthesisSession): void {
    if (stack instanceof AmplifyRootStack || stack instanceof AmplifyRootStackOutputs) {
      this.addStack(stack);
      const template = stack.renderCloudFormationTemplate(session) as string;
      const templateName = stack.node.id;
      this.setStackAsset(templateName, template);
    } else {
      throw new Error('Error synthesizing the template. Expected Stack to be either instance of AmplifyRootStack');
    }
  }

  setStackAsset(templateName: string, template: string): void {
    RootStackSythesizer.stackAssets.set(templateName, JSON.parse(template));
  }

  collectStacks(): Map<string, Template> {
    return new Map(RootStackSythesizer.stackAssets.entries());
  }

  addStack(stack: Stack) {
    this.stacks.set(stack.node.id, stack);
  }

  getStack = (stackName: string): Stack => {
    if (this.stacks.has(stackName)) {
      return this.stacks.get(stackName)!;
    }
    throw new Error(`Stack ${stackName} is not created`);
  };
}
