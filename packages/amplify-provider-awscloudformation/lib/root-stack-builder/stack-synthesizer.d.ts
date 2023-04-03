import { FileAssetSource, LegacyStackSynthesizer, Stack } from 'aws-cdk-lib';
import { Template } from 'amplify-cli-core';
export declare class RootStackSynthesizer extends LegacyStackSynthesizer {
    private stacks;
    private static readonly stackAssets;
    protected synthesizeStackTemplate(stack: Stack): void;
    protected synthesizeTemplate(): FileAssetSource;
    setStackAsset: (templateName: string, template: string) => void;
    collectStacks: () => Map<string, Template>;
    addStack(stack: Stack): void;
    getStack: (stackName: string) => Stack;
}
//# sourceMappingURL=stack-synthesizer.d.ts.map