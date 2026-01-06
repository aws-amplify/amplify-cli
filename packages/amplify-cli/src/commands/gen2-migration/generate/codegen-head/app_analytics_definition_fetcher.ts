import assert from 'node:assert';
import { BackendEnvironmentResolver } from './backend_environment_selector';
import { StateManager } from '@aws-amplify/amplify-cli-core';
import { KinesisAnalyticsDefinition } from '../unsupported/cdk-from-cfn';

export interface AppAnalyticsDefinitionFetcher {
  getDefinition(): Promise<Record<string, KinesisAnalyticsDefinition> | undefined>;
}

export class AppAnalyticsDefinitionFetcher {
  constructor(private backendEnvironmentResolver: BackendEnvironmentResolver, private stateManager: StateManager) {}

  getDefinition = async (): Promise<Record<string, KinesisAnalyticsDefinition> | undefined> => {
    const backendEnvironment = await this.backendEnvironmentResolver.selectBackendEnvironment();
    assert(backendEnvironment?.stackName);

    const meta = this.stateManager.getMeta();
    const analytics = meta?.analytics as Record<string, KinesisAnalyticsDefinition> | undefined;
    return analytics ?? undefined;
  };
}
