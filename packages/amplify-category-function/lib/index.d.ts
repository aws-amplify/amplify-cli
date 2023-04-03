import { $TSAny, $TSContext } from 'amplify-cli-core';
import { BuildType } from '@aws-amplify/amplify-function-plugin-interface';
export { categoryName as category } from './constants';
export { askExecRolePermissionsQuestions } from './provider-utils/awscloudformation/service-walkthroughs/execPermissionsWalkthrough';
export { buildResource } from './provider-utils/awscloudformation/utils/build';
export { buildTypeKeyMap } from './provider-utils/awscloudformation/utils/buildFunction';
export { ServiceName } from './provider-utils/awscloudformation/utils/constants';
export { lambdasWithApiDependency } from './provider-utils/awscloudformation/utils/getDependentFunction';
export { hashLayerResource } from './provider-utils/awscloudformation/utils/layerHelpers';
export { migrateLegacyLayer } from './provider-utils/awscloudformation/utils/layerMigrationUtils';
export { packageResource } from './provider-utils/awscloudformation/utils/package';
export { ensureLambdaExecutionRoleOutputs } from './provider-utils/awscloudformation/utils/ensure-lambda-arn-outputs';
export { updateDependentFunctionsCfn, addAppSyncInvokeMethodPermission, } from './provider-utils/awscloudformation/utils/updateDependentFunctionCfn';
export { loadFunctionParameters } from './provider-utils/awscloudformation/utils/loadFunctionParameters';
export declare const add: (context: any, providerName: any, service: any, parameters: any) => Promise<string>;
export declare const update: (context: any, providerName: any, service: any, parameters: any, resourceToUpdate: any) => Promise<$TSAny>;
export declare const console: (context: $TSContext) => Promise<void>;
export declare const migrate: (context: $TSContext) => Promise<void>;
export declare const getPermissionPolicies: (context: $TSContext, resourceOpsMapping: $TSAny) => Promise<{
    permissionPolicies: $TSAny[];
    resourceAttributes: $TSAny[];
}>;
export declare const initEnv: (context: $TSContext) => Promise<void>;
export declare const getInvoker: (context: $TSContext, { handler, resourceName, envVars }: InvokerParameters) => Promise<({ event }: {
    event: unknown;
}) => Promise<$TSAny>>;
export declare const getBuilder: (context: $TSContext, resourceName: string, buildType: BuildType) => (() => Promise<void>);
export declare const isMockable: (context: $TSContext, resourceName: string) => IsMockableResponse;
export declare const executeAmplifyCommand: (context: $TSContext) => Promise<void>;
export declare const handleAmplifyEvent: (context: $TSContext, args: $TSAny) => Promise<void>;
export declare const lambdaLayerPrompt: (context: $TSContext, resources: $TSAny[]) => Promise<void>;
export declare const postPushCleanup: (resource: $TSAny[], envName: string) => Promise<void>;
export type InvokerParameters = {
    resourceName: string;
    handler: string;
    envVars?: {
        [key: string]: string;
    };
};
export interface IsMockableResponse {
    isMockable: boolean;
    reason?: string;
}
//# sourceMappingURL=index.d.ts.map