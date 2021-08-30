import { TransformerResolversManagerProvider } from './transformer-resolver-provider';
import { TransformerDataSourceManagerProvider } from './transformer-datasource-provider';
import { TransformerProviderRegistry } from './transformer-provider-registry';
import { DocumentNode } from 'graphql';
import { TransformerContextOutputProvider } from './transformer-context-output-provider';
import { StackManagerProvider } from './stack-manager-provider';
import { GraphQLAPIProvider } from '../graphql-api-provider';
import { TransformerResourceProvider } from './resource-resource-provider';
import { FeatureFlagProvider } from '../feature-flag-provider';

export interface TransformerContextProvider {
  resolvers: TransformerResolversManagerProvider;
  dataSources: TransformerDataSourceManagerProvider;
  providerRegistry: TransformerProviderRegistry;

  inputDocument: DocumentNode;
  output: TransformerContextOutputProvider;
  stackManager: StackManagerProvider;
  api: GraphQLAPIProvider;
  resourceHelper: TransformerResourceProvider;
  featureFlags: FeatureFlagProvider;
}

export type TransformerBeforeStepContextProvider = Pick<TransformerContextProvider, 'inputDocument' | 'featureFlags'>;
export type TransformerSchemaVisitStepContextProvider = Pick<
  TransformerContextProvider,
  'inputDocument' | 'output' | 'providerRegistry' | 'featureFlags'
>;
export type TransformerValidationStepContextProvider = Pick<
  TransformerContextProvider,
  'inputDocument' | 'output' | 'providerRegistry' | 'dataSources' | 'featureFlags'
>;
export type TransformerPrepareStepContextProvider = TransformerValidationStepContextProvider;
export type TransformerTransformSchemaStepContextProvider = TransformerValidationStepContextProvider;
