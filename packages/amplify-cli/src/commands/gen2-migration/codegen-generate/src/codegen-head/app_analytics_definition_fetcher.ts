import assert from 'node:assert';
import { BackendEnvironmentResolver } from './backend_environment_selector';
import { StateManager } from '@aws-amplify/amplify-cli-core';

export interface AppAnalyticsDefinitionFetcher {
  getDefinition(): Promise<any | undefined>; // TODO: i guess we need AnalyticsDefinition to be handwritten...
}

export class AppAnalyticsDefinitionFetcher {
  constructor(private backendEnvironmentResolver: BackendEnvironmentResolver, private stateManager: StateManager) {}

  getDefinition = async (): Promise<any | undefined> => {
    const backendEnvironment = await this.backendEnvironmentResolver.selectBackendEnvironment();
    assert(backendEnvironment?.stackName);

    const meta = this.stateManager.getMeta();
    const analytics = meta?.analytics ?? {};
    return analytics;
  };
}
