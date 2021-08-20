import { GraphQLAPIProvider, TransformerResourceHelperProvider } from '@aws-amplify/graphql-transformer-interfaces';
import { CfnParameter } from '@aws-cdk/core';
import { StackManager } from './stack-manager';

export class TransformerResourceHelper implements TransformerResourceHelperProvider {
  private api?: GraphQLAPIProvider;
  // eslint-disable-next-line no-useless-constructor
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

  bind(api: GraphQLAPIProvider) {
    this.api = api;
  }

  private ensureEnv = (): void => {
    if (!this.stackManager.getParameter('env')) {
      this.stackManager.addParameter('env', {
        type: 'String',
        default: 'NONE',
      });
    }
  };
}
