import assert from 'node:assert';
import { AmplifyClient, BackendEnvironment, GetBackendEnvironmentCommand, ListBackendEnvironmentsCommand } from '@aws-sdk/client-amplify';
import { getEnvInfo } from '../../../../extensions/amplify-helpers/get-env-info';

export class BackendEnvironmentResolver {
  constructor(private appId: string, private envName: string, private amplifyClient: AmplifyClient) {}
  private selectedEnvironment: BackendEnvironment | undefined;
  selectBackendEnvironment = async (): Promise<BackendEnvironment | undefined> => {
    if (this.selectedEnvironment) return this.selectedEnvironment;
    const { backendEnvironment } = await this.amplifyClient.send(
      new GetBackendEnvironmentCommand({
        appId: this.appId,
        environmentName: this.envName,
      }),
    );
    assert(backendEnvironment, 'No backend environment found');
    this.selectedEnvironment = backendEnvironment;
    return this.selectedEnvironment;
  };

  getAllBackendEnvironments = async (): Promise<BackendEnvironment[]> => {
    const envInfo = getEnvInfo();
    assert(envInfo);
    const { backendEnvironments } = await this.amplifyClient.send(
      new ListBackendEnvironmentsCommand({
        appId: this.appId,
      }),
    );
    assert(backendEnvironments, 'No backend environments found');
    return backendEnvironments;
  };
}
