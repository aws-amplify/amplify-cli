import { ResourceConstants } from 'graphql-transformer-common';
import { CfnParameter, Stack } from '@aws-cdk/core';

export function createParametersStack(stack: Stack): Map<string, CfnParameter> {
  const {
    OpenSearchAccessIAMRoleName,
    OpenSearchStreamingLambdaHandlerName,
    OpenSearchStreamingLambdaRuntime,
    OpenSearchStreamingFunctionName,
    OpenSearchStreamBatchSize,
    OpenSearchStreamMaximumBatchingWindowInSeconds,
    OpenSearchStreamingIAMRoleName,
    OpenSearchDebugStreamingLambda,
    OpenSearchInstanceCount,
    OpenSearchInstanceType,
    OpenSearchEBSVolumeGB,
  } = ResourceConstants.PARAMETERS;

  return new Map<string, CfnParameter>([
    [
      OpenSearchAccessIAMRoleName,
      new CfnParameter(stack, OpenSearchAccessIAMRoleName, {
        description: 'The name of the IAM role assumed by AppSync for OpenSearch.',
        default: 'AppSyncOpenSearchRole',
      }),
    ],

    [
      OpenSearchStreamingLambdaHandlerName,
      new CfnParameter(stack, OpenSearchStreamingLambdaHandlerName, {
        description: 'The name of the lambda handler.',
        default: 'python_streaming_function.lambda_handler',
      }),
    ],

    [
      OpenSearchStreamingLambdaRuntime,
      new CfnParameter(stack, OpenSearchStreamingLambdaRuntime, {
        description: `The lambda runtime \
                (https://docs.aws.amazon.com/lambda/latest/dg/API_CreateFunction.html#SSS-CreateFunction-request-Runtime)`,
        default: 'python3.6',
      }),
    ],

    [
      OpenSearchStreamingFunctionName,
      new CfnParameter(stack, OpenSearchStreamingFunctionName, {
        description: 'The name of the streaming lambda function.',
        default: 'DdbToEsFn',
      }),
    ],

    [
      OpenSearchStreamBatchSize,
      new CfnParameter(stack, OpenSearchStreamBatchSize, {
        description: 'The maximum number of records to stream to OpenSearch per batch.',
        type: 'Number',
        default: 100,
      }),
    ],

    [
      OpenSearchStreamMaximumBatchingWindowInSeconds,
      new CfnParameter(stack, OpenSearchStreamMaximumBatchingWindowInSeconds, {
        description: 'The maximum amount of time in seconds to wait for DynamoDB stream records before sending to streaming lambda.',
        type: 'Number',
        default: 1,
      }),
    ],

    [
      OpenSearchAccessIAMRoleName,
      new CfnParameter(stack, OpenSearchStreamingIAMRoleName, {
        description: 'The name of the streaming lambda function IAM role.',
        default: 'SearchableLambdaIAMRole',
      }),
    ],

    [
      OpenSearchDebugStreamingLambda,
      new CfnParameter(stack, OpenSearchDebugStreamingLambda, {
        description: 'Enable debug logs for the Dynamo -> OpenSearch streaming lambda.',
        default: 1,
        type: 'Number',
        allowedValues: ['0', '1'],
      }),
    ],

    [
      OpenSearchInstanceCount,
      new CfnParameter(stack, OpenSearchInstanceCount, {
        description: 'The number of instances to launch into the OpenSearch domain.',
        default: 1,
        type: 'Number',
      }),
    ],

    [
      OpenSearchInstanceType,
      new CfnParameter(stack, OpenSearchInstanceType, {
        description: 'The type of instance to launch into the OpenSearch domain.',
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
          'r6gd.12xlarge.elasticsearch',
          'ultrawarm1.xlarge.elasticsearch',
          'm5.4xlarge.elasticsearch',
          't3.xlarge.elasticsearch',
          'm6g.xlarge.elasticsearch',
          'm6g.12xlarge.elasticsearch',
          't2.micro.elasticsearch',
          'r6gd.16xlarge.elasticsearch',
          'd2.2xlarge.elasticsearch',
          't3.micro.elasticsearch',
          'm5.large.elasticsearch',
          'd2.4xlarge.elasticsearch',
          't3.small.elasticsearch',
          'c5.2xlarge.elasticsearch',
          'c6g.2xlarge.elasticsearch',
          'd2.8xlarge.elasticsearch',
          'c5.4xlarge.elasticsearch',
          't4g.medium.elasticsearch',
          'c6g.4xlarge.elasticsearch',
          'c6g.xlarge.elasticsearch',
          'c6g.12xlarge.elasticsearch',
        ],
      }),
    ],

    [
      OpenSearchEBSVolumeGB,
      new CfnParameter(stack, OpenSearchEBSVolumeGB, {
        description: 'The size in GB of the EBS volumes that contain our data.',
        default: 10,
        type: 'Number',
      }),
    ],
  ]);
}
