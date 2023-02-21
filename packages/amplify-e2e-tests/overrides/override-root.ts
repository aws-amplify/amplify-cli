import { AmplifyProjectInfo, AmplifyRootStackTemplate } from '@aws-amplify/cli-extensibility-helper';

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}
export function override(props: AmplifyRootStackTemplate, amplifyProjectInfo: AmplifyProjectInfo): void {
  props.authRole.roleName = `mockRole-${getRandomInt(10000)}`;

  if (!amplifyProjectInfo || !amplifyProjectInfo.envName || !amplifyProjectInfo.projectName) {
    throw new Error(`Project info is missing in override: ${JSON.stringify(amplifyProjectInfo)}`);
  }
}
