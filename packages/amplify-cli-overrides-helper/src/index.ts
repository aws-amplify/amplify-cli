import { printer } from 'amplify-prompts';

import { AmplifyRootStackTemplate } from 'amplify-provider-awscloudformation';

function getProjectInfo(): void {
  printer.info('Hello from the skeleton of get project info');
}

function addDependency(): void {
  printer.info('Hello from the skeleton of add dependency');
}

export { getProjectInfo, addDependency, AmplifyRootStackTemplate };
