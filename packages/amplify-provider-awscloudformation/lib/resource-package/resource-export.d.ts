import { $TSContext } from 'amplify-cli-core';
import { DeploymentResources, PackagedResourceDefinition, ResourceDefinition, StackParameters, TransformedCfnResource } from './types';
import { ResourcePackager } from './resource-packager';
export declare class ResourceExport extends ResourcePackager {
    exportDirectoryPath: string;
    constructor(context: $TSContext, exportDirectoryPath: string);
    packageBuildWriteResources(deploymentResources: DeploymentResources): Promise<PackagedResourceDefinition[]>;
    generateAndTransformCfnResources(packagedResources: PackagedResourceDefinition[]): Promise<{
        transformedResources: TransformedCfnResource[];
        stackParameters: StackParameters;
    }>;
    fixNestedStackParameters(transformedCfnResources: TransformedCfnResource[], stackParameters: StackParameters): StackParameters;
    generateAndWriteRootStack(stackParameters: StackParameters): Promise<StackParameters>;
    warnForNonExportable(resources: ResourceDefinition[]): void;
    writeResourcesToDestination(resources: PackagedResourceDefinition[]): Promise<void>;
    private downloadLambdaLayerContent;
    private processAndWriteCfn;
    private processAndWriteCfnTemplate;
    private copyResource;
    private writeCategoryCloudFormation;
    private extractParametersFromTemplateNestedStack;
    private extractParameters;
    private modifyRootStack;
    private getAuthCognitoResource;
    private writeRootStackToPath;
    private createTemplateUrl;
}
//# sourceMappingURL=resource-export.d.ts.map