import { ISynthesisSession, Stack, LegacyStackSynthesizer } from '@aws-cdk/core';
import { Template } from 'cloudform-types';
import { AmplifyAuthCognitoStack } from './auth-cognito-stack-builder';
import { AmplifyUserPoolGroupStack, AmplifyUserPoolGroupStackOutputs } from './auth-user-pool-group-stack-builder';

export class AuthStackSythesizer extends LegacyStackSynthesizer {
  private readonly stacks: Map<string, Stack> = new Map();
  private static readonly stackAssets: Map<string, Template> = new Map();

  protected synthesizeStackTemplate(stack: Stack, session: ISynthesisSession): void {
    if (
      stack instanceof AmplifyAuthCognitoStack ||
      stack instanceof AmplifyUserPoolGroupStack ||
      stack instanceof AmplifyUserPoolGroupStackOutputs
    ) {
      this.addStack(stack);
      const template = stack.renderCloudFormationTemplate(session) as string;
      const templateName = stack.node.id;
      this.setStackAsset(templateName, template);
    } else {
      throw new Error(
        'Error synthesizing the template. Expected Stack to be either instance of AmplifyAuthCognitoStack or AmplifyUserPoolGroupStack',
      );
    }
  }

  setStackAsset(templateName: string, template: string): void {
    AuthStackSythesizer.stackAssets.set(templateName, JSON.parse(template));
  }

  collectStacks(): Map<string, Template> {
    return new Map(AuthStackSythesizer.stackAssets.entries());
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
