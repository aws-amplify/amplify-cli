import { TransformerResolversManagerProvider } from './transformer-resolver';
import { TransformerDataSourceManagerProvider } from './datasource';
import { TransformerProviderRegistry } from './provider-registry';
import { DocumentNode } from 'graphql';
import { TransformerContextOutputProvider } from './output';
import { StackManagerProvider } from './stacks';
import { GraphQLApiProvider } from '../graphql-api-provider';

export interface TransformerContextProvider {
  resolvers: TransformerResolversManagerProvider;
  dataSources: TransformerDataSourceManagerProvider;
  providerRegistry: TransformerProviderRegistry;

  inputDocument: DocumentNode;
  output: TransformerContextOutputProvider;
  stackManager: StackManagerProvider;
  api: GraphQLApiProvider;
}


export type TransformerBeforeStepContextProvider = Pick<TransformerContextProvider, 'inputDocument'>
export type TransformerSchemaVisitStepContextProvider = Pick<TransformerContextProvider, 'inputDocument' | 'output' | 'providerRegistry'>;
export type TransformerValidationStepContextProvider = Pick<TransformerContextProvider, 'inputDocument'| 'output' | 'providerRegistry'| 'dataSources'>
export type TransformerPrepareStepContextProvider = TransformerValidationStepContextProvider;
export type TranformerTransformSchemaStepContextProvider = TransformerValidationStepContextProvider;