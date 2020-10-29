import { AmplifyAppSyncSimulatorAuthenticationType, AmplifyAppSyncSimulatorConfig } from 'amplify-appsync-simulator';
import { registerAppSyncResourceProcessor, registerIAMResourceProcessor, registerLambdaResourceProcessor } from './resource-processors';
import { AppSyncAPIKeyProcessedResource, AppSyncAPIProcessedResource } from './resource-processors/appsync';
import { processCloudFormationStack } from './stack/index';
import { CloudFormationTemplateFetcher, CloudFormationTemplate } from './stack/types';

const CFN_DEFAULT_PARAMS = {
  'AWS::Region': 'us-east-1-fake',
  'AWS::AccountId': '12345678910',
  'AWS::StackId': 'fake-stackId',
  'AWS::StackName': 'local-testing',
};

const RESOLVER_TEMPLATE_LOCATION_PREFIX = 's3://${S3DeploymentBucket}/${S3DeploymentRootKey}/';

export function processApiResources(
  resources: Record<string, { Type: string; result: any }>,
  transformResult: any,
  appSyncConfig: AmplifyAppSyncSimulatorConfig,
): void {
  Object.values(resources).forEach(resource => {
    const { Type: resourceType } = resource;
    const result: any = resource.result;

    switch (resourceType) {
      case 'AWS::AppSync::DataSource':
        appSyncConfig.dataSources.push(result);
        break;
      case 'AWS::AppSync::Resolver':
        appSyncConfig.resolvers.push({
          ...result,
          requestMappingTemplateLocation:
            result.requestMappingTemplateLocation && result.requestMappingTemplateLocation.replace(RESOLVER_TEMPLATE_LOCATION_PREFIX, ''),
          responseMappingTemplateLocation:
            result.responseMappingTemplateLocation && result.responseMappingTemplateLocation.replace(RESOLVER_TEMPLATE_LOCATION_PREFIX, ''),
        });
        break;
      case 'AWS::DynamoDB::Table':
        appSyncConfig.tables.push(result);
        break;
      case 'AWS::AppSync::FunctionConfiguration':
        appSyncConfig.functions.push({
          ...result,
          requestMappingTemplateLocation:
            result.requestMappingTemplateLocation && result.requestMappingTemplateLocation.replace(RESOLVER_TEMPLATE_LOCATION_PREFIX, ''),
          responseMappingTemplateLocation:
            result.responseMappingTemplateLocation && result.responseMappingTemplateLocation.replace(RESOLVER_TEMPLATE_LOCATION_PREFIX, ''),
        });
        break;
      case 'AWS::AppSync::GraphQLSchema':
        if (result.definition) {
          appSyncConfig.schema = { content: result.definition };
        } else {
          appSyncConfig.schema = { path: 'schema.graphql', content: transformResult.schema };
        }

        break;
      case 'AWS::AppSync::GraphQLApi':
        const resource = result as AppSyncAPIProcessedResource;
        appSyncConfig.appSync.name = resource.name;
        appSyncConfig.appSync.defaultAuthenticationType = resource.defaultAuthenticationType;
        appSyncConfig.appSync.additionalAuthenticationProviders = resource.additionalAuthenticationProviders || [];
        break;
      case 'AWS::AppSync::ApiKey':
        appSyncConfig.appSync.apiKey = (result as AppSyncAPIKeyProcessedResource).ApiKey;
        break;
      case 'AWS::CloudFormation::Stack':
        processApiResources(result.resources, transformResult, appSyncConfig);
        break;
    }
  });
}
export function processCloudFormationResults(resources, transformResult) {
  const processedResources: AmplifyAppSyncSimulatorConfig = {
    schema: {
      content: '',
    },
    resolvers: [],
    functions: [],
    dataSources: [],
    mappingTemplates: [],
    tables: [],
    appSync: {
      name: '',
      defaultAuthenticationType: {
        authenticationType: AmplifyAppSyncSimulatorAuthenticationType.API_KEY,
      },
      apiKey: null,
      additionalAuthenticationProviders: [],
    },
  };

  processApiResources(resources, transformResult, processedResources);
  Object.entries(transformResult.resolvers).forEach(([path, content]) => {
    processedResources.mappingTemplates.push({
      path: `resolvers/${path}`,
      content: content as string,
    });
  });
  Object.entries(transformResult.pipelineFunctions).forEach(([path, content]) => {
    processedResources.mappingTemplates.push({
      path: `pipelineFunctions/${path}`,
      content: content as string,
    });
  });

  return processedResources;
}
export function processTransformerStacks(transformResult, params = {}): AmplifyAppSyncSimulatorConfig {
  registerAppSyncResourceProcessor();
  registerIAMResourceProcessor();
  registerLambdaResourceProcessor();

  const rootStack = JSON.parse(JSON.stringify(transformResult.rootStack)); // rootstack is not
  const cfnParams = {
    ...CFN_DEFAULT_PARAMS,
    env: '${env}',
    S3DeploymentBucket: '${S3DeploymentBucket}',
    S3DeploymentRootKey: '${S3DeploymentRootKey}',
    CreateAPIKey: 1,
    ...params,
  };

  const cfnTemplateFetcher: CloudFormationTemplateFetcher = {
    getCloudFormationStackTemplate: (templateName: string): CloudFormationTemplate => {
      const template = templateName.replace('https://s3.amazonaws.com/${S3DeploymentBucket}/${S3DeploymentRootKey}/stacks/', '');
      const stackTemplate = Object.keys(transformResult.stacks).includes(template)
        ? transformResult.stacks[template]
        : transformResult.stacks[template.replace('.json', '')];
      if (stackTemplate && typeof stackTemplate === 'undefined') {
        throw new Error(`Invalid cloud formation template ${templateName}`);
      }
      return stackTemplate;
    },
  };

  const processedStacks = processCloudFormationStack(
    rootStack,
    { authRoleName: 'authRole', unauthRoleName: 'unAuthRole', ...cfnParams },
    {},
    cfnTemplateFetcher,
  );
  return processCloudFormationResults(processedStacks.resources, transformResult);
}
