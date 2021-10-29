import { prompter } from 'amplify-prompts';
import { v4 as uuid } from 'uuid';
import { customDeploymentOptions } from '../utils/constants';

export async function customDeploymentOptionsQuestion(): Promise<string> {
  const deploymentOption = await prompter.pick('How do you want to define this custom resource?', customDeploymentOptions);
  return deploymentOption;
}

export async function customResourceNameQuestion(): Promise<string> {
  const [shortId] = uuid().split('-');
  const defaultResourceName = `customResource${shortId}`;

  const resourceName = await prompter.input('Provide a name for your custom resource', { initial: defaultResourceName });
  return resourceName;
}
