import { GraphQLAPIProvider } from '@aws-amplify/graphql-transformer-interfaces';
import { EventSourceMapping, IFunction, LayerVersion, Runtime, StartingPosition } from '@aws-cdk/aws-lambda';
import { CfnParameter, Construct, Fn, Stack } from '@aws-cdk/core';
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
  const { ElasticsearchStreamingLambdaFunctionLogicalID } = ResourceConstants.RESOURCES;
  const { ElasticsearchStreamingLambdaHandlerName, ElasticsearchDebugStreamingLambda } = ResourceConstants.PARAMETERS;
  const enviroment: { [key: string]: string } = {
    ES_ENDPOINT: 'https://' + endpoint,
    ES_REGION: region,
    DEBUG: parameterMap.get(ElasticsearchDebugStreamingLambda)!.valueAsString,
    ES_USE_EXTERNAL_VERSIONING: isProjectUsingDataStore.toString(),
  };

  return apiGraphql.addLambdaFunction(
    ElasticsearchStreamingLambdaFunctionLogicalID,
    'functions/' + ElasticsearchStreamingLambdaFunctionLogicalID + '.zip',
    parameterMap.get(ElasticsearchStreamingLambdaHandlerName)!.valueAsString,
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
    stack,
  );
};

export const createLambdaRole = (stack: Construct, parameterMap: Map<string, CfnParameter>): IRole => {
  const { ElasticsearchStreamingLambdaIAMRoleLogicalID } = ResourceConstants.RESOURCES;
  const { ElasticsearchStreamingIAMRoleName } = ResourceConstants.PARAMETERS;
  const role = new Role(stack, ElasticsearchStreamingLambdaIAMRoleLogicalID, {
    assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
    roleName: parameterMap.get(ElasticsearchStreamingIAMRoleName)?.valueAsString,
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
  tableStreamArn?: string,
): EventSourceMapping => {
  assert(tableStreamArn);
  return new EventSourceMapping(stack, SearchableResourceIDs.SearchableEventSourceMappingID(type), {
    eventSourceArn: tableStreamArn,
    target,
    batchSize: 1,
    enabled: true,
    startingPosition: StartingPosition.LATEST,
  });
};
