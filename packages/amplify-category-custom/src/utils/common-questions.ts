import { customDeploymentOptions } from '../utils/constants';
import { prompter } from 'amplify-prompts';

export async function customDeploymentOptionsQuestion(): Promise<string> {
  const deploymentOption = await prompter.pick('How do you want to define this custom resource?', customDeploymentOptions);
  return deploymentOption;
}

export async function customResourceNameQuestion(): Promise<string> {
  const resourceName = await prompter.input('Provide a name for your custom resource');
  return resourceName;
}
