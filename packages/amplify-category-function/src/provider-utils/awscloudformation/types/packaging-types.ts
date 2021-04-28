import { $TSContext, ResourceTuple } from 'amplify-cli-core';

export type PackageRequestMeta = ResourceTuple & {
  service: string;
  build: boolean;
  distZipFilename: string;
  lastBuildTimeStamp?: string;
  lastPackageTimeStamp?: string;
  skipHashing: boolean;
};

export type Packager = (
  context: $TSContext,
  resource: PackageRequestMeta,
) => Promise<{ newPackageCreated: boolean; zipFilename: string; zipFilePath: string }>;
