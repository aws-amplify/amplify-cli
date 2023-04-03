import { $TSAny, $TSContext } from 'amplify-cli-core';
import { FunctionDependency, FunctionParameters } from '@aws-amplify/amplify-function-plugin-interface';
export declare const askExecRolePermissionsQuestions: (context: $TSContext, resourceNameToUpdate: string, currentPermissionMap?: any, currentEnvMap?: any, category?: string, serviceName?: string) => Promise<ExecRolePermissionsResponse>;
export type ExecRolePermissionsResponse = Required<Pick<FunctionParameters, 'categoryPolicies' | 'environmentMap' | 'topLevelComment' | 'dependsOn' | 'mutableParametersState'>>;
export declare function getResourcesForCfn(context: any, resourceName: any, resourcePolicy: any, appsyncResourceName: any, selectedCategory: any): Promise<{
    permissionPolicies: any;
    cfnResources: any[];
}>;
export declare function generateEnvVariablesForCfn(context: $TSContext, resources: $TSAny[], currentEnvMap: $TSAny): Promise<{
    environmentMap: {};
    dependsOn: FunctionDependency[];
    envVarStringList: string;
}>;
//# sourceMappingURL=execPermissionsWalkthrough.d.ts.map