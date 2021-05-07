import { GraphQLAPIProvider } from '@aws-amplify/graphql-transformer-interfaces';
import { BaseDataSource } from '@aws-cdk/aws-appsync';
import { IRole } from '@aws-cdk/aws-iam';
import { ResourceConstants } from 'graphql-transformer-common';
import assert from 'assert';
import { Stack } from '@aws-cdk/core';

export const createEsDataSource = (
  stack: Stack,
  graphqlApiProvider: GraphQLAPIProvider,
  endpoint: string,
  role: IRole,
  region?: string,
): BaseDataSource => {
  const { ElasticsearchDataSourceLogicalID } = ResourceConstants.RESOURCES;
  assert(region);
  return graphqlApiProvider.addElasticSearchDataSource(
    ElasticsearchDataSourceLogicalID,
    region,
    endpoint,
    {
      serviceRole: role,
      name: ElasticsearchDataSourceLogicalID,
    },
    stack,
  );
};
