import { parse, Source, validate, specifiedRules, execute, GraphQLSchema, Kind } from 'graphql';
import { generateResolvers } from './schema';
// import { getMockConfig, getTodoConfig } from './fixtures/config';
import { VelocityTemplate } from './velocity';
import { getDataLoader, AmplifyAppSyncSimulatorDataLoader } from './data-loader';
import { AppSyncUnitResolver } from './resolvers';
import { AppSyncSimulatorServer } from './server';
export { addDataLoader, removeDataLoader } from './data-loader';
import { PubSub } from 'graphql-subscriptions';
import * as EventEmitter from 'events';
import { AmplifySimulatorFunction } from './resolvers/function';
import { AppSyncPipelineResolver } from './resolvers/pipeline-resolver';

export type AppSyncMockFile = {
  path?: string;
  content: string;
};
export type AppSyncVTLTemplate = AppSyncMockFile;

export type AppSyncSimulatorFunctionsConfig = {
  name: string;
  dataSourceName: string;
  requestMappingTemplateLocation: string;
  responseMappingTemplateLocation: string;
};

export enum RESOLVER_KIND {
  UNIT = 'UNIT',
  PIPELINE = 'PIPELINE'
}
export interface AppSyncSimulatorBaseResolverConfig {
  kind: RESOLVER_KIND;
  fieldName: string;
  typeName: string;
  requestMappingTemplateLocation: string;
  responseMappingTemplateLocation: string;
}
export interface AppSyncSimulatorUnitResolverConfig extends AppSyncSimulatorBaseResolverConfig {
  kind: RESOLVER_KIND.UNIT;
  dataSourceName: string;
}

export interface AppSyncSimulatorPipelineResolverConfig extends AppSyncSimulatorBaseResolverConfig {
  kind: RESOLVER_KIND.PIPELINE;
  functions: string[];
}

export interface AppSyncSimulatorFunctionResolverConfig {
  dataSourceName: string;
  requestMappingTemplateLocation: string;
  responseMappingTemplateLocation: string;
}

export type AppSyncSimulatorMappingTemplate = AppSyncMockFile;

export interface AppSyncSimulatorUnitResolver extends AppSyncSimulatorUnitResolverConfig {
  datSourceName: string;
}

export interface AppSyncSimulatorPipelineResolver extends AppSyncSimulatorUnitResolverConfig {
  functions: string[];
}

export interface AppSyncSimulatorDataSourceBaseConfig {
  name: string;
  type: string;
}
export interface AppSyncSimulatorDataSourceDDBConfig extends AppSyncSimulatorDataSourceBaseConfig {
  type: 'AMAZON_DYNAMODB';
  config: {
    endpoint: string;
    region?: string;
    accessKeyId?: string;
    secretAccessKey?: string;
    tableName: string;
  };
}
interface AppSyncSimulatorDataSourceNoneConfig extends AppSyncSimulatorDataSourceBaseConfig {}
export type AppSyncSimulatorDataSourceConfig = AppSyncSimulatorDataSourceDDBConfig | AppSyncSimulatorDataSourceNoneConfig;

export type AppSyncSimulatorSchemaConfig = AppSyncMockFile;
export type AppSyncSimulatorConfig = {
  schema: AppSyncSimulatorSchemaConfig;
  resolvers?: AppSyncSimulatorBaseResolverConfig[];
  functions?: AppSyncSimulatorFunctionsConfig[];
  dataSources?: AppSyncSimulatorDataSourceConfig[];
  mappingTemplates?: AppSyncSimulatorMappingTemplate[];
};

export type AppSyncSimulatorServerConfig = {
  port?: number;
  wsPort?: number;
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
  private _eventEmitter: EventEmitter;
  private _config: AppSyncSimulatorConfig;
  constructor(
    serverConfig: AppSyncSimulatorServerConfig = {
      port: 0,
      wsPort: 0
    }
  ) {
    this._serverConfig = serverConfig;
    this._pubsub = new PubSub();
    this._eventEmitter = new EventEmitter();

    try {
      this._server = new AppSyncSimulatorServer(serverConfig, this);
    } catch (e) {
      console.log(e);
      // XXX: Show error message but keep the server config
    }
  }

  reload(config: AppSyncSimulatorConfig): void {
    this.init(config);
  }

  init(config: AppSyncSimulatorConfig) {
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
        const { dataSourceName, requestMappingTemplateLocation, responseMappingTemplateLocation } = fn;
        map.set(
          fn.name,
          new AmplifySimulatorFunction(
            {
              dataSourceName,
              requestMappingTemplateLocation: requestMappingTemplateLocation,
              responseMappingTemplateLocation: responseMappingTemplateLocation
            },
            this
          )
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
        this
      );
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

  get schema() {
    return this._schema;
  }

  get pubsub() {
    return this._pubsub;
  }

  get url() {
    return this._server.url.graphql;
  }
  get config() {
    return this._config;
  }
}
