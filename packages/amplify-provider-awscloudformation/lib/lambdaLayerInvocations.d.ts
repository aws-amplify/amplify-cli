import { $TSAny, $TSContext } from 'amplify-cli-core';
export declare function prePushLambdaLayerPrompt(context: $TSContext, resources: Array<$TSAny>): Promise<void>;
export declare function postPushLambdaLayerCleanup(context: $TSContext, resources: Array<$TSAny>, envName: string): Promise<void>;
export declare function legacyLayerMigration(context: $TSContext, layerName: string): Promise<void>;
//# sourceMappingURL=lambdaLayerInvocations.d.ts.map