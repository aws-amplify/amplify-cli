import { Construct } from '@aws-cdk/core';
import { CfnOutput } from '@aws-cdk/core';
import { ResourceConstants } from 'graphql-transformer-common';

export const createStackOutputs = (stack: Construct, endpoint: string, apiId: string, arn: string): void => {
  const { ElasticsearchDomainArn, ElasticsearchDomainEndpoint } = ResourceConstants.OUTPUTS;
  new CfnOutput(stack, ElasticsearchDomainArn, {
    value: arn,
    description: 'Elasticsearch instance Domain ARN.',
    exportName: apiId + ':' + endpoint,
  });
  new CfnOutput(stack, ElasticsearchDomainEndpoint, {
    value: 'https://' + endpoint,
    description: 'Elasticsearch instance Domain Endpoint.',
    exportName: apiId + ':' + endpoint,
  });
};
