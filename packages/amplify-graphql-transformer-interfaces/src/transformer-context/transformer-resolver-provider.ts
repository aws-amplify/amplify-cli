import { Stack } from '@aws-cdk/core';
import { GraphQLAPIProvider, MappingTemplateProvider } from '../graphql-api-provider';
import { DataSourceProvider } from './transformer-datasource-provider';
import { TransformerContextProvider } from './transformer-context-provider';

export interface TransformerResolverProvider {
  addToSlot: (
    slotName: string,
    requestMappingTemplate: MappingTemplateProvider,
    responseMappingTemplate?: MappingTemplateProvider,
    dataSource?: DataSourceProvider,
  ) => void;
  synthesize: (context: TransformerContextProvider, api: GraphQLAPIProvider) => void;
  mapToStack: (stack: Stack) => void;
}

export interface TransformerResolversManagerProvider {
  addResolver: (typeName: string, fieldName: string, resolver: TransformerResolverProvider) => TransformerResolverProvider;
  getResolver: (typeName: string, fieldName: string) => TransformerResolverProvider | void;
  hasResolver: (typeName: string, fieldName: string) => boolean;
  removeResolver: (typeName: string, fieldName: string) => TransformerResolverProvider;
  collectResolvers: () => Map<string, TransformerResolverProvider>;

  generateQueryResolver: (
    typeName: string,
    fieldName: string,
    resolverLogicalId: string,
    dataSource: DataSourceProvider,
    requestMappingTemplate: MappingTemplateProvider,
    responseMappingTemplate: MappingTemplateProvider,
  ) => TransformerResolverProvider;

  generateMutationResolver: (
    typeName: string,
    fieldName: string,
    resolverLogicalId: string,
    dataSource: DataSourceProvider,
    requestMappingTemplate: MappingTemplateProvider,
    responseMappingTemplate: MappingTemplateProvider,
  ) => TransformerResolverProvider;

  generateSubscriptionResolver: (
    typeName: string,
    fieldName: string,
    resolverLogicalId: string,
    requestMappingTemplate: MappingTemplateProvider,
    responseMappingTemplate: MappingTemplateProvider,
  ) => TransformerResolverProvider;
}
