import { AmplifyFault, JSONUtilities } from '@aws-amplify/amplify-cli-core';
import { FileAssetSource, Stack, LegacyStackSynthesizer } from 'aws-cdk-lib';
import { Template } from 'cloudform-types';
import crypto from 'crypto';
import { AmplifyAuthCognitoStack } from './auth-cognito-stack-builder';
import { AmplifyUserPoolGroupStack, AmplifyUserPoolGroupStackOutputs } from './auth-user-pool-group-stack-builder';

/**
 * Amplify Stack Synthesizer for Auth Category
 */
export class AuthStackSynthesizer extends LegacyStackSynthesizer {
  private readonly stacks: Map<string, Stack> = new Map();
  private static readonly stackAssets: Map<string, Template> = new Map();

  /**
   * This method has been deprecated by cdk and is not used in runtime.
   * @deprecated Replaced by synthesizeTemplate.
   */
  protected synthesizeStackTemplate(stack: Stack): void {
    if (
      stack instanceof AmplifyAuthCognitoStack ||
      stack instanceof AmplifyUserPoolGroupStack ||
      stack instanceof AmplifyUserPoolGroupStackOutputs
    ) {
      this.addStack(stack);
      const template = stack.renderCloudFormationTemplate() as string;
      const templateName = stack.node.id;
      this.setStackAsset(templateName, template);
    } else {
      throw new AmplifyFault('UnknownFault', {
        message:
          'Error synthesizing the template. Expected Stack to be either instance of AmplifyAuthCognitoStack or AmplifyUserPoolGroupStack',
      });
    }
  }

  protected synthesizeTemplate(): FileAssetSource {
    const stack = this.boundStack;
    if (
      stack instanceof AmplifyAuthCognitoStack ||
      stack instanceof AmplifyUserPoolGroupStack ||
      stack instanceof AmplifyUserPoolGroupStackOutputs
    ) {
      this.addStack(stack);
      const template = stack.renderCloudFormationTemplate() as string;
      const templateName = stack.node.id;
      this.setStackAsset(templateName, template);
      const contentHash = crypto.createHash('sha256').update(template).digest('hex');
      return {
        sourceHash: contentHash,
      };
    }
    throw new AmplifyFault('UnknownFault', {
      message:
        'Error synthesizing the template. Expected Stack to be either instance of AmplifyAuthCognitoStack or AmplifyUserPoolGroupStack',
    });
  }

  /**
   * Set the Stack Value in memory
   */
  // eslint-disable-next-line class-methods-use-this
  setStackAsset(templateName: string, template: string): void {
    AuthStackSynthesizer.stackAssets.set(templateName, JSONUtilities.parse(template));
  }

  /**
   *  return all stacks
   */
  // eslint-disable-next-line class-methods-use-this
  collectStacks(): Map<string, Template> {
    return new Map(AuthStackSynthesizer.stackAssets.entries());
  }

  /**
   * add stack to memory
   */
  addStack(stack: Stack): void {
    this.stacks.set(stack.node.id, stack);
  }

  getStack = (stackName: string): Stack => {
    if (this.stacks.has(stackName)) {
      return this.stacks.get(stackName)!;
    }
    throw new Error(`Stack ${stackName} is not created`);
  };
}
