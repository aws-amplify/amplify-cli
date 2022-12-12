import { ISynthesisSession, Stack, LegacyStackSynthesizer } from "@aws-cdk/core";
import { JSONUtilities } from "amplify-cli-core";
import type { Template } from "cloudform-types";
import { AmplifyAuthCognitoStack, AmplifyUserPoolGroupStack, AmplifyUserPoolGroupStackOutputs } from "./index";

/**
 * Amplify Stack Synthesizer for Auth Category
 */
export class AuthStackSynthesizer extends LegacyStackSynthesizer {
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
        "Error synthesizing the template. Expected Stack to be either instance of AmplifyAuthCognitoStack or AmplifyUserPoolGroupStack"
      );
    }
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
