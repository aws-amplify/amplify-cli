import {
  FeatureFlagProvider,
  GraphQLAPIProvider,
  StackManagerProvider,
  TransformerContextOutputProvider,
  TransformerContextProvider,
  TransformerDataSourceManagerProvider,
} from '@aws-amplify/graphql-transformer-interfaces';
import { App } from '@aws-cdk/core';
import { DocumentNode } from 'graphql';
import { GraphQLApi } from '../graphql-api';
import { TransformerDataSourceManager } from './datasource';
import { NoopFeatureFlagProvider } from './noop-featuer-flag';
import { TransformerOutput } from './output';
import { TransformerContextProviderRegistry } from './provider-registry';
import { ResolverManager } from './resolver';
import { TransformerResourceHelper } from './resource-helper';
import { StackManager } from './stack-manager';

export class TransformerContext implements TransformerContextProvider {
  public readonly output: TransformerContextOutputProvider;
  public readonly resolvers: ResolverManager;
  public readonly dataSources: TransformerDataSourceManagerProvider;
  public readonly providerRegistry: TransformerContextProviderRegistry;
  public readonly stackManager: StackManagerProvider;
  public readonly resourceHelper: TransformerResourceHelper;
  public readonly featureFlags: FeatureFlagProvider;
  public _api?: GraphQLAPIProvider;
  constructor(app: App, public readonly inputDocument: DocumentNode, stackMapping: Record<string, string>, featuerFlags?: FeatureFlagProvider) {
    this.output = new TransformerOutput(inputDocument);
    this.resolvers = new ResolverManager();
    this.dataSources = new TransformerDataSourceManager();
    this.providerRegistry = new TransformerContextProviderRegistry();
    const stackManager = new  StackManager(app, stackMapping);
    this.stackManager = stackManager
    this.resourceHelper = new TransformerResourceHelper(stackManager);
    this.featureFlags = featuerFlags ?? new NoopFeatureFlagProvider();
  }

  /**
   * Internal method to set the GraphQL API
   * @param api API instance available publicaly when the transformation starts
   * @internal
   */
  public bind(api: GraphQLApi) {
    this._api = api;
    this.resourceHelper.bind(api);
  }
  public get api(): GraphQLAPIProvider {
    if (!this._api) {
      throw new Error('API is not initialized till generateResolver step');
    }
    return this._api!;
  }
}
