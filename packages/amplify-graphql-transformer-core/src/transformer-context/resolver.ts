import {
  AppSyncFunctionConfigurationProvider,
  DataSourceProvider,
  GraphQLAPIProvider,
  MappingTemplateProvider,
  TransformerContextProvider,
  TransformerResolverProvider,
  TransformerResolversManagerProvider,
} from '@aws-amplify/graphql-transformer-interfaces';
import { AuthorizationType, CfnFunctionConfiguration } from '@aws-cdk/aws-appsync';
import { isResolvableObject, Stack, CfnParameter } from '@aws-cdk/core';
import assert from 'assert';
import { toPascalCase } from 'graphql-transformer-common';
import { dedent } from 'ts-dedent';
import { MappingTemplate, S3MappingTemplate } from '../cdk-compat';
import * as SyncUtils from '../transformation/sync-utils';
import { IAM_AUTH_ROLE_PARAMETER, IAM_UNAUTH_ROLE_PARAMETER } from '../utils';
import { StackManager } from './stack-manager';

type Slot = {
  requestMappingTemplate: MappingTemplateProvider;
  responseMappingTemplate?: MappingTemplateProvider;
  dataSource?: DataSourceProvider;
};

// Name of the None Data source used for pipeline resolver
const NONE_DATA_SOURCE_NAME = 'NONE_DS';

export class ResolverManager implements TransformerResolversManagerProvider {
  private resolvers: Map<string, TransformerResolverProvider> = new Map();

  generateQueryResolver = (
    typeName: string,
    fieldName: string,
    resolverLogicalId: string,
    dataSource: DataSourceProvider,
    requestMappingTemplate: MappingTemplateProvider,
    responseMappingTemplate: MappingTemplateProvider,
  ): TransformerResolver => {
    return new TransformerResolver(
      typeName,
      fieldName,
      resolverLogicalId,
      requestMappingTemplate,
      responseMappingTemplate,
      ['init', 'preAuth', 'auth', 'postAuth', 'preDataLoad'],
      ['postDataLoad', 'finish'],
      dataSource,
    );
  };

  generateMutationResolver = (
    typeName: string,
    fieldName: string,
    resolverLogicalId: string,
    dataSource: DataSourceProvider,
    requestMappingTemplate: MappingTemplateProvider,
    responseMappingTemplate: MappingTemplateProvider,
  ): TransformerResolver => {
    return new TransformerResolver(
      typeName,
      fieldName,
      resolverLogicalId,
      requestMappingTemplate,
      responseMappingTemplate,
      ['init', 'preAuth', 'auth', 'postAuth', 'preUpdate'],
      ['postUpdate', 'finish'],
      dataSource,
    );
  };

  generateSubscriptionResolver = (
    typeName: string,
    fieldName: string,
    resolverLogicalId: string,
    requestMappingTemplate: MappingTemplateProvider,
    responseMappingTemplate: MappingTemplateProvider,
  ): TransformerResolver => {
    return new TransformerResolver(
      typeName,
      fieldName,
      resolverLogicalId,
      requestMappingTemplate,
      responseMappingTemplate,
      ['init', 'preAuth', 'auth', 'postAuth', 'preSubscribe'],
      [],
    );
  };
  addResolver = (typeName: string, fieldName: string, resolver: TransformerResolverProvider): TransformerResolverProvider => {
    const key = `${typeName}.${fieldName}`;
    if (this.resolvers.has(key)) {
      throw new Error(`A resolver for typeName ${typeName} fieldName: ${fieldName} already exists`);
    }
    this.resolvers.set(key, resolver);
    return resolver;
  };

  getResolver = (typeName: string, fieldName: string): TransformerResolverProvider | void => {
    const key = `${typeName}.${fieldName}`;
    if (this.resolvers.has(key)) {
      return this.resolvers.get(key) as TransformerResolverProvider;
    }
  };

  hasResolver = (typeName: string, fieldName: string): boolean => {
    const key = `${typeName}.${fieldName}`;
    return this.resolvers.has(key);
  };

  removeResolver = (typeName: string, fieldName: string): TransformerResolverProvider => {
    const key = `${typeName}.${fieldName}`;
    if (this.resolvers.has(key)) {
      const resolver = this.resolvers.get(key) as TransformerResolverProvider;
      this.resolvers.delete(key);
      return resolver;
    }
    throw new Error(`Resolver for typeName ${typeName} fieldName: ${fieldName} does not exists`);
  };

  collectResolvers = (): Map<string, TransformerResolverProvider> => {
    return new Map(this.resolvers.entries());
  };
}
export class TransformerResolver implements TransformerResolverProvider {
  private readonly slotMap: Map<string, Slot[]> = new Map();
  private readonly slotNames: Set<string>;
  private stack?: Stack;
  constructor(
    private typeName: string,
    private fieldName: string,
    private resolverLogicalId: string,
    private requestMappingTemplate: MappingTemplateProvider,
    private responseMappingTemplate: MappingTemplateProvider,
    private requestSlots: string[],
    private responseSlots: string[],
    private datasource?: DataSourceProvider,
  ) {
    assert(typeName, 'typeName is required');
    assert(fieldName, 'fieldName is required');
    assert(resolverLogicalId, 'resolverLogicalId is required');
    assert(requestMappingTemplate, 'requestMappingTemplate is required');
    assert(responseMappingTemplate, 'responseMappingTemplate is required');
    this.slotNames = new Set([...requestSlots, ...responseSlots]);
  }

  mapToStack = (stack: Stack) => {
    this.stack = stack;
  };
  addToSlot = (
    slotName: string,
    requestMappingTemplate: MappingTemplateProvider,
    responseMappingTemplate?: MappingTemplateProvider,
    dataSource?: DataSourceProvider,
  ): void => {
    if (!this.slotNames.has(slotName)) {
      throw new Error(`Resolver is missing slot ${slotName}`);
    }
    let slotEntry: Slot[];
    if (this.slotMap.has(slotName)) {
      slotEntry = this.slotMap.get(slotName)!;
    } else {
      slotEntry = [];
    }

    slotEntry.push({
      requestMappingTemplate,
      responseMappingTemplate,
      dataSource,
    });
    this.slotMap.set(slotName, slotEntry);
  };

  synthesize = (context: TransformerContextProvider, api: GraphQLAPIProvider): void => {
    const stack = this.stack || (context.stackManager as StackManager).rootStack;
    this.ensureNoneDataSource(api);
    const requestFns = this.synthesizeResolvers(stack, api, this.requestSlots);
    const responseFns = this.synthesizeResolvers(stack, api, this.responseSlots);
    // substitue template name values
    [this.requestMappingTemplate, this.requestMappingTemplate].map(template => this.substitueSlotInfo(template, 'main', 0));

    const dataSourceProviderFn = api.host.addAppSyncFunction(
      toPascalCase([this.typeName, this.fieldName, 'DataResolverFn']),
      this.requestMappingTemplate,
      this.responseMappingTemplate,
      this.datasource?.name || NONE_DATA_SOURCE_NAME,
      stack,
    );

    let dataSourceType = 'NONE';
    let dataSource = '';
    if (this.datasource) {
      dataSourceType = this.datasource.ds.type;
      switch (dataSourceType) {
        case 'AMAZON_DYNAMODB':
          if (this.datasource.ds.dynamoDbConfig && !isResolvableObject(this.datasource.ds.dynamoDbConfig)) {
            const tableName = this.datasource.ds.dynamoDbConfig?.tableName;
            dataSource = `$util.qr($ctx.stash.put("tableName", "${tableName}"))`;
          }

          if (context.isProjectUsingDataStore()) {
            const syncConfig = SyncUtils.getSyncConfig(context, this.typeName)!;
            const funcConf = dataSourceProviderFn.node.children.find(
              (it: any) => it.cfnResourceType === 'AWS::AppSync::FunctionConfiguration',
            ) as CfnFunctionConfiguration;

            if (funcConf) {
              funcConf.syncConfig = {
                conflictDetection: syncConfig.ConflictDetection,
                conflictHandler: syncConfig.ConflictHandler,
                ...(SyncUtils.isLambdaSyncConfig(syncConfig)
                  ? {
                      lambdaConflictHandlerConfig: {
                        lambdaConflictHandlerArn: syncConfig.LambdaConflictHandler.lambdaArn,
                      },
                    }
                  : {}),
              };
            }
          }

          break;
        case 'AMAZON_ELASTICSEARCH':
          if (this.datasource.ds.elasticsearchConfig && !isResolvableObject(this.datasource.ds.elasticsearchConfig)) {
            const endpoint = this.datasource.ds.elasticsearchConfig?.endpoint;
            dataSource = `$util.qr($ctx.stash.put("endpoint", "${endpoint}"))`;
          }
          break;
        case 'AWS_LAMBDA':
          if (this.datasource.ds.lambdaConfig && !isResolvableObject(this.datasource.ds.lambdaConfig)) {
            const lambdaFunctionArn = this.datasource.ds.lambdaConfig?.lambdaFunctionArn;
            dataSource = `$util.qr($ctx.stash.put("lambdaFunctionArn", "${lambdaFunctionArn}"))`;
          }
          break;
        case 'HTTP':
          if (this.datasource.ds.httpConfig && !isResolvableObject(this.datasource.ds.httpConfig)) {
            const endpoint = this.datasource.ds.httpConfig?.endpoint;
            dataSource = `$util.qr($ctx.stash.put("endpoint", "${endpoint}"))`;
          }
          break;
        case 'RELATIONAL_DATABASE':
          if (
            this.datasource.ds.relationalDatabaseConfig &&
            !isResolvableObject(this.datasource.ds.relationalDatabaseConfig) &&
            !isResolvableObject(this.datasource.ds.relationalDatabaseConfig?.rdsHttpEndpointConfig)
          ) {
            const databaseName = this.datasource.ds.relationalDatabaseConfig?.rdsHttpEndpointConfig!.databaseName;
            dataSource = `$util.qr($ctx.stash.metadata.put("databaseName", "${databaseName}"))`;
          }
          break;
        default:
          throw new Error('Unknown DataSource type');
      }
    }
    let initResolver = dedent`
    $util.qr($ctx.stash.put("typeName", "${this.typeName}"))
    $util.qr($ctx.stash.put("fieldName", "${this.fieldName}"))
    $util.qr($ctx.stash.put("conditions", []))
    $util.qr($ctx.stash.put("metadata", {}))
    $util.qr($ctx.stash.metadata.put("dataSourceType", "${dataSourceType}"))
    $util.qr($ctx.stash.metadata.put("apiId", "${api.apiId}"))
    ${dataSource}
    `;
    const authModes = [context.authConfig.defaultAuthentication, ...(context.authConfig.additionalAuthenticationProviders || [])].map(
      mode => mode?.authenticationType,
    );
    if (authModes.includes(AuthorizationType.IAM)) {
      const authRoleParameter = (context.stackManager.getParameter(IAM_AUTH_ROLE_PARAMETER) as CfnParameter).valueAsString;
      const unauthRoleParameter = (context.stackManager.getParameter(IAM_UNAUTH_ROLE_PARAMETER) as CfnParameter).valueAsString;
      initResolver += dedent`\n
      $util.qr($ctx.stash.put("authRole", "arn:aws:sts::${
        Stack.of(context.stackManager.rootStack).account
      }:assumed-role/${authRoleParameter}/CognitoIdentityCredentials"))
      $util.qr($ctx.stash.put("unauthRole", "arn:aws:sts::${
        Stack.of(context.stackManager.rootStack).account
      }:assumed-role/${unauthRoleParameter}/CognitoIdentityCredentials"))
      `;
    }
    initResolver += '\n$util.toJson({})';
    api.host.addResolver(
      this.typeName,
      this.fieldName,
      MappingTemplate.inlineTemplateFromString(initResolver),
      MappingTemplate.inlineTemplateFromString('$util.toJson($ctx.prev.result)'),
      this.resolverLogicalId,
      undefined,
      [...requestFns, dataSourceProviderFn, ...responseFns].map(fn => fn.functionId),
      stack,
    );
  };

  synthesizeResolvers = (stack: Stack, api: GraphQLAPIProvider, slotsNames: string[]): AppSyncFunctionConfigurationProvider[] => {
    const appSyncFunctions: AppSyncFunctionConfigurationProvider[] = [];

    for (let slotName of slotsNames) {
      if (this.slotMap.has(slotName)) {
        const slotEntries = this.slotMap.get(slotName);
        // Create individual functions
        let index = 0;
        for (let slotItem of slotEntries!) {
          const name = `${this.typeName}${this.fieldName}${slotName}${index++}Function`;
          const { requestMappingTemplate, responseMappingTemplate, dataSource } = slotItem;
          this.substitueSlotInfo(requestMappingTemplate, slotName, index);
          // eslint-disable-next-line no-unused-expressions
          responseMappingTemplate && this.substitueSlotInfo(responseMappingTemplate, slotName, index);
          const fn = api.host.addAppSyncFunction(
            name,
            requestMappingTemplate,
            responseMappingTemplate || MappingTemplate.inlineTemplateFromString('$util.toJson({})'),
            dataSource?.name || NONE_DATA_SOURCE_NAME,
            stack,
          );
          appSyncFunctions.push(fn);
        }
      }
    }
    return appSyncFunctions;
  };

  private substitueSlotInfo(template: MappingTemplateProvider, slotName: string, index: number) {
    if (template instanceof S3MappingTemplate) {
      template.substitueValues({ slotName, slotIndex: index, typeName: this.typeName, fieldName: this.fieldName });
    }
  }

  private ensureNoneDataSource(api: GraphQLAPIProvider) {
    if (!api.host.hasDataSource(NONE_DATA_SOURCE_NAME)) {
      api.host.addNoneDataSource(NONE_DATA_SOURCE_NAME, {
        name: NONE_DATA_SOURCE_NAME,
        description: 'None Data Source for Pipeline functions',
      });
    }
  }
}
