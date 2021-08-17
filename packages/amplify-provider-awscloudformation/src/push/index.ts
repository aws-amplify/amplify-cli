export type ResourceDefinition = {
  category: string;
  service: string;
  build: string;
  resourceName: string;
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
  resourceToBeDeleted: ResourceDefinition[];
  tagsUpdated: boolean;
  allResources: ResourceDefinition[];
};

export enum ResourceDeployType {
  Export,
  Push,
}
