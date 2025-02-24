export type ResourceDefinition = {
  category: string;
  service: string;
  serviceType?: string;
  build?: boolean;
  resourceName: string;
  providerPlugin?: string;
};

export type BuiltResourceDefinition = ResourceDefinition & {
  lastBuildTimeStamp?: string | Date;
};

export type PackagerParams = {
  newPackageCreated: boolean;
  zipFilename: string;
  zipFilePath: string;
};

export type PackagedResourceDefinition = BuiltResourceDefinition & {
  packagerParams?: PackagerParams;
};

type UploaderParams = {
  s3Bucket: string;
  s3Key: string;
};

export type UploadedResourceDefinition = PackagedResourceDefinition & {
  uploaderParams?: UploaderParams;
};

export type TransformedCfnResource = PackagedResourceDefinition & {
  transformedCfnPaths: string[];
};
export type DeploymentResources = {
  resourcesToBeCreated: ResourceDefinition[];
  resourcesToBeSynced: ResourceDefinition[];
  resourcesToBeUpdated: ResourceDefinition[];
  resourcesToBeDeleted: ResourceDefinition[];
  tagsUpdated: boolean;
  allResources: ResourceDefinition[];
};

export enum ResourceDeployType {
  Export,
  Push,
}
export type StackIncludeDetails = {
  parameters?: { [key: string]: any };
  destination: string;
  nestedStacks?: StackParameters;
};
export type StackParameters = {
  [stackName: string]: StackIncludeDetails;
};

export type WrittenCfnResource = PackagedResourceDefinition & {
  destinationPath: string;
  nestedStacks?: StackParameters;
};
