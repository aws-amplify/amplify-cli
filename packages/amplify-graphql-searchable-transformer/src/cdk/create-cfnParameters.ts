import { ResourceConstants } from 'graphql-transformer-common';
import { CfnParameter, Stack } from '@aws-cdk/core';

export function createParametersStack(stack: Stack): Map<string, CfnParameter> {
  const {
    ElasticsearchAccessIAMRoleName,
    ElasticsearchStreamingLambdaHandlerName,
    ElasticsearchStreamingLambdaRuntime,
    ElasticsearchStreamingFunctionName,
    ElasticsearchStreamingIAMRoleName,
    ElasticsearchDebugStreamingLambda,
    ElasticsearchInstanceCount,
    ElasticsearchInstanceType,
    ElasticsearchEBSVolumeGB,
  } = ResourceConstants.PARAMETERS;
  return new Map<string, CfnParameter>([
    [
      ElasticsearchAccessIAMRoleName,
      new CfnParameter(stack, ElasticsearchAccessIAMRoleName, {
        description: 'The name of the IAM role assumed by AppSync for Elasticsearch.',
        default: 'AppSyncElasticsearchRole',
      }),
    ],

    [
      ElasticsearchStreamingLambdaHandlerName,
      new CfnParameter(stack, ElasticsearchStreamingLambdaHandlerName, {
        description: 'The name of the lambda handler.',
        default: 'python_streaming_function.lambda_handler',
      }),
    ],

    [
      ElasticsearchStreamingLambdaRuntime,
      new CfnParameter(stack, ElasticsearchStreamingLambdaRuntime, {
        description: `The lambda runtime \
                (https://docs.aws.amazon.com/lambda/latest/dg/API_CreateFunction.html#SSS-CreateFunction-request-Runtime)`,
        default: 'python3.6',
      }),
    ],

    [
      ElasticsearchStreamingFunctionName,
      new CfnParameter(stack, ElasticsearchStreamingFunctionName, {
        description: 'The name of the streaming lambda function.',
        default: 'DdbToEsFn',
      }),
    ],

    [
      ElasticsearchAccessIAMRoleName,
      new CfnParameter(stack, ElasticsearchStreamingIAMRoleName, {
        description: 'The name of the streaming lambda function IAM role.',
        default: 'SearchableLambdaIAMRole',
      }),
    ],

    [
      ElasticsearchDebugStreamingLambda,
      new CfnParameter(stack, ElasticsearchDebugStreamingLambda, {
        description: 'Enable debug logs for the Dynamo -> ES streaming lambda.',
        default: 1,
        type: 'Number',
        allowedValues: ['0', '1'],
      }),
    ],

    [
      ElasticsearchInstanceCount,
      new CfnParameter(stack, ElasticsearchInstanceCount, {
        description: 'The number of instances to launch into the Elasticsearch domain.',
        default: 1,
        type: 'Number',
      }),
    ],

    [
      ElasticsearchInstanceType,
      new CfnParameter(stack, ElasticsearchInstanceType, {
        description: 'The type of instance to launch into the Elasticsearch domain.',
        default: 't2.small.elasticsearch',
        allowedValues: [
          't2.small.elasticsearch',
          't2.medium.elasticsearch',
          'c4.large.elasticsearch',
          'c4.xlarge.elasticsearch',
          'c4.2xlarge.elasticsearch',
          'c4.4xlarge.elasticsearch',
          'c4.8xlarge.elasticsearch',
          'm3.medium.elasticsearch',
          'm3.large.elasticsearch',
          'm3.xlarge.elasticsearch',
          'm3.2xlarge.elasticsearch',
          'm4.large.elasticsearch',
          'm4.xlarge.elasticsearch',
          'm4.2xlarge.elasticsearch',
          'm4.4xlarge.elasticsearch',
          'm4.10xlarge.elasticsearch',
          'r3.large.elasticsearch',
          'r3.xlarge.elasticsearch',
          'r3.2xlarge.elasticsearch',
          'r3.4xlarge.elasticsearch',
          'r3.8xlarge.elasticsearch',
          'r4.large.elasticsearch',
          'r4.xlarge.elasticsearch',
          'r4.2xlarge.elasticsearch',
          'r4.4xlarge.elasticsearch',
          'r4.8xlarge.elasticsearch',
          'r4.16xlarge.elasticsearch',
          'i2.xlarge.elasticsearch',
          'i2.2xlarge.elasticsearch',
          'i3.large.elasticsearch',
          'i3.xlarge.elasticsearch',
          'i3.2xlarge.elasticsearch',
          'i3.4xlarge.elasticsearch',
          'i3.8xlarge.elasticsearch',
          'i3.16xlarge.elasticsearch',
        ],
      }),
    ],

    [
      ElasticsearchEBSVolumeGB,
      new CfnParameter(stack, ElasticsearchEBSVolumeGB, {
        description: 'The size in GB of the EBS volumes that contain our data.',
        default: 10,
        type: 'Number',
      }),
    ],
  ]);
}
