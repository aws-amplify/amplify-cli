import { TransformerResolversManagerProvider } from './transformer-resolver-provider';
import { TransformerDataSourceManagerProvider } from './transformer-datasource-provider';
import { TransformerProviderRegistry } from './transformer-provider-registry';
import { DocumentNode } from 'graphql';
import { TransformerContextOutputProvider } from './transformer-context-output-provider';
import { StackManagerProvider } from './stack-manager-provider';
import { AppSyncAuthConfiguration, GraphQLAPIProvider } from '../graphql-api-provider';
import { TransformerResourceProvider } from './resource-resource-provider';
import { FeatureFlagProvider } from '../feature-flag-provider';

export interface TransformerContextMetadataProvider {
  set<T>(key: string, value: T): void;
  get<T>(key: string): T | undefined;
  has(key: string): boolean;
}

export interface TransformerContextProvider {
  metadata: TransformerContextMetadataProvider;
  resolvers: TransformerResolversManagerProvider;
  dataSources: TransformerDataSourceManagerProvider;
  providerRegistry: TransformerProviderRegistry;

  inputDocument: DocumentNode;
  output: TransformerContextOutputProvider;
  stackManager: StackManagerProvider;
  api: GraphQLAPIProvider;
  resourceHelper: TransformerResourceProvider;
  featureFlags: FeatureFlagProvider;
  authConfig: AppSyncAuthConfiguration;
  sandboxModeEnabled: boolean;

  isProjectUsingDataStore(): boolean;
  getResolverConfig<ResolverConfig>(): ResolverConfig | undefined;
}

export type TransformerBeforeStepContextProvider = Pick<
  TransformerContextProvider,
  'inputDocument' | 'featureFlags' | 'isProjectUsingDataStore' | 'getResolverConfig' | 'authConfig' | 'stackManager' | 'sandboxModeEnabled'
>;
export type TransformerSchemaVisitStepContextProvider = Pick<
  TransformerContextProvider,
  | 'inputDocument'
  | 'output'
  | 'providerRegistry'
  | 'featureFlags'
  | 'isProjectUsingDataStore'
  | 'getResolverConfig'
  | 'metadata'
  | 'authConfig'
  | 'sandboxModeEnabled'
>;
export type TransformerValidationStepContextProvider = Pick<
  TransformerContextProvider,
  | 'inputDocument'
  | 'output'
  | 'providerRegistry'
  | 'dataSources'
  | 'featureFlags'
  | 'isProjectUsingDataStore'
  | 'getResolverConfig'
  | 'metadata'
  | 'authConfig'
  | 'sandboxModeEnabled'
>;
export type TransformerPrepareStepContextProvider = TransformerValidationStepContextProvider;
export type TransformerTransformSchemaStepContextProvider = TransformerValidationStepContextProvider;
