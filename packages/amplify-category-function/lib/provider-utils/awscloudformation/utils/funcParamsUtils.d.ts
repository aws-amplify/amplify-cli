import { FunctionParameters } from '@aws-amplify/amplify-function-plugin-interface';
export declare function merge(existing: Partial<FunctionParameters>, other: Partial<FunctionParameters>): Partial<FunctionParameters>;
export declare function isComplete(partial: Partial<FunctionParameters>): partial is FunctionParameters;
export declare function convertToComplete(partial: Partial<FunctionParameters>): FunctionParameters;
//# sourceMappingURL=funcParamsUtils.d.ts.map