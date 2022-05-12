import { DeploymentResources as DeploymentResourcesV2 } from '@aws-amplify/graphql-transformer-core';
import { DeploymentResources as DeploymentResourcesV1 } from 'graphql-transformer-core';
import { $TSAny, $TSContext, ApiCategoryFacade } from 'amplify-cli-core';
import { transformGraphQLSchemaV1 } from './transform-graphql-schema-v1';
import { transformGraphQLSchemaV2 } from './transform-graphql-schema-v2';

/**
 * Determine which transformer version is in effect, and execute the appropriate transformation.
 */
export const transformGraphQLSchema = async (
  context: $TSContext,
  options: $TSAny,
): Promise<DeploymentResourcesV2 | DeploymentResourcesV1 | undefined> => {
  const transformerVersion = await ApiCategoryFacade.getTransformerVersion(context);
  return transformerVersion === 2
    ? transformGraphQLSchemaV2(context, options)
    : transformGraphQLSchemaV1(context, options);
};
