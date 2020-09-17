import { parseValue } from '../field-parser';
import { CloudFormationProcessedResourceResult } from '../stack/types';
import { CloudFormationParseContext } from '../types';

export function dynamoDBResourceHandler(resourceName, resource, cfnContext: CloudFormationParseContext) {
  const tableName = resourceName;
  const gsis = (resource.Properties.GlobalSecondaryIndexes || []).map(gsi => {
    const p = { ...gsi };
    delete p.ProvisionedThroughput;
    return p;
  });
  const processedResource: any = {
    cfnExposedAttributes: { Arn: 'Arn', StreamArn: 'StreamArn' },
    Arn: `arn:aws:dynamodb:us-east-2:123456789012:table/${tableName}`,
    Ref: tableName,
    StreamArn: `arn:aws:dynamodb:{aws-region}:{aws-account-number}:table/${tableName}/stream/${new Date().toISOString()}`,
    Properties: {
      TableName: tableName,
      BillingMode: 'PAY_PER_REQUEST',
      KeySchema: resource.Properties.KeySchema,
      AttributeDefinitions: resource.Properties.AttributeDefinitions,
    },
  };

  if (resource.Properties.LocalSecondaryIndexes) {
    processedResource.Properties.LocalSecondaryIndexes = resource.Properties.LocalSecondaryIndexes;
  }

  if (gsis.length) {
    processedResource.Properties.GlobalSecondaryIndexes = gsis;
  }
  return processedResource;
}

export type AppSyncDataSourceProcessedResource = CloudFormationProcessedResourceResult & {
  name: string;
  type: 'AMAZON_DYNAMODB' | 'AWS_LAMBDA' | 'NONE';
  LambdaFunctionArn?: string;
  config?: {
    tableName: string;
  };
};
export function appSyncDataSourceHandler(
  resourceName,
  resource,
  cfnContext: CloudFormationParseContext,
): AppSyncDataSourceProcessedResource {
  const tableName = resource.Properties.Name;
  const typeName = resource.Properties.Type;
  const commonProps = {
    cfnExposedAttributes: { DataSourceArn: 'Arn', Name: 'name' },
    Arn: `arn:aws:appsync:us-fake-1:123456789012:apis/graphqlapiid/datasources/${resource.Properties.Name}`,
  };
  if (typeName === 'AMAZON_DYNAMODB') {
    return {
      ...commonProps,
      name: tableName,
      type: 'AMAZON_DYNAMODB',
      config: {
        tableName,
      },
    };
  }
  if (typeName === 'NONE') {
    return {
      ...commonProps,
      name: resource.Properties.Name,
      type: 'NONE',
    };
  }

  if (typeName === 'AWS_LAMBDA') {
    const lambdaArn = parseValue(resource.Properties.LambdaConfig.LambdaFunctionArn, cfnContext);
    return {
      ...commonProps,
      type: 'AWS_LAMBDA',
      name: resource.Properties.Name,
      LambdaFunctionArn: lambdaArn,
    };
  }

  console.log(`Data source of type ${typeName} is not supported by local mocking. A NONE data source will be used.`);
  return {
    ...commonProps,
    name: resourceName,
    type: 'NONE',
  };
}

export type AppSyncAPIProcessedResource = CloudFormationProcessedResourceResult & {
  name: string;
  Ref: string;
  Arn: string;
  defaultAuthenticationType: any;
  ApiId: string;
  GraphQLUrl: string;
  additionalAuthenticationProviders: any;
};
export function appSyncAPIResourceHandler(resourceName, resource, cfnContext: CloudFormationParseContext): AppSyncAPIProcessedResource {
  const apiId = 'amplify-test-api-id';
  const processedResource = {
    cfnExposedAttributes: { ApiId: 'ApiId', Arn: 'Arn', GraphQLUrl: 'GraphQLUrl' },
    name: cfnContext.params.AppSyncApiName || 'AppSyncTransformer',
    defaultAuthenticationType: {
      authenticationType: resource.Properties.AuthenticationType,
      ...(resource.Properties.OpenIDConnectConfig ? { openIDConnectConfig: resource.Properties.OpenIDConnectConfig } : {}),
      ...(resource.Properties.UserPoolConfig ? { cognitoUserPoolConfig: resource.Properties.UserPoolConfig } : {}),
    },
    Ref: `arn:aws:appsync:us-east-1:123456789012:apis/${apiId}`,
    Arn: `arn:aws:appsync:us-east-1:123456789012:apis/${apiId}`,
    ApiId: apiId,
    GraphQLUrl: 'http://localhost:20002/',
    ...(resource.Properties.AdditionalAuthenticationProviders
      ? {
          additionalAuthenticationProviders: resource.Properties.AdditionalAuthenticationProviders.map(p => {
            return {
              authenticationType: p.AuthenticationType,
              ...(p.OpenIDConnectConfig ? { openIDConnectConfig: p.OpenIDConnectConfig } : {}),
              ...(p.CognitoUserPoolConfig ? { cognitoUserPoolConfig: p.CognitoUserPoolConfig } : {}),
            };
          }),
        }
      : {
          additionalAuthenticationProviders: [],
        }),
  };
  return processedResource;
}

export type AppSyncAPIKeyProcessedResource = CloudFormationProcessedResourceResult & {
  ApiKey: string;
  Ref: string;
};
export function appSyncAPIKeyResourceHandler(
  resourceName,
  resource,
  cfnContext: CloudFormationParseContext,
): AppSyncAPIKeyProcessedResource {
  const value = 'da2-fakeApiId123456'; // TODO: Generate
  const arn = `arn:aws:appsync:us-east-1:123456789012:apis/graphqlapiid/apikey/apikeya1bzhi${value}`;
  const processedResource = {
    cfnExposedAttributes: { ApiKey: 'ApiKey', Arn: 'ref' },
    ApiKey: value,
    Ref: arn,
    Arn: arn,
  };
  return processedResource;
}

export type AppSyncSchemaProcessedResource = CloudFormationProcessedResourceResult & {
  definitionS3Location?: string;
  definition?: string;
};
export function appSyncSchemaHandler(resourceName, resource, cfnContext: CloudFormationParseContext): AppSyncSchemaProcessedResource {
  const result: AppSyncSchemaProcessedResource = { cfnExposedAttributes: {} };
  if (resource && resource.Properties && resource.Properties.Definition) {
    result.definition = parseValue(resource.Properties.Definition, cfnContext);
  } else if (resource && resource.Properties && resource.Properties.DefinitionS3Location) {
    result.definitionS3Location = parseValue(resource.Properties.DefinitionS3Location, cfnContext);
  } else {
    throw new Error(
      'Invalid configuration for AWS::AppSync::GraphQLSchema. Missing one of the required property (DefinitionS3Location or Definition)',
    );
  }
  return result;
}

export type AppSyncResolverProcessedResource = CloudFormationProcessedResourceResult & {
  dataSourceName?: string;
  functions: string[];
  typeName: string;
  fieldName: string;
  requestMappingTemplateLocation?: string;
  responseMappingTemplateLocation?: string;
  requestMappingTemplate?: string;
  responseMappingTemplate?: string;
  ResolverArn: string;
  kind: 'UNIT' | 'PIPELINE';
};

export function appSyncResolverHandler(resourceName, resource, cfnContext: CloudFormationParseContext): AppSyncResolverProcessedResource {
  const { Properties: properties } = resource;
  const requestMappingTemplateLocation = properties.RequestMappingTemplateS3Location
    ? parseValue(properties.RequestMappingTemplateS3Location, cfnContext)
    : undefined;
  const responseMappingTemplateLocation = properties.ResponseMappingTemplateS3Location
    ? parseValue(properties.ResponseMappingTemplateS3Location, cfnContext)
    : undefined;
  const requestMappingTemplate = properties.RequestMappingTemplate ? parseValue(properties.RequestMappingTemplate, cfnContext) : undefined;
  const responseMappingTemplate = properties.ResponseMappingTemplate
    ? parseValue(properties.ResponseMappingTemplate, cfnContext)
    : undefined;

  let dataSourceName;
  let functions;

  if (properties.Kind === 'PIPELINE') {
    if (typeof properties.PipelineConfig === 'undefined') {
      throw new Error('Pipeline DataSource config is missing required property PipelineConfig');
    }
    functions = (properties.PipelineConfig.Functions || []).map(f => parseValue(f, cfnContext));
  } else {
    dataSourceName = parseValue(properties.DataSourceName, cfnContext);
  }

  return {
    cfnExposedAttributes: { FieldName: 'fieldName', ResolverArn: 'ResolverArn', TypeName: 'typeName' },
    dataSourceName,
    typeName: properties.TypeName,
    functions,
    fieldName: properties.FieldName,
    requestMappingTemplateLocation: requestMappingTemplateLocation,
    responseMappingTemplateLocation: responseMappingTemplateLocation,
    requestMappingTemplate,
    responseMappingTemplate,
    kind: properties.Kind || 'UNIT',
    ResolverArn: `arn:aws:appsync:us-east-1:123456789012:apis/graphqlapiid/types/${properties.TypeName}/resolvers/${properties.FieldName}`,
  };
}

export type AppSyncFunctionProcessedResource = CloudFormationProcessedResourceResult & {
  dataSourceName: string;
  ref: string;
  name: string;
  requestMappingTemplateLocation?: string;
  responseMappingTemplateLocation?: string;
  requestMappingTemplate?: string;
  responseMappingTemplate?: string;
};

export function appSyncFunctionHandler(resourceName, resource, cfnContext: CloudFormationParseContext): AppSyncFunctionProcessedResource {
  const { Properties: properties } = resource;
  const requestMappingTemplateLocation = properties.RequestMappingTemplateS3Location
    ? parseValue(properties.RequestMappingTemplateS3Location, cfnContext)
    : undefined;
  const responseMappingTemplateLocation = properties.ResponseMappingTemplateS3Location
    ? parseValue(properties.ResponseMappingTemplateS3Location, cfnContext)
    : undefined;
  const requestMappingTemplate = properties.RequestMappingTemplate ? parseValue(properties.RequestMappingTemplate, cfnContext) : undefined;
  const responseMappingTemplate = properties.ResponseMappingTemplate
    ? parseValue(properties.ResponseMappingTemplate, cfnContext)
    : undefined;

  const dataSourceName = parseValue(properties.DataSourceName, cfnContext);
  return {
    ref: `arn:aws:appsync:us-east-1:123456789012:apis/graphqlapiid/functions/${resource.Properties.Name}`,
    cfnExposedAttributes: { DataSourceName: 'dataSourceName', FunctionArn: 'Ref', FunctionId: 'name', Name: 'name' },
    name: resource.Properties.Name,
    dataSourceName,
    requestMappingTemplateLocation: requestMappingTemplateLocation,
    responseMappingTemplateLocation: responseMappingTemplateLocation,
    requestMappingTemplate,
    responseMappingTemplate,
  };
}
