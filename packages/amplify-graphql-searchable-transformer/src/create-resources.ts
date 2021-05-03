import { Stack } from '@aws-cdk/core';
import { ResourceConstants } from 'graphql-transformer-common';
import { ElasticsearchDataSource } from './cdk/ElasticSearchDataSource';
import { IGraphqlApi } from '@aws-cdk/aws-appsync';
export function createResourcesInStack(stack: Stack, api: IGraphqlApi): void {
  const graphqlApi = stack.node.tryFindChild(ResourceConstants.RESOURCES.GraphQLAPILogicalID) as IGraphqlApi;

  const elasticSearchDataSource = new ElasticsearchDataSource(stack, ResourceConstants.RESOURCES.ElasticsearchDataSourceLogicalID, {
    api,
    endpoint: '',
    region: '',
  });
}
