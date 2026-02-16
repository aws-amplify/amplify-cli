import assert from 'node:assert';
import { BackendEnvironmentResolver } from './backend_environment_selector';
import { KinesisAnalyticsDefinition } from '../unsupported/cdk-from-cfn';
import * as path from 'path';
import { $TSMeta, JSONUtilities } from '@aws-amplify/amplify-cli-core';
import { BackendDownloader } from './backend_downloader';

export interface AppAnalyticsDefinitionFetcher {
  getDefinition(): Promise<Record<string, KinesisAnalyticsDefinition> | undefined>;
}

export class AppAnalyticsDefinitionFetcher {
  constructor(private backendEnvironmentResolver: BackendEnvironmentResolver, private backendFetcher: BackendDownloader) {}

  getDefinition = async (): Promise<Record<string, KinesisAnalyticsDefinition> | undefined> => {
    const backendEnvironment = await this.backendEnvironmentResolver.selectBackendEnvironment();
    assert(backendEnvironment?.stackName);

    const currentCloudBackendDirectory = await this.backendFetcher.getCurrentCloudBackend(backendEnvironment.deploymentArtifacts);
    const amplifyMetaPath = path.join(currentCloudBackendDirectory, 'amplify-meta.json');

    const meta = JSONUtilities.readJson<$TSMeta>(amplifyMetaPath, { throwIfNotExist: true });

    const analytics = meta?.analytics as Record<string, KinesisAnalyticsDefinition> | undefined;
    return analytics ?? undefined;
  };
}
