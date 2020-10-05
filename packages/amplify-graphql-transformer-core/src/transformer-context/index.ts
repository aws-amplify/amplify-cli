import {
  GraphQLApiProvider,
  StackManagerProvider,
  TransformerContextOutputProvider,
  TransformerContextProvider,
  TransformerDataSourceManagerProvider,
} from '@aws-amplify/graphql-transformer-interfaces';
import { App } from '@aws-cdk/core';
import { DocumentNode } from 'graphql';
import { GraphQLApi } from '../graphql-api';
import { TransformerDataSourceManager } from './datasource';
import { TransformerOutput } from './output';
import { TransformerContextProviderRegistry } from './provider-registry';
import { ResolverManager } from './resolver';
import { StackManager } from './stack-manager';

export class TransformerContext implements TransformerContextProvider {
  public readonly output: TransformerContextOutputProvider;
  public readonly resolvers: ResolverManager;
  public readonly dataSources: TransformerDataSourceManagerProvider;
  public readonly providerRegistry: TransformerContextProviderRegistry;
  public readonly stackManager: StackManagerProvider;
  public _api?: GraphQLApiProvider;
  constructor(app: App, public readonly inputDocument: DocumentNode, stackMapping: Record<string, string>) {
    this.output = new TransformerOutput(inputDocument);
    this.resolvers = new ResolverManager();
    this.dataSources = new TransformerDataSourceManager();
    this.providerRegistry = new TransformerContextProviderRegistry();
    this.stackManager = new StackManager(app, stackMapping);
  }

  /**
   * Internal method to set the GraphQL API
   * @param api API instance available publicaly when the transformation starts
   * @internal
   */
  public setApi(api: GraphQLApi) {
    this._api = api;
  }
  public get api(): GraphQLApiProvider {
    if (!this._api) {
      throw new Error('API is not initialized till generateResolver step');
    }
    return this._api!;
  }
}
