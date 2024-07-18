import assert from 'node:assert';
import { stdin as input, stdout as output } from 'node:process';
import readline from 'node:readline/promises';
import { AmplifyClient, ListBackendEnvironmentsCommand } from '@aws-sdk/client-amplify';

export class BackendEnvironmentSelector {
  constructor(private amplifyClient: AmplifyClient) {}
  selectBackendEnvironment = async (appId: string) => {
    const { backendEnvironments } = await this.amplifyClient.send(new ListBackendEnvironmentsCommand({ appId }));
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
          return matchingEnvironment;
        }
      }
      rl.close();
    }
    return undefined;
  };
}
