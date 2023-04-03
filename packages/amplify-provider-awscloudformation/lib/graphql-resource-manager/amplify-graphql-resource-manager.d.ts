import { $TSAny, $TSContext } from 'amplify-cli-core';
import { CloudFormation } from 'aws-sdk';
import { DeploymentOp, DeploymentStep } from '../iterative-deployment';
export type GQLResourceManagerProps = {
    cfnClient: CloudFormation;
    resourceMeta?: ResourceMeta;
    backendDir: string;
    cloudBackendDir: string;
    rebuildAllTables?: boolean;
};
export type ResourceMeta = {
    category: string;
    providerPlugin: string;
    resourceName: string;
    service: string;
    output: $TSAny;
    providerMetadata: {
        s3TemplateURL: string;
        logicalId: string;
    };
    stackId: string;
    DeploymentBucketName: string;
    [key: string]: $TSAny;
};
export declare class GraphQLResourceManager {
    static serviceName: string;
    static categoryName: string;
    private cfnClient;
    private resourceMeta;
    private cloudBackendApiProjectRoot;
    private backendApiProjectRoot;
    private templateState;
    private rebuildAllTables;
    static createInstance: (context: $TSContext, gqlResource: any, StackId: string, rebuildAllTables?: boolean) => Promise<GraphQLResourceManager>;
    constructor(props: GQLResourceManagerProps);
    run: () => Promise<DeploymentStep[]>;
    getDeploymentSteps: () => Promise<DeploymentStep[]>;
    getCurrentlyDeployedStackStep: () => Promise<DeploymentOp>;
    getStateFilesDirectory: () => string;
    getCloudStateFilesDirectory: () => Promise<string>;
    private gsiManagement;
    private tableRecreationManagement;
    private replaceRecreatedNestedStackParamsInRootStackTemplate;
    getTablesBeingReplaced: () => any;
    private getTable;
    private getStack;
    private addGSI;
    private deleteGSI;
    private dropTemplateResources;
    private dropTemplateResourcesForSearchableStack;
    private clearTemplateState;
    private getTableNameFromTemplate;
}
//# sourceMappingURL=amplify-graphql-resource-manager.d.ts.map