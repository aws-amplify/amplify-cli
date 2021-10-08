import { GraphQLAPIProvider, TransformerContextProvider } from '@aws-amplify/graphql-transformer-interfaces';
import { EventSourceMapping, IFunction, LayerVersion, Runtime, StartingPosition } from '@aws-cdk/aws-lambda';
import { CfnParameter, Construct, Fn, Stack, Duration } from '@aws-cdk/core';
import { Effect, IRole, Policy, PolicyStatement, Role, ServicePrincipal } from '@aws-cdk/aws-iam';
import { ResourceConstants, SearchableResourceIDs } from 'graphql-transformer-common';
import * as path from 'path';
import assert from 'assert';

export const createLambda = (
  stack: Stack,
  apiGraphql: GraphQLAPIProvider,
  parameterMap: Map<string, CfnParameter>,
  lambdaRole: IRole,
  endpoint: string,
  isProjectUsingDataStore: boolean,
  region?: string,
): IFunction => {
  assert(region);
  const { OpenSearchStreamingLambdaFunctionLogicalID } = ResourceConstants.RESOURCES;
  const { OpenSearchStreamingLambdaHandlerName, OpenSearchDebugStreamingLambda } = ResourceConstants.PARAMETERS;
  const enviroment: { [key: string]: string } = {
    OPENSEARCH_ENDPOINT: 'https://' + endpoint,
    OPENSEARCH_REGION: region,
    DEBUG: parameterMap.get(OpenSearchDebugStreamingLambda)!.valueAsString,
    OPENSEARCH_USE_EXTERNAL_VERSIONING: isProjectUsingDataStore.toString(),
  };

  return apiGraphql.host.addLambdaFunction(
    OpenSearchStreamingLambdaFunctionLogicalID,
    'functions/' + OpenSearchStreamingLambdaFunctionLogicalID + '.zip',
    parameterMap.get(OpenSearchStreamingLambdaHandlerName)!.valueAsString,
    path.resolve(__dirname, '..', '..', 'lib', 'streaming-lambda.zip'),
    Runtime.PYTHON_3_6,
    [
      LayerVersion.fromLayerVersionArn(
        stack,
        'LambdaLayerVersion',
        Fn.findInMap('LayerResourceMapping', Fn.ref('AWS::Region'), 'layerRegion'),
      ),
    ],
    lambdaRole,
    enviroment,
    undefined,
    stack,
  );
};

export const createLambdaRole = (context: TransformerContextProvider, stack: Construct, parameterMap: Map<string, CfnParameter>): IRole => {
  const { OpenSearchStreamingLambdaIAMRoleLogicalID } = ResourceConstants.RESOURCES;
  const { OpenSearchStreamingIAMRoleName } = ResourceConstants.PARAMETERS;
  const role = new Role(stack, OpenSearchStreamingLambdaIAMRoleLogicalID, {
    assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
    roleName: context.resourceHelper.generateIAMRoleName(parameterMap.get(OpenSearchStreamingIAMRoleName)?.valueAsString ?? ''),
  });
  role.attachInlinePolicy(
    new Policy(stack, 'CloudwatchLogsAccess', {
      statements: [
        new PolicyStatement({
          actions: ['logs:CreateLogGroup', 'logs:CreateLogStream', 'logs:PutLogEvents'],
          effect: Effect.ALLOW,
          resources: ['arn:aws:logs:*:*:*'],
        }),
      ],
    }),
  );

  return role;
};

export const createEventSourceMapping = (
  stack: Construct,
  type: string,
  target: IFunction,
  parameterMap: Map<string, CfnParameter>,
  tableStreamArn?: string,
): EventSourceMapping => {
  const { OpenSearchStreamBatchSize, OpenSearchStreamMaximumBatchingWindowInSeconds } = ResourceConstants.PARAMETERS;
  assert(tableStreamArn);
  return new EventSourceMapping(stack, SearchableResourceIDs.SearchableEventSourceMappingID(type), {
    eventSourceArn: tableStreamArn,
    target,
    batchSize: parameterMap.get(OpenSearchStreamBatchSize)!.valueAsNumber,
    maxBatchingWindow: Duration.seconds(parameterMap.get(OpenSearchStreamMaximumBatchingWindowInSeconds)!.valueAsNumber),
    enabled: true,
    startingPosition: StartingPosition.LATEST,
  });
};
