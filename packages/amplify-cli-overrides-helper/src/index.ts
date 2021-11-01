import { printer } from 'amplify-prompts';

//import { AmplifyRootStackTemplate } from 'amplify-provider-awscloudformation';
import { AmplifyAuthCognitoStackTemplate } from '@aws-amplify/amplify-category-auth';
import { AmplifyDDBResourceTemplate, AmplifyS3ResourceTemplate } from '@aws-amplify/amplify-category-storage';
import { addCDKResourceDependency } from '@aws-amplify/amplify-category-custom';

function getProjectInfo(): void {
  printer.info('Hello from the skeleton of get project info');
}

function addDependency(): void {
  printer.info('Hello from the skeleton of add dependency');
}

export {
  getProjectInfo,
  addDependency,
  //AmplifyRootStackTemplate,
  AmplifyAuthCognitoStackTemplate,
  AmplifyDDBResourceTemplate,
  AmplifyS3ResourceTemplate,
  addCDKResourceDependency,
};
