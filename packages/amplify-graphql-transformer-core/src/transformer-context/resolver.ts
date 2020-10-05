import {
  TransformerResolverProvider,
  DataSourceProvider,
  TransformerContextProvider,
  TransformerResolversManagerProvider,
  AppSyncFunctionConfigurationProvider,
} from '@aws-amplify/graphql-transformer-interfaces';
import { Stack } from '@aws-cdk/core';
import { GraphQLApiProvider } from '@aws-amplify/graphql-transformer-interfaces';
import { MappingTemplate } from '../cdk-compat';
import { StackManager } from './stack-manager';
import assert from 'assert';

type Slot = {
  requestMappingTemplate: string;
  responseMappingTemplate?: string;
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
    requestMappingTemplate: string,
    responseMappingTemplate: string,
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
    requestMappingTemplate: string,
    responseMappingTemplate: string,
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
    requestMappingTemplate: string,
    responseMappingTemplate: string,
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
    private requestMappingTemplate: string,
    private responseMappingTemplate: string,
    private requestSlots: string[],
    private responseSlots: string[],
  ) {
    assert(typeName, 'typeName is required');
    assert(fieldName, 'fieldName is required');
    assert(datasource, 'dataSourceName is required');
    assert(requestMappingTemplate, 'requestMappingTemplate is required');
    assert(responseMappingTemplate, 'responseMappingTemplate is required');
    this.slotNames = new Set([...requestMappingTemplate, ...responseMappingTemplate]);
  }

  mapToStack = (stack: Stack) => {
    this.stack = stack;
  };
  addToSlot = (
    slotName: string,
    requestMappingTemplate: string,
    responseMappingTemplate?: string,
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
    const templateNamePrefix = `${this.typeName}.${this.fieldName}`;
    const requestFns = this.synthesizePipelineFunctions(stack, api, this.requestSlots);
    const responseFns = this.synthesizePipelineFunctions(stack, api, this.responseSlots);
    const dataSourceProviderFn = api.addAppSyncFunction(
      `${this.typeName}.${this.fieldName}DataResolverFn`,
      MappingTemplate.fromInlineTemplate(this.requestMappingTemplate, `pipelineFunctions/${templateNamePrefix}.dataloader.req.vtl`),
      MappingTemplate.fromInlineTemplate(this.responseMappingTemplate, `pipelineFunctions/${templateNamePrefix}.dataloader.res.vtl`),
      this.datasource.name,
      stack
    );

    api.addResolver(
      this.typeName,
      this.fieldName,
      MappingTemplate.fromInlineTemplate(
        `
      $util.qr($ctx.stash.put("typeName", "${this.typeName}"))
      $util.qr($ctx.stash.put("fieldName", "${this.fieldName}"))
      `,
        `resolvers/${templateNamePrefix}.req.vtl`,
      ),
      MappingTemplate.fromInlineTemplate(
        `
      $util.toJson($ctx.prev.result)
      `,
        `resolvers/${templateNamePrefix}res.vtl`,
      ),
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
        const hasDataSource = slotEntries!.some(entry => entry.dataSource);
        const hasResponseTemplate = slotEntries!.some(entry => entry.responseMappingTemplate);

        if (!hasDataSource && !hasResponseTemplate) {
          // we can merge all the slot item into one AppSync function
          const requestTemplate = slotEntries!.map(entry => entry.requestMappingTemplate).join('\n\n');
          const name = `${this.typeName}.${this.fieldName}.${slotName}Function`;
          const fn = api.addAppSyncFunction(
            name,
            MappingTemplate.fromInlineTemplate(requestTemplate, `pipelineFunctions/${name}.req.vtl`),
            MappingTemplate.fromInlineTemplate('$util.toJson({})', `pipelineFunctions/${name}.res.vtl`),
            NONE_DATA_SOURCE_NAME,
            stack,
          );
          appSyncFunctions.push(fn);
        } else {
          // Create individual functions
          let index = 0;
          for (let slotItem of slotEntries!) {
            const name = `${this.typeName}.${this.fieldName}.${slotName}${index++}Function`;
            const { requestMappingTemplate, responseMappingTemplate, dataSource } = slotItem;
            const fn = api.addAppSyncFunction(
              name,
              MappingTemplate.fromInlineTemplate(requestMappingTemplate, `pipelineFunctions/${name}.req.vtl`),
              MappingTemplate.fromInlineTemplate(responseMappingTemplate || '$util.toJson({})', `pipelineFunctions/${name}.res.vtl`),
              dataSource?.name || NONE_DATA_SOURCE_NAME,
              stack,
            );
            appSyncFunctions.push(fn);
          }
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
