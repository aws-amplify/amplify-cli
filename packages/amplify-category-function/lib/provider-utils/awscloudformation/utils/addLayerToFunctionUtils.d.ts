import { $TSContext, $TSMeta } from 'amplify-cli-core';
import { FunctionDependency, LambdaLayer } from '@aws-amplify/amplify-function-plugin-interface';
export declare const provideExistingARNsPrompt = "Provide existing Lambda layer ARNs";
export declare const askLayerSelection: (context: $TSContext, amplifyMeta: $TSMeta, runtimeValue: string, previousSelections?: LambdaLayer[]) => Promise<{
    lambdaLayers: LambdaLayer[];
    dependsOn: FunctionDependency[];
    askArnQuestion: boolean;
}>;
export declare const askCustomArnQuestion: (numLayersSelected: number, previousSelections?: LambdaLayer[]) => Promise<LambdaLayer[]>;
export declare const askLayerOrderQuestion: (currentSelections: LambdaLayer[], previousSelections?: LambdaLayer[]) => Promise<LambdaLayer[]>;
//# sourceMappingURL=addLayerToFunctionUtils.d.ts.map