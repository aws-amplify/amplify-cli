import assert from 'node:assert';
import { BackendEnvironmentResolver } from './backend_environment_selector';
import { GeoResourceDefinition } from '../unsupported/cdk-from-cfn';
import * as path from 'path';
import { $TSMeta, JSONUtilities } from '@aws-amplify/amplify-cli-core';
import { BackendDownloader } from './backend_downloader';

export class AppGeoDefinitionFetcher {
  constructor(private backendEnvironmentResolver: BackendEnvironmentResolver, private backendFetcher: BackendDownloader) {}

  getDefinition = async (): Promise<Record<string, GeoResourceDefinition> | undefined> => {
    const backendEnvironment = await this.backendEnvironmentResolver.selectBackendEnvironment();
    assert(backendEnvironment?.stackName);

    const currentCloudBackendDirectory = await this.backendFetcher.getCurrentCloudBackend(backendEnvironment.deploymentArtifacts);
    const amplifyMetaPath = path.join(currentCloudBackendDirectory, 'amplify-meta.json');

    const meta = JSONUtilities.readJson<$TSMeta>(amplifyMetaPath, { throwIfNotExist: true });

    const geo = meta?.geo as Record<string, GeoResourceDefinition> | undefined;
    return geo ?? undefined;
  };
}
