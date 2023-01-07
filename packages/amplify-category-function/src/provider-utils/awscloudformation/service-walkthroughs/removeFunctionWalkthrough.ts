import { $TSAny, stateManager, getAmplifyResourceByCategories } from 'amplify-cli-core';
import _ from 'lodash';
import { categoryName } from '../../../constants';
import { ServiceName } from '../utils/constants';
import { prompter } from 'amplify-prompts';

export async function removeResource(resourceName?: string): Promise<$TSAny> {
  const enabledCategoryResources = getEnabledResources();

  if (enabledCategoryResources.length === 0) {
    throw new Error('No Lambda function resource to remove. Use "amplify add function" to create a new function.');
  }

  if (resourceName) {
    const resource = enabledCategoryResources.find(categoryResource => categoryResource.value.resourceName === resourceName);
    return resource.value;
  }

  return prompter.pick<'one', string>(
    'Choose the resource you would want to remove',
    enabledCategoryResources.map(resource => resource.name),
  );
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
