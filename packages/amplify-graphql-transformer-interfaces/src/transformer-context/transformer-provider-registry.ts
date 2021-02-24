import { InterfaceTypeDefinitionNode, ObjectTypeDefinitionNode } from 'graphql';
import { TransformerModelProvider, TransformerModelEnhancementProvider } from '../transformer-model-provider';

export interface TransformerProviderRegistry {
  registerDataSourceProvider: (type: ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode, provider: TransformerModelProvider) => void;
  getDataSourceProvider(type: ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode): TransformerModelProvider;
  hasDataSourceProvider(type: ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode): boolean;

  addDataSourceEnhancer: (
    type: ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode,
    provider: TransformerModelEnhancementProvider,
  ) => void;
  getDataSourceEnhancers: (type: ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode) => TransformerModelEnhancementProvider[];
}
