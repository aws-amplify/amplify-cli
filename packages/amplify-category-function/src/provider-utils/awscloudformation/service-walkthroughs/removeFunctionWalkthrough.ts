import { $TSAny, stateManager, getAmplifyResourceByCategories } from 'amplify-cli-core';
import inquirer from 'inquirer';
import _ from 'lodash';
import { categoryName } from '../../../constants';
import { ServiceName } from '../utils/constants';

export async function removeResource(resourceName?: string): Promise<$TSAny> {
  const enabledCategoryResources = getEnabledResources();

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

function getEnabledResources(): { name: string; value: { resourceName: string; isLambdaLayer: boolean } }[] {
  const amplifyMeta = stateManager.getMeta();
  return getAmplifyResourceByCategories(categoryName).map(resource => {
    const service = _.get(amplifyMeta, [categoryName, resource, 'service']);
    return {
      name: `${resource} ${service === ServiceName.LambdaLayer ? '(layer)' : '(function)'}`,
      value: { resourceName: resource, isLambdaLayer: service === ServiceName.LambdaLayer },
    };
  });
}
