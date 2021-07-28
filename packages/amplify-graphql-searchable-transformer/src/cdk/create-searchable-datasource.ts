import { GraphQLAPIProvider } from '@aws-amplify/graphql-transformer-interfaces';
import { BaseDataSource } from '@aws-cdk/aws-appsync';
import { IRole } from '@aws-cdk/aws-iam';
import { ResourceConstants } from 'graphql-transformer-common';
import assert from 'assert';
import { Stack } from '@aws-cdk/core';

export const createSearchableDataSource = (
  stack: Stack,
  graphqlApiProvider: GraphQLAPIProvider,
  domainEndpoint: string,
  role: IRole,
  region?: string,
): BaseDataSource => {
  const { OpenSearchDataSourceLogicalID } = ResourceConstants.RESOURCES;
  assert(region);
  const dsEndpoint = 'https://' + domainEndpoint;
  return graphqlApiProvider.host.addSearchableDataSource(
    OpenSearchDataSourceLogicalID,
    region,
    dsEndpoint,
    {
      serviceRole: role,
      name: OpenSearchDataSourceLogicalID,
    },
    stack,
  );
};
