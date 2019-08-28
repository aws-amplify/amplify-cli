import { CloudFormationParseContext } from './types';
import { isPlainObject } from 'lodash';
import { parseValue } from './field-parser';
import { AmplifyAppSyncSimulatorConfig } from 'amplify-appsync-simulator';
const CFN_DEFAULT_PARAMS = {
  'AWS::Region': 'us-east-1-fake',
  'AWS::AccountId': '12345678910',
  'AWS::StackId': 'fake-stackId',
  'AWS::StackName': 'local-testing',
};

const CFN_DEFAULT_CONDITIONS = {
  HasEnvironmentParameter: true,
};
const resourceProcessorMapping = {
  'AWS::AppSync::GraphQLApi': graphQLAPIResourceHandler,
  'AWS::AppSync::ApiKey': graphQLAPIKeyResourceHandler,
  'AWS::AppSync::GraphQLSchema': graphQLSchemaHandler,
  'AWS::DynamoDB::Table': dynamoDBResourceHandler,
  'AWS::AppSync::Resolver': graphQLResolverHandler,
  'AWS::AppSync::DataSource': graphQLDataSource,
  'AWS::AppSync::FunctionConfiguration': graphqlFunctionHandler,
};
export function dynamoDBResourceHandler(
  resourceName,
  resource,
  cfnContext: CloudFormationParseContext,
  transformResult: any
) {
  const tableName = resourceName;
  const gsis = (resource.Properties.GlobalSecondaryIndexes || []).map(gsi => {
    const p = { ...gsi };
    delete p.ProvisionedThroughput;
    return p;
  });
  const processedResource: any = {
    Type: 'AWS::DynamoDB::Table',
    Properties: {
      TableName: tableName,
      BillingMode: 'PAY_PER_REQUEST',
      KeySchema: resource.Properties.KeySchema,
      AttributeDefinitions: resource.Properties.AttributeDefinitions,
    },
  };
  if (gsis.length) {
    processedResource.Properties.GlobalSecondaryIndexes = gsis;
  }
  return processedResource;
}

export function graphQLDataSource(
  resourceName,
  resource,
  cfnContext: CloudFormationParseContext,
  transformResult: any
) {
  const tableName = resource.Properties.Name;
  const typeName = resource.Properties.Type;
  if (typeName === 'AMAZON_DYNAMODB') {
    return {
      name: tableName,
      type: 'AMAZON_DYNAMODB',
      config: {
        tableName,
      },
    };
  }
  if (typeName === 'NONE') {
    return {
      name: resource.Properties.Name,
      type: 'NONE',
    };
  }

  if (typeName === 'AWS_LAMBDA') {
    const lambdaArn = parseValue(resource.Properties.LambdaConfig.LambdaFunctionArn, cfnContext);
    return {
      type: 'AWS_LAMBDA',
      name: resource.Properties.Name,
      LambdaFunctionArn: lambdaArn,
    };
  }

  // XXX: Handle un-supported data sources
  console.log(
    `Data source of type ${typeName} is not supported by local mocking. A NONE data source will be used.`
  );
  return {
    name: resourceName,
    type: 'NONE',
  };
}

export function graphQLAPIResourceHandler(
  resourceName,
  resource,
  cfnContext: CloudFormationParseContext,
  transformResult: any
) {
  const apiId = 'amplify-test-api-id';
  const processedResource = {
    type: resource.Type,
    name: cfnContext.params.AppSyncApiName || 'AppSyncTransformer',
    authenticationType: resource.Properties.AuthenticationType,
    // authenticationType: parseValue(resource.Properties.AuthenticationType, cfnContext,  transformResult: any),
    ref: `arn:aws:appsync:us-east-1:123456789012:apis/${apiId}`,
  };
  return processedResource;
}

export function graphQLAPIKeyResourceHandler(
  resourceName,
  resource,
  cfnContext: CloudFormationParseContext,
  transformResult: any
) {
  const value = 'da2-fakeApiId123456'; // TODO: Generate
  const processedResource = {
    type: resource.Type,
    // apiId: parseValue(resource.Properties.ApiId, cfnContext),
    value,
    ref: `arn:aws:appsync:us-east-1:123456789012:apis/graphqlapiid/apikey/apikeya1bzhi${value}`,
  };
  return processedResource;
}

export function graphQLSchemaHandler(
  resourceName,
  resource,
  cfnContext: CloudFormationParseContext,
  transformResult: any
) {
  return {
    content: transformResult.schema,
    path: 'schema.json', // XXX: handle schema folder
  };
}

export function graphQLResolverHandler(
  resourceName,
  resource,
  cfnContext: CloudFormationParseContext,
  transformResult: any
) {
  const { Properties: properties } = resource;
  const requestMappingTemplate =
    'resolvers/' + [properties.TypeName, properties.FieldName, 'req.vtl'].join('.');
  const responseMappingTemplate =
    'resolvers/' + [properties.TypeName, properties.FieldName, 'res.vtl'].join('.');
  let dataSourceName;
  let functions;
  if (properties.Kind === 'PIPELINE') {
    functions = (properties.PipelineConfig.Functions || []).map(f => getAppSyncFunctionName(f));
  } else {
    dataSourceName = getDataSourceName(properties.DataSourceName, cfnContext.resources);
  }

  return {
    dataSourceName,
    typeName: properties.TypeName,
    functions,
    fieldName: properties.FieldName,
    requestMappingTemplateLocation: requestMappingTemplate,
    responseMappingTemplateLocation: responseMappingTemplate,
    kind: properties.Kind || 'UNIT',
  };
}

function getDataSourceName(dataSourceName, resources) {
  // XXX: Util to map data source based on type of intrinsic function
  let processedDataSourceName;
  if (typeof dataSourceName === 'string') {
    return dataSourceName;
  }

  if (isPlainObject(dataSourceName) && Object.keys(dataSourceName).length === 1) {
    const intrinsicFn = Object.keys(dataSourceName)[0];
    if (intrinsicFn === 'Fn::GetAtt') {
      processedDataSourceName = dataSourceName[intrinsicFn][0];
    }
  } else if (dataSourceName.name === 'Fn::ImportValue') {
    processedDataSourceName = dataSourceName.payload.payload[1][2];
  }
  return resources[processedDataSourceName].name;
}

function getAppSyncFunctionName(functionConfig) {
  if (functionConfig['Fn::GetAtt']) {
    return functionConfig['Fn::GetAtt'][0];
  }
  return functionConfig;
}

export function graphqlFunctionHandler(
  resourceName,
  resource,
  cfnContext: CloudFormationParseContext,
  transformResult: any
) {
  const { Properties: properties } = resource;
  const requestMappingTemplate = parseValue(
    properties.RequestMappingTemplateS3Location,
    cfnContext
  ).replace('s3://${S3DeploymentBucket}/${S3DeploymentRootKey}/', '');
  const responseMappingTemplate = parseValue(
    properties.ResponseMappingTemplateS3Location,
    cfnContext
  ).replace('s3://${S3DeploymentBucket}/${S3DeploymentRootKey}/', '');

  const dataSourceName = getDataSourceName(properties.DataSourceName, cfnContext.resources);

  return {
    name: resource.Properties.Name,
    dataSourceName,
    requestMappingTemplateLocation: requestMappingTemplate,
    responseMappingTemplateLocation: responseMappingTemplate,
  };
}

export function processResources(
  resources,
  transformResult: any,
  params = {}
): AmplifyAppSyncSimulatorConfig {
  const cfnContext: CloudFormationParseContext = {
    conditions: {
      ...CFN_DEFAULT_CONDITIONS,
    },
    params: {
      ...CFN_DEFAULT_PARAMS,
      env: '${env}',
      S3DeploymentBucket: '${S3DeploymentBucket}',
      S3DeploymentRootKey: '${S3DeploymentRootKey}',
      ...params,
    },
    resources: {},
    exports: {},
  };
  const processedResources = {
    schema: {},
    resolvers: [],
    functions: [],
    dataSources: [],
    mappingTemplates: [],
    tables: [],
    appSync: {
      name: '',
      authenticationType: '',
      apiKey: null,
    },
  };
  Object.entries(resources).forEach(entry => {
    const [resourceName, resource] = entry;
    const { Type: resourceType } = resource as any;
    if (Object.keys(resourceProcessorMapping).includes(resourceType)) {
      const result = resourceProcessorMapping[resourceType](
        resourceName,
        resource,
        cfnContext,
        transformResult
      );
      cfnContext.resources[resourceName] = result;

      switch (resourceType) {
        case 'AWS::AppSync::DataSource':
          processedResources.dataSources.push(result);
          break;
        case 'AWS::AppSync::Resolver':
          processedResources.resolvers.push(result);
          break;
        case 'AWS::DynamoDB::Table':
          processedResources.tables.push(result);
          break;
        case 'AWS::AppSync::FunctionConfiguration':
          processedResources.functions.push(result);
          break;
        case 'AWS::AppSync::GraphQLSchema':
          processedResources.schema = result;
          break;
        case 'AWS::AppSync::GraphQLApi':
          processedResources.appSync.name = result.name;
          processedResources.appSync.authenticationType = result.authenticationType;
          break;
        case 'AWS::AppSync::ApiKey':
          processedResources.appSync.apiKey = result.value;
          break;
      }
    }
  });
  Object.entries(transformResult.resolvers).forEach(([path, content]) => {
    processedResources.mappingTemplates.push({
      path: `resolvers/${path}`,
      content,
    });
  });
  Object.entries(transformResult.pipelineFunctions).forEach(([path, content]) => {
    processedResources.mappingTemplates.push({
      path: `pipelineFunctions/${path}`,
      content,
    });
  });

  return processedResources;
}
