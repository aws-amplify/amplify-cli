import { GraphQLAPIProvider, TransformerResourceHelperProvider } from '@aws-amplify/graphql-transformer-interfaces';
import { CfnParameter } from '@aws-cdk/core';
import { StackManager } from './stack-manager';

export class TransformerResourceHelper implements TransformerResourceHelperProvider {
  private api?: GraphQLAPIProvider;
  private modelToTableNameMap = new Map<string, string>();
  // eslint-disable-next-line no-useless-constructor
  constructor(private stackManager: StackManager) {}
  generateTableName = (modelName: string): string => {
    if (!this.api) {
      throw new Error('API not initalized');
    }
    this.ensureEnv();
    const env = (this.stackManager.getParameter('env') as CfnParameter).valueAsString;
    const apiId = this.api!.apiId;
    const baseName = this.modelToTableNameMap.get(modelName) ?? modelName;
    return `${baseName}-${apiId}-${env}`;
  };

  generateRoleName = (baseName: string): string => {
    if (!this.api) {
      throw new Error('API not initalized');
    }
    this.ensureEnv();
    const env = (this.stackManager.getParameter('env') as CfnParameter).valueAsString;
    const apiId = this.api!.apiId;
    return `${baseName}-${apiId}-${env}`;
  }

  bind(api: GraphQLAPIProvider) {
    this.api = api;
  }

  registerModelToTableNameMaping = (modelName: string, tableName: string) => {
    this.modelToTableNameMap.set(modelName, tableName);
  };

  private ensureEnv = (): void => {
    if (!this.stackManager.getParameter('env')) {
      this.stackManager.addParameter('env', {
        type: 'String',
        default: 'NONE',
      });
    }
  };
}
