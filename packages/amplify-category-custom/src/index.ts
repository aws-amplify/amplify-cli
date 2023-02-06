import {
  $TSAny,
  $TSContext, AmplifyError, IAmplifyResource, stateManager,
} from 'amplify-cli-core';
import { printer } from 'amplify-prompts';
import * as path from 'path';
import { buildCustomResources } from './utils/build-custom-resources';
import { categoryName } from './utils/constants';

export { generateDependentResourcesType } from './utils/build-custom-resources';
export { addCDKResourceDependency } from './utils/dependency-management-utils';
export { AmplifyResourceProps } from './utils/generate-cfn-from-cdk';

/**
 * execute amplify command
 */
export const executeAmplifyCommand = async (context: $TSContext): Promise<void> => {
  let commandPath = path.normalize(path.join(__dirname, 'commands'));

  if (context.input.command === 'help') {
    commandPath = path.join(commandPath, categoryName);
  } else {
    commandPath = path.join(commandPath, categoryName, context.input.command);
  }

  const commandModule = await import(commandPath);

  // Check if project has been initialized
  if (!stateManager.metaFileExists()) {
    throw new AmplifyError('MissingAmplifyMetaFileError', {
      message: 'Could not find the amplify-meta.json file.',
      resolution: 'Make sure your project is initialized in the cloud.',
    });
  }

  await commandModule.run(context);
};

/**
 * Amplify event handler
 */
export const handleAmplifyEvent = async (__context: $TSContext, args: $TSAny): Promise<void> => {
  printer.info(`${categoryName} handleAmplifyEvent to be implemented`);
  printer.info(`Received event args ${args}`);
};

/**
 * Transform category stack
 */
export const transformCategoryStack = async (context: $TSContext, resource: IAmplifyResource): Promise<void> => {
  await buildCustomResources(context, resource.resourceName);
};

// force major version bump for cdk v2
