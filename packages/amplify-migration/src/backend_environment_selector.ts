import assert from 'node:assert';
import { stdin as input, stdout as output } from 'node:process';
import readline from 'node:readline/promises';
import { AmplifyClient, BackendEnvironment, ListBackendEnvironmentsCommand } from '@aws-sdk/client-amplify';

export class BackendEnvironmentResolver {
  constructor(private appId: string, private amplifyClient: AmplifyClient) {}
  private selectedEnvironment: BackendEnvironment | undefined;
  selectBackendEnvironment = async (): Promise<BackendEnvironment | undefined> => {
    if (this.selectedEnvironment) return this.selectedEnvironment;
    const { backendEnvironments } = await this.amplifyClient.send(new ListBackendEnvironmentsCommand({ appId: this.appId }));
    assert(backendEnvironments, 'No backend environments found');
    const selectedStack = '';
    if (backendEnvironments?.length === 1) {
      return backendEnvironments[0];
    } else {
      const rl = readline.createInterface({ input, output });
      while (!selectedStack) {
        console.log(
          `Multiple available backends:\n * ${backendEnvironments
            ?.filter((be) => be.stackName)
            .map((be) => be.environmentName)
            .join('\n * ')}`,
        );
        const answer = await rl.question('Which backend environment would you like to migrate?\n> ');
        const matchingEnvironment = backendEnvironments.find((be) => be.environmentName?.toLowerCase() === answer.trim().toLowerCase());
        if (matchingEnvironment) {
          rl.close();
          this.selectedEnvironment = matchingEnvironment;
          return matchingEnvironment;
        }
      }
      rl.close();
    }
    return undefined;
  };
}
