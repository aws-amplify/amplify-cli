import assert from 'node:assert';
import { AmplifyClient, BackendEnvironment, GetBackendEnvironmentCommand, ListBackendEnvironmentsCommand } from '@aws-sdk/client-amplify';
import { getEnvInfo } from '../../../../extensions/amplify-helpers/get-env-info';

export class BackendEnvironmentResolver {
  private selectedEnvironment: BackendEnvironment | undefined;

  public constructor(private readonly appId: string, private readonly envName: string, private readonly amplifyClient: AmplifyClient) {}

  public selectBackendEnvironment = async (): Promise<BackendEnvironment | undefined> => {
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

  public getAllBackendEnvironments = async (): Promise<BackendEnvironment[]> => {
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
