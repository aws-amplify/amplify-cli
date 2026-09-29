import { Source, GraphQLSchema } from 'graphql';
import slash from 'slash';
import { generateResolvers } from './schema';
import { VelocityTemplate } from './velocity';
import { getDataLoader, AmplifyAppSyncSimulatorDataLoader } from './data-loader';
import { AppSyncUnitResolver } from './resolvers';
import { AppSyncSimulatorServer } from './server';
export { addDataLoader, removeDataLoader } from './data-loader';
import { PubSub, withFilter } from 'graphql-subscriptions';
import { AmplifySimulatorFunction } from './resolvers/function';
import { AppSyncPipelineResolver } from './resolvers/pipeline-resolver';
import {
  AppSyncSimulatorServerConfig,
  AmplifyAppSyncSimulatorConfig,
  RESOLVER_KIND,
  AppSyncSimulatorPipelineResolverConfig,
  AppSyncSimulatorUnitResolverConfig,
  AmplifyAppSyncAPIConfig,
  AppSyncSimulatorMappingTemplate,
  AppSyncSimulatorDataSourceType,
} from './type-definition';
import { filterSubscriptions } from './utils';
export { AppSyncGraphQLExecutionContext, JWTToken, IAMToken } from './utils';
export * from './type-definition';
export * from './velocity';

const DEFAULT_API_CONFIG: Partial<AmplifyAppSyncAPIConfig> = {
  authRoleName: 'assumed-role/authRole/CognitoIdentityCredentials',
  unAuthRoleName: 'assumed-role/unAuthRole/CognitoIdentityCredentials',
  authAccessKeyId: 'ASIAVJKIAM-AuthRole', // when accessKeyId matches assume the authRole. Otherwise, use unAuthRole
  accountId: '12345678910',
  apiKey: 'DA-FAKEKEY',
};

export class AmplifyAppSyncSimulator {
  private resolvers;
  private dataSources: Map<string, AmplifyAppSyncSimulatorDataLoader>;
  private functions: Map<string, AmplifySimulatorFunction>;
  private mappingTemplates: Map<string, VelocityTemplate>;
  private _serverConfig: AppSyncSimulatorServerConfig;
  private _pubsub: PubSub;

  private rawSchema: string;
  private _schema: GraphQLSchema;
  private _server: AppSyncSimulatorServer;
  private _config: AmplifyAppSyncSimulatorConfig;
  private _appSyncConfig: AmplifyAppSyncAPIConfig;
  constructor(
    serverConfig: AppSyncSimulatorServerConfig = {
      port: 0,
      wsPort: 0,
    },
  ) {
    this._serverConfig = serverConfig;
    this._pubsub = new PubSub();
    try {
      this._server = new AppSyncSimulatorServer(serverConfig, this);
    } catch (e) {
      console.log('Could not start AppSync mock endpoint');
      console.log(e);
      throw e;
    }
  }

  reload(config: AmplifyAppSyncSimulatorConfig): void {
    this.init(config);
  }

  init(config: AmplifyAppSyncSimulatorConfig) {
    const lastMappingTemplates = this.mappingTemplates;
    const lastSchema = this._schema;
    const lastResolverMap = this.resolvers;
    const lastFunctions = this.functions;
    const lastDataSources = this.dataSources;
    try {
      this._appSyncConfig = { ...DEFAULT_API_CONFIG, ...config.appSync };
      this.mappingTemplates = (config.mappingTemplates || []).reduce((map, template) => {
        const normalizedTemplate: AppSyncSimulatorMappingTemplate = { content: template.content };
        if (template.path) {
          // Windows path normalization by replacing '\' with '/' as CFN references path with '/'
          normalizedTemplate.path = slash(template.path);
        }
        map.set(normalizedTemplate.path, new VelocityTemplate(normalizedTemplate, this));
        return map;
      }, new Map());

      this.dataSources = (config.dataSources || []).reduce((map, source) => {
        const dataLoader = getDataLoader(source.type);
        map.set(source.name, new dataLoader(source));
        return map;
      }, new Map());

      this.functions = (config.functions || []).reduce((map, fn) => {
        map.set(fn.name, new AmplifySimulatorFunction(fn, this));
        return map;
      }, new Map());

      this.resolvers = (config.resolvers || []).reduce((map, resolver) => {
        const fieldName = resolver.fieldName;
        const typeName = resolver.typeName;
        const resolveType = resolver.kind;
        const resolveName = `${typeName}:${fieldName}`;
        const resolverInst =
          resolveType === RESOLVER_KIND.PIPELINE
            ? new AppSyncPipelineResolver(resolver as AppSyncSimulatorPipelineResolverConfig, this)
            : new AppSyncUnitResolver(resolver as AppSyncSimulatorUnitResolverConfig, this);
        map.set(resolveName, resolverInst);
        return map;
      }, new Map());

      this._schema = generateResolvers(new Source(config.schema.content, config.schema.path), config.resolvers, this);
      this._config = config;
    } catch (e) {
      this._schema = lastSchema;
      this.resolvers = lastResolverMap;
      this.mappingTemplates = lastMappingTemplates;
      this.dataSources = lastDataSources;
      this.functions = lastFunctions;
      throw e;
    }
  }
  async start() {
    await this._server.start();
  }

  async stop() {
    await this._server.stop();
  }

  getMappingTemplate(path: string): VelocityTemplate {
    const template = this.mappingTemplates.get(path);
    if (!template) {
      throw new Error(`Missing mapping template ${path}`);
    }
    return template;
  }
  getDataLoader(sourceName: string) {
    const loader = this.dataSources.get(sourceName);
    if (!loader) {
      throw new Error(`Missing data source ${sourceName}`);
    }
    return loader;
  }

  getFunction(functionName: string) {
    const fn = this.functions.get(functionName);
    if (!fn) {
      throw new Error(`Missing function ${functionName}`);
    }
    return fn;
  }

  getResolver(typeName, fieldName) {
    return this.resolvers.get(`${typeName}:${fieldName}`);
  }
  // Iterates over all data sources and deletes all items for each table
  async clearData(): Promise<object> {
    const dataSourceIterator = this.dataSources.values();
    let deletedTables = [];
    let dataSource = dataSourceIterator.next();
    while (!dataSource.done) {
      if (dataSource.value.ddbConfig?.type === AppSyncSimulatorDataSourceType.DynamoDB) {
        deletedTables = [...deletedTables, ...(await dataSource.value.load({ operation: 'DeleteAllItems' }))];
      }
      dataSource = dataSourceIterator.next();
    }
    return deletedTables;
  }

  get schema(): GraphQLSchema {
    return this._schema;
  }

  get pubsub(): PubSub {
    return this._pubsub;
  }
  asyncIterator(trigger: string): AsyncIterator<any> {
    return withFilter(() => this._pubsub.asyncIterator(trigger), filterSubscriptions)();
  }

  get url(): string {
    return this._server.url.graphql;
  }
  get localhostUrl(): string {
    return this._server.localhostUrl.graphql;
  }
  get isHttps(): boolean {
    return this._server.isHttps;
  }
  get config(): AmplifyAppSyncSimulatorConfig {
    return this._config;
  }
  get appSyncConfig(): AmplifyAppSyncAPIConfig {
    return this._appSyncConfig;
  }
}
