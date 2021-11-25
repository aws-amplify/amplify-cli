import { $TSAny, $TSContext, IAmplifyResource } from 'amplify-cli-core';
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

  await commandModule.run(context);
}

export async function handleAmplifyEvent(context: $TSContext, args: $TSAny) {
  printer.info(`${categoryName} handleAmplifyEvent to be implemented`);
  printer.info(`Received event args ${args}`);
}

export async function transformCategoryStack(context: $TSContext, resource: IAmplifyResource) {
  await buildCustomResources(context, resource.resourceName);
}

export async function getPermissionPolicies(context: $TSContext, resourceOpsMapping: $TSAny) {

  const permissionPolicies: any[] = [];
  const resourceAttributes: any[] = [];

  Object.keys(resourceOpsMapping).forEach(resourceName => {
    const customResourceFilePath = path.join(context.amplify.pathManager.getBackendDirPath(), categoryName, resourceName, "resources.json");
    let customResource = context.amplify.readJsonFile(customResourceFilePath);

    let customResourceJSON = JSON.stringify(customResource);

    customResourceJSON = customResourceJSON.replace(/\$\{categoryName\}/, categoryName);
    customResourceJSON = customResourceJSON.replace(/\$\{resourceName\}/, resourceName);

    customResource = JSON.parse(customResourceJSON);

    const actions: string[] = [];

    const crudOptions = resourceOpsMapping[resourceName];

    crudOptions.forEach((crudOption: string) => {
      actions.push(
        ...customResource.policy.actions[crudOption]
      );
    });

    const policy = {
      Effect: 'Allow',
      Action: actions,
      Resource: [
        ...customResource.policy.resources
      ],
    }

    if (actions.length > 0) {
      permissionPolicies.push(policy);
    }

    const attributes = customResource.attributes;

    if (attributes.length > 0) {
      resourceAttributes.push({
        resourceName,
        attributes,
        category: categoryName
      })
    }
  });

  return { permissionPolicies, resourceAttributes };
}