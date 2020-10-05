import { TransformerDataSourceManagerProvider } from '@aws-amplify/graphql-transformer-interfaces';
import { BackedDataSource } from '@aws-cdk/aws-appsync';
import { ObjectTypeDefinitionNode, InterfaceTypeDefinitionNode } from 'graphql';

export class TransformerDataSourceManager implements TransformerDataSourceManagerProvider {
  private dataSourceMap: Map<string, BackedDataSource> = new Map();
  add = (type: ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode, dataSourceInstance: BackedDataSource) => {
    const key = type.name.value;
    if (this.dataSourceMap.has(key)) {
      throw new Error(`DataSource already exists for type ${name}`);
    }
    this.dataSourceMap.set(key, dataSourceInstance);
  };

  get = (type: ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode): BackedDataSource => {
    const key = type.name.value;
    if (!this.dataSourceMap.has(key)) {
      throw new Error(`DataSource for type ${name} does not exist`);
    }
    return this.dataSourceMap.get(key)!;
  };

  collectDataSources = () => {
    return new Map(this.dataSourceMap.entries());
  };
}
