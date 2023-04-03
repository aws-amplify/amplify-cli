import { $TSContext, $TSObject } from 'amplify-cli-core';
import { FunctionParameters } from '@aws-amplify/amplify-function-plugin-interface';
export declare const createWalkthrough: (context: $TSContext, templateParameters: Partial<FunctionParameters>) => Promise<Partial<FunctionParameters>>;
export declare const buildShowEnvVars: (envVariableMap: any) => string;
export declare const buildTopLevelComment: (envVariableMap: any) => string;
export declare const updateWalkthrough: (context: $TSContext, lambdaToUpdate?: string) => Promise<Partial<FunctionParameters>>;
export declare const migrate: (__: $TSContext, projectPath: string, resourceName: string) => void;
export declare const updateCFNFileForResourcePermissions: (resourceDirPath: string, functionParameters: Partial<FunctionParameters>, currentParameters: $TSObject, apiResourceName?: string) => void;
//# sourceMappingURL=lambda-walkthrough.d.ts.map