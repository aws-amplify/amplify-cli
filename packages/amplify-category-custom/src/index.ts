import { $TSAny, $TSContext, IAmplifyResource } from 'amplify-cli-core';
import { printer } from 'amplify-prompts';
import * as path from 'path';
import { buildCustomResources } from './utils/build-custom-resources';
import { categoryName } from './utils/constants';
export { addCDKResourceDependency } from './utils/dependency-management-utils';
export { generateDependentResourcesType } from './utils/build-custom-resources';

export async function executeAmplifyCommand(context: $TSContext) {
  let commandPath = path.normalize(path.join(__dirname, 'commands'));

  if (context.input.command === 'help') {
    commandPath = path.join(commandPath, categoryName);
  } else {
    commandPath = path.join(commandPath, categoryName, context.input.command);
  }

  const commandModule = await import(commandPath);

  await commandModule.run(context);
}

export async function handleAmplifyEvent(context: $TSContext, args: $TSAny) {
  printer.info(`${categoryName} handleAmplifyEvent to be implemented`);
  printer.info(`Received event args ${args}`);
}

export async function transformCategoryStack(context: $TSContext, resource: IAmplifyResource) {
  await buildCustomResources(context, resource.resourceName);
}
