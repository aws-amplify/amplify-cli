import { parse, Source, validate, specifiedRules, execute, GraphQLSchema, Kind } from 'graphql';
import { generateResolvers } from './schema';
import { VelocityTemplate } from './velocity';
import { getDataLoader, AmplifyAppSyncSimulatorDataLoader } from './data-loader';
import { AppSyncUnitResolver } from './resolvers';
import { AppSyncSimulatorServer } from './server';
export { addDataLoader, removeDataLoader } from './data-loader';
import { PubSub } from 'graphql-subscriptions';
import * as EventEmitter from 'events';
import { AmplifySimulatorFunction } from './resolvers/function';
import { AppSyncPipelineResolver } from './resolvers/pipeline-resolver';
import {
  AppSyncSimulatorServerConfig,
  AmplifyAppSyncSimulatorConfig,
  RESOLVER_KIND,
  AppSyncSimulatorPipelineResolverConfig,
  AppSyncSimulatorUnitResolverConfig,
  AmplifyAppSyncAPIConfig,
} from './type-definition';
export * from './type-definition';

const DEFAULT_SCHEMA = `
type Query {
  noop: String
}
`;
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
      this.mappingTemplates = config.mappingTemplates.reduce((map, template) => {
        map.set(template.path, new VelocityTemplate(template));
        return map;
      }, new Map());

      this.dataSources = config.dataSources.reduce((map, source) => {
        const dataLoader = getDataLoader(source.type);
        map.set(source.name, new dataLoader(source));
        return map;
      }, new Map());

      this.functions = (config.functions || []).reduce((map, fn) => {
        const {
          dataSourceName,
          requestMappingTemplateLocation,
          responseMappingTemplateLocation,
        } = fn;
        map.set(
          fn.name,
          new AmplifySimulatorFunction(
            {
              dataSourceName,
              requestMappingTemplateLocation: requestMappingTemplateLocation,
              responseMappingTemplateLocation: responseMappingTemplateLocation,
            },
            this,
          ),
        );
        return map;
      }, new Map());

      this.resolvers = config.resolvers.reduce((map, resolver) => {
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

      this._schema = generateResolvers(
        new Source(config.schema.content, config.schema.path),
        config.resolvers,
        this,
      );
      this._config = config;
      this._appSyncConfig = config.appSync;
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

  stop() {
    this._server.stop();
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

  get schema(): GraphQLSchema {
    return this._schema;
  }

  get pubsub(): PubSub {
    return this._pubsub;
  }

  get url(): string {
    return this._server.url.graphql;
  }
  get config(): AmplifyAppSyncSimulatorConfig {
    return this._config;
  }
  get appSyncConfig(): AmplifyAppSyncAPIConfig {
    return this._appSyncConfig;
  }
}
