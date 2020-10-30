import { Stack } from '@aws-cdk/core';
import { GraphQLApiProvider, MappingTemplateProvider } from '../graphql-api-provider';
import { DataSourceProvider } from './datasource';
import { TransformerContextProvider } from './transformer-context';

export interface TransformerResolverProvider {
  addToSlot: (slotName: string, requestMappingTemplate: MappingTemplateProvider, responseMappingTemplate?: MappingTemplateProvider, dataSource?: DataSourceProvider) => void;
  synthesize: (context: TransformerContextProvider, api: GraphQLApiProvider) => void;
  mapToStack:(stack: Stack) => void;
}

export interface TransformerResolversManagerProvider {
  addResolver: (typeName: string, fieldName: string, resolver: TransformerResolverProvider) => TransformerResolverProvider;
  getResolver: (typeName: string, fieldName: string) => TransformerResolverProvider | void;
  removeResolver: (typeName: string, fieldName: string) => TransformerResolverProvider;
  collectResolvers: () => Map<string, TransformerResolverProvider>;

  generateQueryResolver: (
    typeName: string,
    fieldName: string,
    dataSource: DataSourceProvider,
    requestMappingTemplate: MappingTemplateProvider,
    responseMappingTemplate: MappingTemplateProvider,
  ) => TransformerResolverProvider;

  generateMutationResolver: (
    typeName: string,
    fieldName: string,
    dataSource: DataSourceProvider,
    requestMappingTemplate: MappingTemplateProvider,
    responseMappingTemplate: MappingTemplateProvider,
  ) => TransformerResolverProvider;

  generateSubscriptionResolver: (
    typeName: string,
    fieldName: string,
    requestMappingTemplate: MappingTemplateProvider,
    responseMappingTemplate: MappingTemplateProvider,
  ) => TransformerResolverProvider;
}
