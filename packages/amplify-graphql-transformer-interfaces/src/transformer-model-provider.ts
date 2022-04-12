import { ObjectTypeDefinitionNode, DirectiveDefinitionNode, InputValueDefinitionNode } from 'graphql';
import { TransformerPluginProvider } from '.';
import {
  TransformerResolverProvider, TransformerContextProvider, AppSyncDataSourceType, DataSourceInstance,
} from './transformer-context';

/**
 * QueryFieldType
 */
export enum QueryFieldType {
  GET = 'GET',
  LIST = 'LIST',
  SYNC = 'SYNC',
}

/**
 * MutationFieldType
 */
export enum MutationFieldType {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
}

/**
 * SubscriptionFieldType
 */
export enum SubscriptionFieldType {
  ON_CREATE = 'ON_CREATE',
  ON_DELETE = 'ON_DELETE',
  ON_UPDATE = 'ON_UPDATE',
}
/**
 * TransformerModelProvider
 */
export interface TransformerModelProvider extends TransformerPluginProvider {
  getDataSourceType: () => AppSyncDataSourceType;
  generateGetResolver: (
    ctx: TransformerContextProvider,
    type: ObjectTypeDefinitionNode,
    typeName: string,
    fieldName: string,
    resolverLogicalId: string,
    directive?: DirectiveDefinitionNode,
  ) => TransformerResolverProvider;
  generateListResolver: (
    ctx: TransformerContextProvider,
    type: ObjectTypeDefinitionNode,
    typeName: string,
    fieldName: string,
    resolverLogicalId: string,
    directive?: DirectiveDefinitionNode,
  ) => TransformerResolverProvider;
  generateCreateResolver: (
    ctx: TransformerContextProvider,
    type: ObjectTypeDefinitionNode,
    typeName: string,
    fieldName: string,
    resolverLogicalId: string,
    directive?: DirectiveDefinitionNode,
  ) => TransformerResolverProvider;
  generateUpdateResolver: (
    ctx: TransformerContextProvider,
    type: ObjectTypeDefinitionNode,
    typeName: string,
    fieldName: string,
    resolverLogicalId: string,
    directive?: DirectiveDefinitionNode,
  ) => TransformerResolverProvider;
  generateDeleteResolver: (
    ctx: TransformerContextProvider,
    type: ObjectTypeDefinitionNode,
    typeName: string,
    fieldName: string,
    resolverLogicalId: string,
    directive?: DirectiveDefinitionNode,
  ) => TransformerResolverProvider;
  generateOnCreateResolver?: (
    ctx: TransformerContextProvider,
    typeName: string,
    fieldName: string,
    resolverLogicalId: string,
    directive?: DirectiveDefinitionNode,
  ) => TransformerResolverProvider;
  generateOnUpdateResolver?: (
    ctx: TransformerContextProvider,
    typeName: string,
    fieldName: string,
    resolverLogicalId: string,
    directive?: DirectiveDefinitionNode,
  ) => TransformerResolverProvider;
  generateOnDeleteResolver?: (
    ctx: TransformerContextProvider,
    typeName: string,
    fieldName: string,
    resolverLogicalId: string,
    directive?: DirectiveDefinitionNode,
  ) => TransformerResolverProvider;
  generateSyncResolver?: (
    ctx: TransformerContextProvider,
    type: ObjectTypeDefinitionNode,
    typeName: string,
    fieldName: string,
    resolverLogicalId: string,
    directive?: DirectiveDefinitionNode,
  ) => TransformerResolverProvider;

  getQueryFieldNames: (
    type: ObjectTypeDefinitionNode,
    directive?: DirectiveDefinitionNode,
  ) => Set<{ fieldName: string; typeName: string; type: QueryFieldType }>;
  getMutationFieldNames: (
    type: ObjectTypeDefinitionNode,
    directive?: DirectiveDefinitionNode,
  ) => Set<{ fieldName: string; typeName: string; type: MutationFieldType }>;
  getSubscriptionFieldNames: (
    type: ObjectTypeDefinitionNode,
    directive?: DirectiveDefinitionNode,
  ) => Set<{
    fieldName: string;
    typeName: string;
    type: SubscriptionFieldType;
  }>;

  // Get instance of the CDK resource to augment the table (like adding additional indexes)
  getDataSourceResource: (type: ObjectTypeDefinitionNode) => DataSourceInstance;

  getInputs: (
    ctx: TransformerContextProvider,
    type: ObjectTypeDefinitionNode,
    operation: {
      fieldName: string;
      typeName: string;
      type: QueryFieldType | MutationFieldType | SubscriptionFieldType;
    },
  ) => InputValueDefinitionNode[];

  getOutputType: (
    ctx: TransformerContextProvider,
    type: ObjectTypeDefinitionNode,
    operation: {
      fieldName: string;
      typeName: string;
      type: QueryFieldType | MutationFieldType | SubscriptionFieldType;
    },
  ) => ObjectTypeDefinitionNode;
}

/**
 * TransformerAuthProvider
 */
export type TransformerAuthProvider = TransformerPluginProvider

/**
 * TransformerModelEnhancementProvider
 */
export type TransformerModelEnhancementProvider = Partial<TransformerModelProvider>
