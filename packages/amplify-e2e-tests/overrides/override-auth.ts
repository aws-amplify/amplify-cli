import { AmplifyProjectInfo, AmplifyAuthCognitoStackTemplate } from '@aws-amplify/cli-extensibility-helper';

export function override(props: AmplifyAuthCognitoStackTemplate, amplifyProjectInfo: AmplifyProjectInfo): void {
  props.userPool.deviceConfiguration = {
    challengeRequiredOnNewDevice: true,
  };
  props.userPool.userAttributeUpdateSettings = {
    attributesRequireVerificationBeforeUpdate: ['email'],
  };

  if (!amplifyProjectInfo || !amplifyProjectInfo.envName || !amplifyProjectInfo.projectName) {
    throw new Error('Project info is missing in override');
  }
}
