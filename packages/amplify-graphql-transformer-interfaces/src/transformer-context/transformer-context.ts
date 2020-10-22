import { TransformerResolversManagerProvider } from './transformer-resolver';
import { TransformerDataSourceManagerProvider } from './datasource';
import { TransformerProviderRegistry } from './provider-registry';
import { DocumentNode } from 'graphql';
import { TransformerContextOutputProvider } from './output';
import { StackManagerProvider } from './stacks';
import { GraphQLApiProvider } from '../graphql-api-provider';
import { TransformerResourceHelperProvider } from './resource-helper'
import { FeatureFlagProvider } from '../featuer-flags';

export interface TransformerContextProvider {
  resolvers: TransformerResolversManagerProvider;
  dataSources: TransformerDataSourceManagerProvider;
  providerRegistry: TransformerProviderRegistry;

  inputDocument: DocumentNode;
  output: TransformerContextOutputProvider;
  stackManager: StackManagerProvider;
  api: GraphQLApiProvider;
  resourceHelper: TransformerResourceHelperProvider;
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
export type TranformerTransformSchemaStepContextProvider = TransformerValidationStepContextProvider;