import { ObjectTypeDefinitionNode, FieldDefinitionNode, DirectiveDefinitionNode, InputValueDefinitionNode } from 'graphql';
import { TransformerPluginProvider } from './transformer-plugin-provider';
import { TransformerResolverProvider, TransformerContextProvider, AppSyncDataSourceType, DataSourceInstance } from './transformer-context';

export enum QueryFieldType {
  GET = 'GET',
  LIST = 'LIST',
  SYNC = 'SYNC',
}

export enum MutationFieldType {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
}

export enum SubscriptionFieldType {
  ON_CREATE = 'ON_CREATE',
  ON_DELETE = 'ON_DELETE',
  ON_UPDATE = 'ON_UPDATE',
}
export interface TransformerModelProvider extends TransformerPluginProvider {
  getDataSourceType: () => AppSyncDataSourceType;
  generateGetResolver: (
    ctx: TransformerContextProvider,
    type: ObjectTypeDefinitionNode,
    typeName: string,
    fieldName: string,
    directive?: DirectiveDefinitionNode,
  ) => TransformerResolverProvider;
  generateListResolver: (
    ctx: TransformerContextProvider,
    type: ObjectTypeDefinitionNode,
    typeName: string,
    fieldName: string,
    directive?: DirectiveDefinitionNode,
  ) => TransformerResolverProvider;
  generateCreateResolver: (
    ctx: TransformerContextProvider,
    type: ObjectTypeDefinitionNode,
    typeName: string,
    fieldName: string,
    directive?: DirectiveDefinitionNode,
  ) => TransformerResolverProvider;
  generateUpdateResolver: (
    ctx: TransformerContextProvider,
    type: ObjectTypeDefinitionNode,
    typeName: string,
    fieldName: string,
    directive?: DirectiveDefinitionNode,
  ) => TransformerResolverProvider;
  generateDeleteResolver: (
    ctx: TransformerContextProvider,
    type: ObjectTypeDefinitionNode,
    typeName: string,
    fieldName: string,
    directive?: DirectiveDefinitionNode,
  ) => TransformerResolverProvider;
  generateOnCreateResolver?: (
    ctx: TransformerContextProvider,
    type: ObjectTypeDefinitionNode,
    typeName: string,
    fieldName: string,
    directive?: DirectiveDefinitionNode,
  ) => TransformerResolverProvider;
  generateOnUpdateResolver?: (
    ctx: TransformerContextProvider,
    type: ObjectTypeDefinitionNode,
    typeName: string,
    fieldName: string,
    directive?: DirectiveDefinitionNode,
  ) => TransformerResolverProvider;
  generateOnDeleteResolver?: (
    ctx: TransformerContextProvider,
    type: ObjectTypeDefinitionNode,
    typeName: string,
    fieldName: string,
    directive?: DirectiveDefinitionNode,
  ) => TransformerResolverProvider;
  generateSyncResolver?: (
    ctx: TransformerContextProvider,
    type: ObjectTypeDefinitionNode,
    typeName: string,
    fieldName: string,
    directive?: DirectiveDefinitionNode,
  ) => TransformerResolverProvider;

  getQueryFieldNames: (
    ctx: TransformerContextProvider,
    type: ObjectTypeDefinitionNode,
    directive?: DirectiveDefinitionNode,
  ) => Set<{ fieldName: string; typeName: string; type: QueryFieldType }>;
  getMutationFieldNames: (
    ctx: TransformerContextProvider,
    type: ObjectTypeDefinitionNode,
    directive?: DirectiveDefinitionNode,
  ) => Set<{ fieldName: string; typeName: string; type: MutationFieldType }>;
  getSubscriptionFieldNames: (
    ctx: TransformerContextProvider,
    type: ObjectTypeDefinitionNode,
    directive?: DirectiveDefinitionNode,
  ) => Set<{
    fieldName: string;
    typeName: string;
    type: SubscriptionFieldType;
  }>;

  // Get instance of the CDK resource to augment the table (like adding additional indexes)
  getDataSourceResource: (ctx: TransformerContextProvider, type: ObjectTypeDefinitionNode) => DataSourceInstance;

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

export interface TransformerAuthProvider extends TransformerPluginProvider {
  protectGetResolver: <AuthRule, ModelConfiguration>(
    ctx: TransformerContextProvider,
    resolverResourceID: string,
    type: ObjectTypeDefinitionNode,
    authRules: Array<AuthRule>,
    modelConfiguration: ModelConfiguration,
  ) => TransformerResolverProvider;
  protectListResolver: <AuthRule, ModelConfiguration>(
    ctx: TransformerContextProvider,
    resolverResourceID: string,
    type: ObjectTypeDefinitionNode,
    authRules: Array<AuthRule>,
    modelConfiguration: ModelConfiguration,
  ) => TransformerResolverProvider;
  protectCreateResolver: <AuthRule, ModelConfiguration>(
    ctx: TransformerContextProvider,
    resolverResourceID: string,
    type: ObjectTypeDefinitionNode,
    authRules: Array<AuthRule>,
    modelConfiguration: ModelConfiguration,
  ) => TransformerResolverProvider;
  protectUpdateResolver: <AuthRule, ModelConfiguration>(
    ctx: TransformerContextProvider,
    resolverResourceID: string,
    type: ObjectTypeDefinitionNode,
    authRules: Array<AuthRule>,
    modelConfiguration: ModelConfiguration,
  ) => TransformerResolverProvider;
  protectDeleteResolver: <AuthRule, ModelConfiguration>(
    ctx: TransformerContextProvider,
    resolverResourceID: string,
    type: ObjectTypeDefinitionNode,
    authRules: Array<AuthRule>,
    modelConfiguration: ModelConfiguration,
  ) => TransformerResolverProvider;
  protectOnCreateResolver?: <AuthRule, ModelConfiguration>(
    ctx: TransformerContextProvider,
    resolverResourceID: string,
    type: ObjectTypeDefinitionNode,
    authRules: Array<AuthRule>,
    modelConfiguration: ModelConfiguration,
  ) => TransformerResolverProvider;
  protectOnUpdateResolver?: <AuthRule, ModelConfiguration>(
    ctx: TransformerContextProvider,
    resolverResourceID: string,
    type: ObjectTypeDefinitionNode,
    authRules: Array<AuthRule>,
    modelConfiguration: ModelConfiguration,
  ) => TransformerResolverProvider;
  protectOnDeleteResolver?: <AuthRule, ModelConfiguration>(
    ctx: TransformerContextProvider,
    resolverResourceID: string,
    type: ObjectTypeDefinitionNode,
    authRules: Array<AuthRule>,
    modelConfiguration: ModelConfiguration,
  ) => TransformerResolverProvider;
  protectSyncResolver?: <AuthRule, ModelConfiguration>(
    ctx: TransformerContextProvider,
    resolverResourceID: string,
    type: ObjectTypeDefinitionNode,
    authRules: Array<AuthRule>,
    modelConfiguration: ModelConfiguration,
  ) => TransformerResolverProvider;
  protectFieldResolver?: (
    ctx: TransformerContextProvider,
    field: FieldDefinitionNode,
    typeName: string,
    fieldName: string,
  ) => TransformerResolverProvider;
}

export interface TransformerModelEnhancementProvider extends Partial<TransformerModelProvider> {}
