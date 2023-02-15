import { AmplifyProjectInfo, AmplifyAuthCognitoStackTemplate } from '@aws-amplify/cli-extensibility-helper';

export function override(props: AmplifyAuthCognitoStackTemplate, projectInfo: AmplifyProjectInfo): void {
  props.userPool.deviceConfiguration = {
    challengeRequiredOnNewDevice: true,
  };
  props.userPool.userAttributeUpdateSettings = {
    attributesRequireVerificationBeforeUpdate: ['email'],
  };

  if (!projectInfo || !projectInfo.envName || !projectInfo.projectName) {
    throw new Error('Project info is missing in override');
  }
}
