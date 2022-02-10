import * as path from 'path';
import { JSONUtilities, pathManager, $TSAny } from 'amplify-cli-core';
import { hostedUIProviders } from '../assets/string-maps';
import { AuthParameters } from '../import/types';

/**
 * Factory function that returns a function that updates Amplify meta files after adding auth resource assets
 *
 * refactored from commands/enable.js
 * @param context The amplify context
 * @param resultMetadata The metadata from the service selection prompt
 */
export const getPostAddAuthMetaUpdater =
  (context: any, resultMetadata: { service: string; providerName: string }) =>
  (resourceName: string): string => {
    const options: any = {
      service: resultMetadata.service,
      providerPlugin: resultMetadata.providerName,
    };
    const parametersJSONPath = path.join(context.amplify.pathManager.getBackendDirPath(), 'auth', resourceName, 'build', 'parameters.json');
    const authParameters = JSONUtilities.readJson<AuthParameters>(parametersJSONPath)!;

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
    options.frontendAuthConfig = getFrontendConfig(authParameters);

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

/**
 * Factory function that returns a function that updates Amplify meta files after updating auth resource assets
 * @param context The amplify context
 */
export const getPostUpdateAuthMetaUpdater = (context: any) => async (resourceName: string) => {
  const resourceDirPath = path.join(pathManager.getBackendDirPath(), 'auth', resourceName, 'build', 'parameters.json');
  const authParameters = JSONUtilities.readJson<AuthParameters>(resourceDirPath)!;
  if (authParameters.dependsOn) {
    context.amplify.updateamplifyMetaAfterResourceUpdate('auth', resourceName, 'dependsOn', authParameters.dependsOn);
  }

  let customAuthConfigured = false;
  if (authParameters.triggers) {
    const triggers = JSONUtilities.parse<$TSAny>(authParameters.triggers);
    customAuthConfigured =
      !!triggers.DefineAuthChallenge &&
      triggers.DefineAuthChallenge.length > 0 &&
      !!triggers.CreateAuthChallenge &&
      triggers.CreateAuthChallenge.length > 0 &&
      !!triggers.VerifyAuthChallengeResponse &&
      triggers.VerifyAuthChallengeResponse.length > 0;
  }
  context.amplify.updateamplifyMetaAfterResourceUpdate('auth', resourceName, 'customAuth', customAuthConfigured);
  context.amplify.updateamplifyMetaAfterResourceUpdate('auth', resourceName, 'frontendAuthConfig', getFrontendConfig(authParameters));

  // Update Identity Pool dependency attributes on userpool groups
  const allResources = context.amplify.getProjectMeta();
  if (allResources.auth && allResources.auth.userPoolGroups) {
    let attributes = ['UserPoolId', 'AppClientIDWeb', 'AppClientID'];
    if (authParameters.identityPoolName) {
      attributes.push('IdentityPoolId');
    }
    const userPoolGroupDependsOn = [
      {
        category: 'auth',
        resourceName,
        attributes,
      },
    ];

    context.amplify.updateamplifyMetaAfterResourceUpdate('auth', 'userPoolGroups', 'dependsOn', userPoolGroupDependsOn);
  }
  return resourceName;
};

export function getFrontendConfig(authParameters: AuthParameters) {
  const verificationMechanisms = (authParameters?.autoVerifiedAttributes || []).map((att: string) => att.toUpperCase());
  const usernameAttributes: string[] = [];

  if (authParameters?.usernameAttributes && authParameters.usernameAttributes.length > 0) {
    authParameters.usernameAttributes[0].split(',').forEach(it => usernameAttributes.push(it.trim().toUpperCase()));
  }

  const socialProviders: string[] = [];
  (authParameters?.authProvidersUserPool ?? []).forEach((provider: string) => {
    const key = hostedUIProviders.find(it => it.value === provider)?.key;

    if (key) {
      socialProviders.push(key);
    }
  });

  const signupAttributes = (authParameters?.requiredAttributes || []).map((att: string) => att.toUpperCase());

  const passwordProtectionSettings = {
    passwordPolicyMinLength: authParameters?.passwordPolicyMinLength,
    passwordPolicyCharacters: (authParameters?.passwordPolicyCharacters || []).map((i: string) => i.replace(/ /g, '_').toUpperCase()),
  };

  const mfaTypes: string[] = [];
  if (authParameters.mfaTypes) {
    if (authParameters.mfaTypes.includes('SMS Text Message')) {
      mfaTypes.push('SMS');
    }

    if (authParameters.mfaTypes.includes('TOTP')) {
      mfaTypes.push('TOTP');
    }
  }

  return {
    socialProviders: socialProviders,
    usernameAttributes: usernameAttributes,
    signupAttributes: signupAttributes,
    passwordProtectionSettings: passwordProtectionSettings,
    mfaConfiguration: authParameters?.mfaConfiguration,
    mfaTypes: mfaTypes,
    verificationMechanisms: verificationMechanisms,
  };
}
