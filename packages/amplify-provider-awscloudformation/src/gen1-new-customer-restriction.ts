import { AmplifyError } from '@aws-amplify/amplify-cli-core';
import { AmplifyClient, ListAppsCommand, ListBackendEnvironmentsCommand } from '@aws-sdk/client-amplify';

const GEN1_DEPRECATION_MESSAGE =
  'AWS Amplify Gen 1 has entered maintenance mode and will no longer accept new customers. Start a new app with Amplify Gen 2: https://docs.amplify.aws/';

/**
 * Check whether the current AWS account+region is an existing Gen 1 customer.
 *
 * An account is considered an existing Gen 1 customer if ANY Amplify app in the
 * account+region has at least one backend environment. Short-circuits on the
 * first match — does not enumerate all apps unnecessarily.
 *
 * @param amplifyClient - A configured `@aws-sdk/client-amplify` client
 * @returns `true` if at least one app has a backend environment, `false` otherwise
 */
export const isExistingGen1Customer = async (amplifyClient: AmplifyClient): Promise<boolean> => {
  let nextToken: string | undefined;

  do {
    const listAppsResponse = await amplifyClient.send(
      new ListAppsCommand({
        nextToken,
        maxResults: 25,
      }),
    );

    const apps = listAppsResponse.apps ?? [];

    for (const app of apps) {
      const envResponse = await amplifyClient.send(
        new ListBackendEnvironmentsCommand({
          appId: app.appId,
        }),
      );

      if (envResponse.backendEnvironments && envResponse.backendEnvironments.length > 0) {
        return true;
      }
    }

    nextToken = listAppsResponse.nextToken;
  } while (nextToken);

  return false;
};

/**
 * Enforce the Gen 1 new-customer restriction.
 *
 * Calls {@link isExistingGen1Customer} and, if the account is NOT an existing
 * customer, prints a yellow warning to stderr and throws an `AmplifyError` to
 * halt execution.
 *
 * @param amplifyClient - A configured `@aws-sdk/client-amplify` client
 * @throws {AmplifyError} with name `ProjectInitError` when the account is not an existing Gen 1 customer
 */
export const enforceGen1NewCustomerRestriction = async (amplifyClient: AmplifyClient): Promise<void> => {
  const isExisting = await isExistingGen1Customer(amplifyClient);

  if (!isExisting) {
    process.stderr.write(`\n\x1b[33m${GEN1_DEPRECATION_MESSAGE}\x1b[0m\n\n`);
    throw new AmplifyError('ProjectInitError', {
      message: GEN1_DEPRECATION_MESSAGE,
    });
  }
};
