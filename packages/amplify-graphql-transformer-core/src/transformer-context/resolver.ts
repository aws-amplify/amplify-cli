import {
  TransformerResolverProvider,
  DataSourceProvider,
  TransformerContextProvider,
  TransformerResolversManagerProvider,
  AppSyncFunctionConfigurationProvider,
  MappingTemplateProvider,
} from '@aws-amplify/graphql-transformer-interfaces';
import { Stack, isResolvableObject } from '@aws-cdk/core';
import { GraphQLApiProvider } from '@aws-amplify/graphql-transformer-interfaces';
import { MappingTemplate } from '../cdk-compat';
import { StackManager } from './stack-manager';
import assert from 'assert';
import { toPascalCase } from 'graphql-transformer-common';
import { dedent } from 'ts-dedent';

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
    dataSource: DataSourceProvider,
    requestMappingTemplate: MappingTemplateProvider,
    responseMappingTemplate: MappingTemplateProvider,
  ): TransformerResolver => {
    return new TransformerResolver(
      typeName,
      fieldName,
      dataSource,
      requestMappingTemplate,
      responseMappingTemplate,
      ['init', 'preAuth', 'auth', 'postAuth', 'preDataLoad'],
      ['postDataLoad', 'finish'],
    );
  };

  generateMutationResolver = (
    typeName: string,
    fieldName: string,
    dataSource: DataSourceProvider,
    requestMappingTemplate: MappingTemplateProvider,
    responseMappingTemplate: MappingTemplateProvider,
  ): TransformerResolver => {
    return new TransformerResolver(
      typeName,
      fieldName,
      dataSource,
      requestMappingTemplate,
      responseMappingTemplate,
      ['init', 'preAuth', 'auth', 'postAuth', 'preUpdate'],
      ['postUpdate', 'finish'],
    );
  };

  generateSubscriptionResolver = (
    typeName: string,
    fieldName: string,
    dataSource: DataSourceProvider,
    requestMappingTemplate: MappingTemplateProvider,
    responseMappingTemplate: MappingTemplateProvider,
  ): TransformerResolver => {
    return new TransformerResolver(
      typeName,
      fieldName,
      dataSource,
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
      return <TransformerResolverProvider>this.resolvers.get(key);
    }
  };

  removeResolver = (typeName: string, fieldName: string): TransformerResolverProvider => {
    const key = `${typeName}.${fieldName}`;
    if (this.resolvers.has(key)) {
      const resolver = <TransformerResolverProvider>this.resolvers.get(key);
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
    private datasource: DataSourceProvider,
    private requestMappingTemplate: MappingTemplateProvider,
    private responseMappingTemplate: MappingTemplateProvider,
    private requestSlots: string[],
    private responseSlots: string[],
  ) {
    assert(typeName, 'typeName is required');
    assert(fieldName, 'fieldName is required');
    assert(datasource, 'dataSourceName is required');
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

  synthesize = (context: TransformerContextProvider, api: GraphQLApiProvider): void => {
    const stack = this.stack || (context.stackManager as StackManager).rootStack;
    this.ensureNoneDataSource(api);
    const requestFns = this.synthesizePipelineFunctions(stack, api, this.requestSlots);
    const responseFns = this.synthesizePipelineFunctions(stack, api, this.responseSlots);
    const dataSourceProviderFn = api.addAppSyncFunction(
      toPascalCase([this.typeName, this.fieldName, 'DataResolverFn']),
      this.requestMappingTemplate,
      this.responseMappingTemplate,
      this.datasource.name,
      stack,
    );
    const dataSourceType = this.datasource.ds.type;
    let dataSource = '';
    switch (dataSourceType) {
      case 'AMAZON_DYNAMODB':
        if (this.datasource.ds.dynamoDbConfig && !isResolvableObject(this.datasource.ds.dynamoDbConfig)) {
          const tableName = this.datasource.ds.dynamoDbConfig?.tableName;
          dataSource = `$util.qr($ctx.stash.put("tableName", "${tableName}"))`;
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
    }
    api.addResolver(
      this.typeName,
      this.fieldName,
      MappingTemplate.inlineTemplateFromString(
        dedent`
      $util.qr($ctx.stash.put("typeName", "${this.typeName}"))
      $util.qr($ctx.stash.put("fieldName", "${this.fieldName}"))
      $util.qr($ctx.stash.put("metadata", $util.defaultIfNull($ctx.stash.metadata, {})))
      $util.qr($ctx.stash.metadata.put("dataSourceType", "${dataSourceType}"))
      $util.qr($ctx.stash.metadata.put("apiId", "${api.apiId}"))
      ${dataSource}
      `,
      ),
      MappingTemplate.inlineTemplateFromString('$util.toJson($ctx.prev.result)'),
      undefined,
      [...requestFns, dataSourceProviderFn, ...responseFns].map(fn => fn.functionId),
      stack,
    );
  };

  synthesizePipelineFunctions = (stack: Stack, api: GraphQLApiProvider, slotsNames: string[]): AppSyncFunctionConfigurationProvider[] => {
    const appSyncFunctions: AppSyncFunctionConfigurationProvider[] = [];

    for (let slotName of slotsNames) {
      if (this.slotMap.has(slotName)) {
        const slotEntries = this.slotMap.get(slotName);
        // Create individual functions
        let index = 0;
        for (let slotItem of slotEntries!) {
          const name = `${this.typeName}.${this.fieldName}.${slotName}${index++}Function`;
          const { requestMappingTemplate, responseMappingTemplate, dataSource } = slotItem;
          const fn = api.addAppSyncFunction(
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

  private ensureNoneDataSource(api: GraphQLApiProvider) {
    if (!api.hasDataSource(NONE_DATA_SOURCE_NAME)) {
      api.addNoneDataSource(NONE_DATA_SOURCE_NAME, {
        name: NONE_DATA_SOURCE_NAME,
        description: 'None Data Source for Pipeline functions',
      });
    }
  }
}
