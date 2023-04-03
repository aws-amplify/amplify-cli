import { $TSContext } from 'amplify-cli-core';
import { FunctionParameters, FunctionRuntime, LambdaLayer } from '@aws-amplify/amplify-function-plugin-interface';
export declare const addLayersToFunctionWalkthrough: (context: $TSContext, runtime: Pick<FunctionRuntime, 'value'>, previousSelections?: LambdaLayer[], defaultConfirm?: boolean) => Promise<Required<Pick<FunctionParameters, 'lambdaLayers' | 'dependsOn'>>>;
//# sourceMappingURL=addLayerToFunctionWalkthrough.d.ts.map