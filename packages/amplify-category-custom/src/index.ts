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
    const customResourceFilePath = path.join(context.amplify.pathManager.getBackendDirPath(), categoryName, resourceName, 'resources.json');
    let customResource = context.amplify.readJsonFile(customResourceFilePath);

    let customResourceJSON = JSON.stringify(customResource);

    customResourceJSON = customResourceJSON.replace(/\$\{categoryName\}/, categoryName);
    customResourceJSON = customResourceJSON.replace(/\$\{resourceName\}/, resourceName);

    customResource = JSON.parse(customResourceJSON);

    const crudOptions = resourceOpsMapping[resourceName];

    if (customResource.policies) {
      crudOptions.forEach((crudOption: string) => {
        const policies = customResource.policies[crudOption].map((policy: any) => {
          if (!policy.Effect) {
            return {
              Effect: "Allow",
              Action: policy.Action,
              Resource: policy.Resource
            }
          }
          return policy;
        });

        for (const policy of policies) {
          if (!policy.Action || !policy.Resource) {
            printer.error(`Invalid policy in resources.json for ${categoryName}/${resourceName}.`);
          }

          permissionPolicies.push(policy);
        }
      });
    } else {
      printer.info(`No policies found for ${categoryName}/${resourceName}.`);
    }

    const attributes = customResource.attributes;

    if (attributes.length > 0) {
      resourceAttributes.push({
        resourceName,
        attributes,
        category: categoryName,
      });
    }
  });

  return { permissionPolicies, resourceAttributes };
}
