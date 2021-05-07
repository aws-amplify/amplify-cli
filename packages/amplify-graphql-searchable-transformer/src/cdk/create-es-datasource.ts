import { GraphQLAPIProvider } from '@aws-amplify/graphql-transformer-interfaces';
import { BaseDataSource } from '@aws-cdk/aws-appsync';
import { IRole } from '@aws-cdk/aws-iam';
import { ResourceConstants } from 'graphql-transformer-common';
import assert from 'assert';
import { Stack } from '@aws-cdk/core';

export const createEsDataSource = (
  stack: Stack,
  graphqlApiProvider: GraphQLAPIProvider,
  domainEndpoint: string,
  role: IRole,
  region?: string,
): BaseDataSource => {
  const { ElasticsearchDataSourceLogicalID } = ResourceConstants.RESOURCES;
  assert(region);
  const dsEndpoint = 'https://' + domainEndpoint;
  return graphqlApiProvider.addElasticSearchDataSource(
    ElasticsearchDataSourceLogicalID,
    region,
    dsEndpoint,
    {
      serviceRole: role,
      name: ElasticsearchDataSourceLogicalID,
    },
    stack,
  );
};
