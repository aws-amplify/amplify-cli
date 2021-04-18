import { stateManager } from 'amplify-cli-core';
import inquirer from 'inquirer';
const category = 'function';
import _ from 'lodash';
import { ServiceName } from '../utils/constants';

export async function removeResource(resourceName?: string): Promise<any> {
  const amplifyMeta = stateManager.getMeta();
  const enabledCategoryResources: { name; value } | { name; value }[] | string[] = Object.keys(amplifyMeta[category])
    .filter(r => amplifyMeta[category][r].mobileHubMigrated !== true)
    .map(resource => {
      const service = _.get(amplifyMeta, [category, resource, 'service']);
      return {
        name: `${resource} ${service === ServiceName.LambdaLayer ? '(layer)' : '(function)'}`,
        value: { resourceName: resource, isLambdaLayer: service === ServiceName.LambdaLayer },
      };
    });

  if (resourceName) {
    const resource = enabledCategoryResources.find(categoryResource => categoryResource.value.resourceName === resourceName);
    return resource.value;
  }

  const question = [
    {
      name: 'resource',
      message: 'Choose the resource you would want to remove',
      type: 'list',
      choices: enabledCategoryResources,
    },
  ];
  const answer = await inquirer.prompt(question);

  return answer.resource;
}
