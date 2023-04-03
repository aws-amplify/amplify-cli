import { FileAssetSource, Stack, LegacyStackSynthesizer } from 'aws-cdk-lib';
import { Template } from 'cloudform-types';
export declare class AuthStackSynthesizer extends LegacyStackSynthesizer {
    private readonly stacks;
    private static readonly stackAssets;
    protected synthesizeStackTemplate(stack: Stack): void;
    protected synthesizeTemplate(): FileAssetSource;
    setStackAsset(templateName: string, template: string): void;
    collectStacks(): Map<string, Template>;
    addStack(stack: Stack): void;
    getStack: (stackName: string) => Stack;
}
//# sourceMappingURL=stack-synthesizer.d.ts.map