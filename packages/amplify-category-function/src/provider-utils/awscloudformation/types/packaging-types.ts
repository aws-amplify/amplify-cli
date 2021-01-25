import { $TSContext, ResourceTuple } from 'amplify-cli-core';

export type ResourceMeta = ResourceTuple & {
  service: string;
  build: boolean;
  distZipFilename: string;
  lastBuildTimeStamp?: string;
  lastPackageTimeStamp?: string;
  skipHashing: boolean;
};

export type Packager = (context: $TSContext, resource: ResourceMeta) => Promise<{ zipFilename: string; zipFilePath: string }>;
