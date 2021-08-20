import { ISynthesisSession, Stack, LegacyStackSynthesizer } from '@aws-cdk/core';
import { Template } from 'cloudform-types';
export declare class AuthStackSythesizer extends LegacyStackSynthesizer {
  private stacks;
  private static readonly stackAssets;
  protected synthesizeStackTemplate(stack: Stack, session: ISynthesisSession): void;
  setStackAsset(templateName: string, template: string): void;
  collectStacks(): Map<string, Template>;
  addStack(stack: Stack): void;
  getStack: (stackName: string) => Stack;
}
//# sourceMappingURL=stack-synthesizer.d.ts.map
