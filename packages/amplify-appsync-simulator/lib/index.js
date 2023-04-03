"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AmplifyAppSyncSimulator = exports.removeDataLoader = exports.addDataLoader = void 0;
const graphql_1 = require("graphql");
const slash_1 = __importDefault(require("slash"));
const schema_1 = require("./schema");
const velocity_1 = require("./velocity");
const data_loader_1 = require("./data-loader");
const resolvers_1 = require("./resolvers");
const server_1 = require("./server");
var data_loader_2 = require("./data-loader");
Object.defineProperty(exports, "addDataLoader", { enumerable: true, get: function () { return data_loader_2.addDataLoader; } });
Object.defineProperty(exports, "removeDataLoader", { enumerable: true, get: function () { return data_loader_2.removeDataLoader; } });
const graphql_subscriptions_1 = require("graphql-subscriptions");
const function_1 = require("./resolvers/function");
const pipeline_resolver_1 = require("./resolvers/pipeline-resolver");
const type_definition_1 = require("./type-definition");
const utils_1 = require("./utils");
__exportStar(require("./type-definition"), exports);
__exportStar(require("./velocity"), exports);
const DEFAULT_API_CONFIG = {
    authRoleName: 'assumed-role/authRole/CognitoIdentityCredentials',
    unAuthRoleName: 'assumed-role/unAuthRole/CognitoIdentityCredentials',
    authAccessKeyId: 'ASIAVJKIAM-AuthRole',
    accountId: '12345678910',
    apiKey: 'DA-FAKEKEY',
};
class AmplifyAppSyncSimulator {
    constructor(serverConfig = {
        port: 0,
        wsPort: 0,
    }) {
        this._serverConfig = serverConfig;
        this._pubsub = new graphql_subscriptions_1.PubSub();
        try {
            this._server = new server_1.AppSyncSimulatorServer(serverConfig, this);
        }
        catch (e) {
            console.log('Could not start AppSync mock endpoint');
            console.log(e);
            throw e;
        }
    }
    reload(config) {
        this.init(config);
    }
    init(config) {
        const lastMappingTemplates = this.mappingTemplates;
        const lastSchema = this._schema;
        const lastResolverMap = this.resolvers;
        const lastFunctions = this.functions;
        const lastDataSources = this.dataSources;
        try {
            this._appSyncConfig = { ...DEFAULT_API_CONFIG, ...config.appSync };
            this.mappingTemplates = (config.mappingTemplates || []).reduce((map, template) => {
                const normalizedTemplate = { content: template.content };
                if (template.path) {
                    normalizedTemplate.path = (0, slash_1.default)(template.path);
                }
                map.set(normalizedTemplate.path, new velocity_1.VelocityTemplate(normalizedTemplate, this));
                return map;
            }, new Map());
            this.dataSources = (config.dataSources || []).reduce((map, source) => {
                const dataLoader = (0, data_loader_1.getDataLoader)(source.type);
                map.set(source.name, new dataLoader(source));
                return map;
            }, new Map());
            this.functions = (config.functions || []).reduce((map, fn) => {
                map.set(fn.name, new function_1.AmplifySimulatorFunction(fn, this));
                return map;
            }, new Map());
            this.resolvers = (config.resolvers || []).reduce((map, resolver) => {
                const fieldName = resolver.fieldName;
                const typeName = resolver.typeName;
                const resolveType = resolver.kind;
                const resolveName = `${typeName}:${fieldName}`;
                const resolverInst = resolveType === type_definition_1.RESOLVER_KIND.PIPELINE
                    ? new pipeline_resolver_1.AppSyncPipelineResolver(resolver, this)
                    : new resolvers_1.AppSyncUnitResolver(resolver, this);
                map.set(resolveName, resolverInst);
                return map;
            }, new Map());
            this._schema = (0, schema_1.generateResolvers)(new graphql_1.Source(config.schema.content, config.schema.path), config.resolvers, this);
            this._config = config;
        }
        catch (e) {
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
    getMappingTemplate(path) {
        const template = this.mappingTemplates.get(path);
        if (!template) {
            throw new Error(`Missing mapping template ${path}`);
        }
        return template;
    }
    getDataLoader(sourceName) {
        const loader = this.dataSources.get(sourceName);
        if (!loader) {
            throw new Error(`Missing data source ${sourceName}`);
        }
        return loader;
    }
    getFunction(functionName) {
        const fn = this.functions.get(functionName);
        if (!fn) {
            throw new Error(`Missing function ${functionName}`);
        }
        return fn;
    }
    getResolver(typeName, fieldName) {
        return this.resolvers.get(`${typeName}:${fieldName}`);
    }
    async clearData() {
        var _a;
        const dataSourceIterator = this.dataSources.values();
        let deletedTables = [];
        let dataSource = dataSourceIterator.next();
        while (!dataSource.done) {
            if (((_a = dataSource.value.ddbConfig) === null || _a === void 0 ? void 0 : _a.type) === "AMAZON_DYNAMODB") {
                deletedTables = [...deletedTables, ...(await dataSource.value.load({ operation: 'DeleteAllItems' }))];
            }
            dataSource = dataSourceIterator.next();
        }
        return deletedTables;
    }
    get schema() {
        return this._schema;
    }
    get pubsub() {
        return this._pubsub;
    }
    asyncIterator(trigger) {
        return (0, graphql_subscriptions_1.withFilter)(() => this._pubsub.asyncIterator(trigger), utils_1.filterSubscriptions)();
    }
    get url() {
        return this._server.url.graphql;
    }
    get config() {
        return this._config;
    }
    get appSyncConfig() {
        return this._appSyncConfig;
    }
}
exports.AmplifyAppSyncSimulator = AmplifyAppSyncSimulator;
//# sourceMappingURL=index.js.map