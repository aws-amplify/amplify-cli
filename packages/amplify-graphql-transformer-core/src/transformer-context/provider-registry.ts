import {
  TransformerProviderRegistry,
  TransformerModelProvider,
  TransformerModelEnhancementProvider,
} from '@aws-amplify/graphql-transformer-interfaces';

import { ObjectTypeDefinitionNode, InterfaceTypeDefinitionNode } from 'graphql';
export class TransformerContextProviderRegistry implements TransformerProviderRegistry {
  private dataSourceProviderRegistry: Map<string, TransformerModelProvider> = new Map();
  private dataSourceEnhancerRegistry: Map<string, Set<TransformerModelEnhancementProvider>> = new Map();

  registerDataSourceProvider = (type: ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode, provider: TransformerModelProvider) => {
    const typeName = type.name.value;
    if (this.dataSourceProviderRegistry.has(typeName)) {
      throw new Error(`A data source has been already registered for type ${typeName}`);
    }
    this.dataSourceProviderRegistry.set(typeName, provider);
  };
  getDataSourceProvider = (type: ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode): TransformerModelProvider => {
    const typeName = type.name.value;
    if (this.dataSourceProviderRegistry.has(typeName)) {
      return this.dataSourceProviderRegistry.get(typeName)!;
    }
    throw new Error(`No data source provider has been registered for type ${typeName}`);
  };
  hasDataSourceProvider = (type: ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode): boolean => {
    const typeName = type.name.value;
    return this.dataSourceProviderRegistry.has(typeName);
  };

  addDataSourceEnhancer = (type: ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode, provider: TransformerModelEnhancementProvider) => {
    const typeName = type.name.value;
    let entry: Set<TransformerModelEnhancementProvider>;
    if (!this.dataSourceEnhancerRegistry.has(typeName)) {
      entry = new Set();
      this.dataSourceEnhancerRegistry.set(typeName, entry);
    } else {
      entry = this.dataSourceEnhancerRegistry.get(typeName)!;
    }
    entry.add(provider);
  };

  getDataSourceEnhancers = (type: ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode): TransformerModelEnhancementProvider[] => {
    const typeName = type.name.value;
    return Array.from(this.dataSourceEnhancerRegistry.get(typeName)?.values() || []);
  };
}
