import { ensureEnvParamManager } from '@aws-amplify/amplify-environment-parameters';
import { getGraphQLTransformerOpenSearchProductionDocLink, ApiCategoryFacade } from 'amplify-cli-core';
import { printer } from 'amplify-prompts';
import { ResourceConstants } from 'graphql-transformer-common';

/**
 * Sanity checks for searchable config
 */
export const searchablePushChecks = async (context, map, apiName): Promise<void> => {
  const searchableModelTypes = Object.keys(map).filter(type => map[type].includes('searchable') && map[type].includes('model'));
  if (searchableModelTypes.length) {
    const paramManager = (await ensureEnvParamManager()).instance.getResourceParamManager('api', apiName);
    const instanceType = paramManager.getParam(ResourceConstants.PARAMETERS.OpenSearchInstanceType)
      || paramManager.getParam(ResourceConstants.PARAMETERS.ElasticsearchInstanceType)
      || 't2.small.elasticsearch';
    if (instanceType === 't2.small.elasticsearch' || instanceType === 't3.small.elasticsearch') {
      const version = await ApiCategoryFacade.getTransformerVersion(context);
      const docLink = getGraphQLTransformerOpenSearchProductionDocLink(version);
      printer.warn(
        `Your instance type for OpenSearch is ${instanceType}, you may experience performance issues or data loss. Consider reconfiguring with the instructions here ${docLink}`,
      );
    }
  }
};
