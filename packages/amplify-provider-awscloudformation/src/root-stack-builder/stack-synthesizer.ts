import {
  FileAssetSource,
  ISynthesisSession,
  LegacyStackSynthesizer,
  Stack,
} from 'aws-cdk-lib';
import { AmplifyFault, JSONUtilities, Template } from 'amplify-cli-core';
import crypto from 'crypto';
import { AmplifyRootStack, AmplifyRootStackOutputs } from './root-stack-builder';

/**
 * RootStackSynthesizer class
 */
export class RootStackSynthesizer extends LegacyStackSynthesizer {
  private stacks: Map<string, Stack> = new Map();
  private static readonly stackAssets: Map<string, Template> = new Map();

  /**
   * This method has been deprecated by cdk and is not used in runtime.
   * @deprecated Replaced by synthesizeTemplate.
   */
  protected synthesizeStackTemplate(stack: Stack, session: ISynthesisSession): void {
    if (stack instanceof AmplifyRootStack || stack instanceof AmplifyRootStackOutputs) {
      this.addStack(stack);
      const template = stack.renderCloudFormationTemplate(session) as string;
      const templateName = stack.node.id;
      this.setStackAsset(templateName, template);
    } else {
      throw new AmplifyFault('UnknownFault', {
        message: 'Error synthesizing the template. Expected Stack to be either instance of AmplifyRootStack',
      });
    }
  }

  protected synthesizeTemplate(session: ISynthesisSession): FileAssetSource {
    const stack = this.boundStack;
    if (stack instanceof AmplifyRootStack || stack instanceof AmplifyRootStackOutputs) {
      this.addStack(stack);
      const template = stack.renderCloudFormationTemplate(session) as string;
      const templateName = stack.node.id;
      this.setStackAsset(templateName, template);
      const contentHash = crypto.createHash('sha256').update(template).digest('hex');
      return {
        sourceHash: contentHash,
      };
    }
    throw new AmplifyFault('UnknownFault', {
      message: 'Error synthesizing the template. Expected Stack to be either instance of AmplifyRootStack',
    });
  }

  /**
   * set a specific stack
   */
  setStackAsset = (templateName: string, template: string): void => {
    RootStackSynthesizer.stackAssets.set(templateName, JSONUtilities.parse(template));
  }

  /**
   * get all stacks
   */
  collectStacks = (): Map<string, Template> => new Map(RootStackSynthesizer.stackAssets.entries())

  /**
   * add a stack
   */
  addStack(stack: Stack): void {
    this.stacks.set(stack.node.id, stack);
  }

  getStack = (stackName: string): Stack => {
    if (this.stacks.has(stackName)) {
      return this.stacks.get(stackName)!;
    }

    throw new AmplifyFault('UnknownFault', {
      message: `Stack ${stackName} is not created`,
    });
  };
}
