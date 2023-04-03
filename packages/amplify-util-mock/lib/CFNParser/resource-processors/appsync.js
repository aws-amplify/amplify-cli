"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.appSyncFunctionHandler = exports.appSyncResolverHandler = exports.appSyncSchemaHandler = exports.appSyncAPIKeyResourceHandler = exports.appSyncAPIResourceHandler = exports.appSyncDataSourceHandler = exports.dynamoDBResourceHandler = void 0;
const field_parser_1 = require("../field-parser");
const amplify_cli_core_1 = require("amplify-cli-core");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
function dynamoDBResourceHandler(resourceName, resource) {
    var _a, _b;
    const tableName = resourceName;
    const gsis = (resource.Properties.GlobalSecondaryIndexes || []).map((gsi) => {
        const p = { ...gsi };
        delete p.ProvisionedThroughput;
        return p;
    });
    const processedResource = {
        cfnExposedAttributes: { Arn: 'Arn', StreamArn: 'StreamArn' },
        Arn: `arn:aws:dynamodb:us-east-2:123456789012:table/${tableName}`,
        Ref: tableName,
        StreamArn: `arn:aws:dynamodb:{aws-region}:{aws-account-number}:table/${tableName}/stream/${new Date().toISOString()}`,
        Properties: {
            TableName: tableName,
            BillingMode: 'PAY_PER_REQUEST',
            KeySchema: resource.Properties.KeySchema,
            AttributeDefinitions: resource.Properties.AttributeDefinitions,
            StreamSpecification: {
                StreamEnabled: true,
                StreamViewType: ((_b = (_a = resource === null || resource === void 0 ? void 0 : resource.Properties) === null || _a === void 0 ? void 0 : _a.StreamSpecification) === null || _b === void 0 ? void 0 : _b.StreamViewType) || 'NEW_AND_OLD_IMAGES',
            },
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
exports.dynamoDBResourceHandler = dynamoDBResourceHandler;
function appSyncDataSourceHandler(resourceName, resource, cfnContext) {
    var _a, _b, _c;
    const tableName = ((_c = (_b = (_a = resource.Properties) === null || _a === void 0 ? void 0 : _a.DynamoDBConfig) === null || _b === void 0 ? void 0 : _b.TableName) === null || _c === void 0 ? void 0 : _c.Ref) || resource.Properties.Name;
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
        const lambdaArn = (0, field_parser_1.parseValue)(resource.Properties.LambdaConfig.LambdaFunctionArn, cfnContext);
        return {
            ...commonProps,
            type: 'AWS_LAMBDA',
            name: resource.Properties.Name,
            LambdaFunctionArn: lambdaArn,
        };
    }
    if (typeName === 'AMAZON_ELASTICSEARCH') {
        if ((0, amplify_cli_core_1.isWindowsPlatform)()) {
            amplify_prompts_1.printer.info(`@searchable mocking is not supported on Windows. Search queries against the mock API will not work.`);
        }
        return {
            ...commonProps,
            type: 'AMAZON_ELASTICSEARCH',
            name: resource.Properties.Name,
        };
    }
    console.log(`Data source of type ${typeName} is not supported by local mocking. A NONE data source will be used.`);
    return {
        ...commonProps,
        name: resourceName,
        type: 'NONE',
    };
}
exports.appSyncDataSourceHandler = appSyncDataSourceHandler;
function appSyncAPIResourceHandler(resourceName, resource, cfnContext) {
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
                additionalAuthenticationProviders: resource.Properties.AdditionalAuthenticationProviders.map((p) => {
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
exports.appSyncAPIResourceHandler = appSyncAPIResourceHandler;
function appSyncAPIKeyResourceHandler() {
    const value = 'da2-fakeApiId123456';
    const arn = `arn:aws:appsync:us-east-1:123456789012:apis/graphqlapiid/apikey/apikeya1bzhi${value}`;
    const processedResource = {
        cfnExposedAttributes: { ApiKey: 'ApiKey', Arn: 'ref' },
        ApiKey: value,
        Ref: arn,
        Arn: arn,
    };
    return processedResource;
}
exports.appSyncAPIKeyResourceHandler = appSyncAPIKeyResourceHandler;
function appSyncSchemaHandler(resourceName, resource, cfnContext) {
    const result = { cfnExposedAttributes: {} };
    if (resource && resource.Properties && resource.Properties.Definition) {
        result.definition = (0, field_parser_1.parseValue)(resource.Properties.Definition, cfnContext);
    }
    else if (resource && resource.Properties && resource.Properties.DefinitionS3Location) {
        result.definitionS3Location = (0, field_parser_1.parseValue)(resource.Properties.DefinitionS3Location, cfnContext);
    }
    else {
        throw new Error('Invalid configuration for AWS::AppSync::GraphQLSchema. Missing one of the required property (DefinitionS3Location or Definition)');
    }
    return result;
}
exports.appSyncSchemaHandler = appSyncSchemaHandler;
function appSyncResolverHandler(resourceName, resource, cfnContext) {
    const { Properties: properties } = resource;
    const requestMappingTemplateLocation = properties.RequestMappingTemplateS3Location
        ? (0, field_parser_1.parseValue)(properties.RequestMappingTemplateS3Location, cfnContext)
        : undefined;
    const responseMappingTemplateLocation = properties.ResponseMappingTemplateS3Location
        ? (0, field_parser_1.parseValue)(properties.ResponseMappingTemplateS3Location, cfnContext)
        : undefined;
    const requestMappingTemplate = properties.RequestMappingTemplate ? (0, field_parser_1.parseValue)(properties.RequestMappingTemplate, cfnContext) : undefined;
    const responseMappingTemplate = properties.ResponseMappingTemplate
        ? (0, field_parser_1.parseValue)(properties.ResponseMappingTemplate, cfnContext)
        : undefined;
    let dataSourceName;
    let functions;
    if (properties.Kind === 'PIPELINE') {
        if (typeof properties.PipelineConfig === 'undefined') {
            throw new Error('Pipeline DataSource config is missing required property PipelineConfig');
        }
        functions = (properties.PipelineConfig.Functions || []).map((f) => (0, field_parser_1.parseValue)(f, cfnContext));
    }
    else {
        dataSourceName = (0, field_parser_1.parseValue)(properties.DataSourceName, cfnContext);
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
exports.appSyncResolverHandler = appSyncResolverHandler;
function appSyncFunctionHandler(resourceName, resource, cfnContext) {
    const { Properties: properties } = resource;
    const requestMappingTemplateLocation = properties.RequestMappingTemplateS3Location
        ? (0, field_parser_1.parseValue)(properties.RequestMappingTemplateS3Location, cfnContext)
        : undefined;
    const responseMappingTemplateLocation = properties.ResponseMappingTemplateS3Location
        ? (0, field_parser_1.parseValue)(properties.ResponseMappingTemplateS3Location, cfnContext)
        : undefined;
    const requestMappingTemplate = properties.RequestMappingTemplate ? (0, field_parser_1.parseValue)(properties.RequestMappingTemplate, cfnContext) : undefined;
    const responseMappingTemplate = properties.ResponseMappingTemplate
        ? (0, field_parser_1.parseValue)(properties.ResponseMappingTemplate, cfnContext)
        : undefined;
    const dataSourceName = (0, field_parser_1.parseValue)(properties.DataSourceName, cfnContext);
    return {
        ref: `arn:aws:appsync:us-east-1:123456789012:apis/graphqlapiid/functions/${resource.Properties.Name}`,
        cfnExposedAttributes: { DataSourceName: 'dataSourceName', FunctionArn: 'ref', FunctionId: 'name', Name: 'name' },
        name: resource.Properties.Name,
        dataSourceName,
        requestMappingTemplateLocation: requestMappingTemplateLocation,
        responseMappingTemplateLocation: responseMappingTemplateLocation,
        requestMappingTemplate,
        responseMappingTemplate,
    };
}
exports.appSyncFunctionHandler = appSyncFunctionHandler;
//# sourceMappingURL=appsync.js.map