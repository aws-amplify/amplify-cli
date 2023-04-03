import * as cdk from 'aws-cdk-lib';
import { $TSContext, $TSObject } from '@aws-amplify/amplify-cli-core';
export interface AmplifyDependentResourceDefinition {
    resourceName: string;
    category: string;
    attributes?: [string?];
}
export declare function getResourceCfnOutputAttributes(category: string, resourceName: string): [string?];
export declare function getAllResources(): $TSObject;
export declare function addCDKResourceDependency(stack: cdk.Stack, category: string, resourceName: string, dependentResources: AmplifyDependentResourceDefinition[]): any;
export declare function addCFNResourceDependency(context: $TSContext, customResourceName: string): Promise<void>;
//# sourceMappingURL=dependency-management-utils.d.ts.map