import * as path from 'path';
import { JSONUtilities } from 'amplify-cli-core';
/**
 * Factory function that returns a function that updates Amplify meta files after adding auth resource assets
 *
 * refactored from commands/enable.js
 * @param context The amplify context
 * @param resultMetadata The metadata from the service selection prompt
 */
export const getPostAddAuthMetaUpdater = (context: any, resultMetadata: { service: string; providerName: string }) => (
  resourceName: string,
): string => {
  const options: any = {
    service: resultMetadata.service,
    providerPlugin: resultMetadata.providerName,
  };
  const resourceDirPath = path.join(context.amplify.pathManager.getBackendDirPath(), 'auth', resourceName, 'parameters.json');
  const authParameters = JSONUtilities.readJson<{ dependsOn: any[]; triggers: string; identityPoolName: string }>(resourceDirPath)!;

  if (authParameters.dependsOn) {
    options.dependsOn = authParameters.dependsOn;
  }

  let customAuthConfigured = false;
  if (authParameters.triggers) {
    const triggers = JSONUtilities.parse<any>(authParameters.triggers);

    customAuthConfigured =
      !!triggers.DefineAuthChallenge &&
      triggers.DefineAuthChallenge.length > 0 &&
      !!triggers.CreateAuthChallenge &&
      triggers.CreateAuthChallenge.length > 0 &&
      !!triggers.VerifyAuthChallengeResponse &&
      triggers.VerifyAuthChallengeResponse.length > 0;
  }

  options.customAuth = customAuthConfigured;

  context.amplify.updateamplifyMetaAfterResourceAdd('auth', resourceName, options);

  // Remove Identity Pool dependency attributes on userpool groups if Identity Pool not enabled
  const allResources = context.amplify.getProjectMeta();
  if (allResources.auth && allResources.auth.userPoolGroups) {
    if (!authParameters.identityPoolName) {
      const userPoolGroupDependsOn = [
        {
          category: 'auth',
          resourceName,
          attributes: ['UserPoolId', 'AppClientIDWeb', 'AppClientID'],
        },
      ];
      context.amplify.updateamplifyMetaAfterResourceUpdate('auth', 'userPoolGroups', 'dependsOn', userPoolGroupDependsOn);
    }
  }
  return resourceName;
};
