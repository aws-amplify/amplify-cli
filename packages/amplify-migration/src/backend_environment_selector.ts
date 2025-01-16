import assert from 'node:assert';
import { stdin as input, stdout as output } from 'node:process';
import readline from 'node:readline/promises';
import {
  AmplifyClient,
  BackendEnvironment,
  GetBackendEnvironmentCommand,
  GetBackendEnvironmentCommandOutput,
  ListBackendEnvironmentsCommand,
} from '@aws-sdk/client-amplify';
import { getEnvInfo } from '@aws-amplify/cli-internal/lib/extensions/amplify-helpers/get-env-info';

export class BackendEnvironmentResolver {
  constructor(private appId: string, private amplifyClient: AmplifyClient) {}
  private selectedEnvironment: BackendEnvironment | undefined;
  selectBackendEnvironment = async (): Promise<BackendEnvironment | undefined> => {
    if (this.selectedEnvironment) return this.selectedEnvironment;
    const envInfo = getEnvInfo();
    assert(envInfo);
    const { backendEnvironment } = await this.amplifyClient.send(
      new GetBackendEnvironmentCommand({
        appId: this.appId,
        environmentName: envInfo.envName,
      }),
    );
    assert(backendEnvironment, 'No backend environment found');
    this.selectedEnvironment = backendEnvironment;
    return this.selectedEnvironment;
  };
}
