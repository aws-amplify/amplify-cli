import { GraphQLApiProvider, TransformerResourceHelperProvider } from '@aws-amplify/graphql-transformer-interfaces';
import { GraphqlApi } from '@aws-cdk/aws-appsync';
import { CfnParameter } from '@aws-cdk/core';
import { StackManager } from './stack-manager';

export class TransformerResourceHelper implements TransformerResourceHelperProvider {
  private api?: GraphQLApiProvider;
  constructor(private stackManager: StackManager) {}
  public generateResourceName = (name: string): string => {
    if (!this.api) {
      throw new Error('API not initalized');
    }
    this.ensureEnv();
    const env = (this.stackManager.getParameter('env') as CfnParameter).valueAsString;
    const apiId = this.api!.apiId;
    return `${name}-${apiId}-${env}`;
  };

  bind(api: GraphQLApiProvider) {
    this.api = api;
  }

  private ensureEnv = (): void => {
    if(!this.stackManager.getParameter('env')) {
      this.stackManager.addParameter('env', {
        type: 'String',
        default: 'NONE',
      });
    }
  }
}
