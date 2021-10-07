import { GraphQLAPIProvider, TransformerResourceHelperProvider } from '@aws-amplify/graphql-transformer-interfaces';
import { CfnParameter } from '@aws-cdk/core';
import { StackManager } from './stack-manager';
import md5 from 'md5';

export class TransformerResourceHelper implements TransformerResourceHelperProvider {
  private api?: GraphQLAPIProvider;
  private modelToTableNameMap = new Map<string, string>();
  // eslint-disable-next-line no-useless-constructor
  constructor(private stackManager: StackManager) {}
  generateTableName = (modelName: string): string => {
    if (!this.api) {
      throw new Error('API not initialized');
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
  };

  public generateIAMRoleName = (name: string): string => {
    if (!this.api) {
      throw new Error('API not initialized');
    }
    this.ensureEnv();
    const env = (this.stackManager.getParameter('env') as CfnParameter).valueAsString;
    const apiId = this.api!.apiId;

    // 38 = 26(apiId) + 10(env) + 2(-)
    const shortName = name.slice(0, 64 - 38 - 6) + md5(name).slice(0, 6);
    return `${shortName}-${apiId}-${env}`; // max of 64.
  };

  bind(api: GraphQLAPIProvider) {
    this.api = api;
  }

  registerModelToTableNameMaping = (modelName: string, tableName: string) => {
    this.modelToTableNameMap.set(modelName, tableName);
  };

  getTableBaseName = (modelName: string) => this.modelToTableNameMap.get(modelName) ?? modelName;

  private ensureEnv = (): void => {
    if (!this.stackManager.getParameter('env')) {
      this.stackManager.addParameter('env', {
        type: 'String',
        default: 'NONE',
      });
    }
  };
}
