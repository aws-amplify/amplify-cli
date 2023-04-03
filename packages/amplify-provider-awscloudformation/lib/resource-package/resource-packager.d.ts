import { $TSContext, $TSMeta } from 'amplify-cli-core';
import { Template } from 'cloudform-types';
import { DeploymentResources, ResourceDefinition, ResourceDeployType, BuiltResourceDefinition, PackagedResourceDefinition, UploadedResourceDefinition, TransformedCfnResource } from './types';
export declare abstract class ResourcePackager {
    protected elasticContainerZipFiles: string[];
    protected context: $TSContext;
    protected amplifyMeta: $TSMeta;
    private amplifyTeamProviderInfo;
    protected envInfo: {
        envName: string;
    };
    deployType: ResourceDeployType;
    private getResourcesToBeDeployed;
    constructor(context: $TSContext, deployType: ResourceDeployType);
    protected filterResourcesToBeDeployed(deploymentResources: DeploymentResources): Promise<ResourceDefinition[]>;
    protected preBuildResources(resources: ResourceDefinition[]): Promise<ResourceDefinition[]>;
    protected buildResources(resources: ResourceDefinition[]): Promise<BuiltResourceDefinition[]>;
    protected packageResources(builtResources: BuiltResourceDefinition[]): Promise<PackagedResourceDefinition[]>;
    protected postPackageResource(packagedResources: PackagedResourceDefinition[]): Promise<PackagedResourceDefinition[]>;
    protected resourcesHasContainers(packagedResources: PackagedResourceDefinition[]): boolean;
    protected resourcesHasApiGatewaysButNotAdminQueries(packagedResources: PackagedResourceDefinition[]): boolean;
    protected storeS3BucketInfo(packagedResource: PackagedResourceDefinition, bucketName: string): void;
    protected generateCategoryCloudFormation(resources: UploadedResourceDefinition[] | PackagedResourceDefinition[]): Promise<void>;
    private generateByCategoryService;
    protected postGenerateCategoryCloudFormation(resources: PackagedResourceDefinition[]): Promise<TransformedCfnResource[]>;
    private getCfnTemplatePathsForResource;
    protected generateRootStack(): Promise<Template>;
    private resourcesHasCategoryService;
    protected filterResourceByCategoryService: (resources: ResourceDefinition[], category: string, service?: string) => ResourceDefinition[];
}
//# sourceMappingURL=resource-packager.d.ts.map