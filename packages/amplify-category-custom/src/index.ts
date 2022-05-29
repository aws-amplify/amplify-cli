import { $TSAny, $TSContext, IAmplifyResource, stateManager } from 'amplify-cli-core';
import { printer } from 'amplify-prompts';
import * as path from 'path';
import { buildCustomResources } from './utils/build-custom-resources';
import { categoryName } from './utils/constants';
export { addCDKResourceDependency } from './utils/dependency-management-utils';
export { generateDependentResourcesType } from './utils/build-custom-resources';
export { AmplifyResourceProps } from './utils/generate-cfn-from-cdk';

export async function executeAmplifyCommand(context: $TSContext) {
  let commandPath = path.normalize(path.join(__dirname, 'commands'));

  if (context.input.command === 'help') {
    commandPath = path.join(commandPath, categoryName);
  } else {
    commandPath = path.join(commandPath, categoryName, context.input.command);
  }

  const commandModule = await import(commandPath);

  // Check if project has been initialized
  if (!stateManager.metaFileExists()) {
    printer.error('Could not find the amplfiy-meta.json file. Make sure your project is initialized in the cloud.');
    return;
  }

  await commandModule.run(context);
}

export async function handleAmplifyEvent(context: $TSContext, args: $TSAny) {
  printer.info(`${categoryName} handleAmplifyEvent to be implemented`);
  printer.info(`Received event args ${args}`);
}

export async function transformCategoryStack(context: $TSContext, resource: IAmplifyResource) {
  await buildCustomResources(context, resource.resourceName);
}
