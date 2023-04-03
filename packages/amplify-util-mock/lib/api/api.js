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
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.APITest = exports.MOCK_API_PORT = exports.MOCK_API_KEY = exports.GRAPHQL_API_KEY_OUTPUT = exports.GRAPHQL_API_ENDPOINT_OUTPUT = void 0;
const fs = __importStar(require("fs-extra"));
const dynamoEmulator = __importStar(require("amplify-dynamodb-simulator"));
const amplify_appsync_simulator_1 = require("@aws-amplify/amplify-appsync-simulator");
const opensearchEmulator = __importStar(require("@aws-amplify/amplify-opensearch-simulator"));
const amplify_cli_core_1 = require("amplify-cli-core");
const amplify_codegen_1 = require("amplify-codegen");
const path = __importStar(require("path"));
const chokidar = __importStar(require("chokidar"));
const lodash_1 = __importDefault(require("lodash"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const utils_1 = require("../utils");
const index_1 = require("../utils/index");
const run_graphql_transformer_1 = require("./run-graphql-transformer");
const CFNParser_1 = require("../CFNParser");
const resolver_overrides_1 = require("./resolver-overrides");
const config_override_1 = require("../utils/config-override");
const dynamo_db_1 = require("../utils/dynamo-db");
const utils_2 = require("../utils/dynamo-db/utils");
const find_lambda_triggers_1 = require("../utils/lambda/find-lambda-triggers");
const mock_config_file_1 = require("../utils/mock-config-file");
const amplify_category_function_1 = require("@aws-amplify/amplify-category-function");
const lambda_arn_to_config_1 = require("./lambda-arn-to-config");
const func_1 = require("../func");
const lambda_trigger_handler_1 = require("./lambda-trigger-handler");
const opensearch_1 = require("../utils/opensearch");
const mock_directory_1 = require("../utils/mock-directory");
const lambda_invoke_1 = require("./lambda-invoke");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
exports.GRAPHQL_API_ENDPOINT_OUTPUT = 'GraphQLAPIEndpointOutput';
exports.GRAPHQL_API_KEY_OUTPUT = 'GraphQLAPIKeyOutput';
exports.MOCK_API_KEY = 'da2-fakeApiId123456';
exports.MOCK_API_PORT = 20002;
class APITest {
    constructor() {
        this.apiParameters = {};
        this.userOverriddenSlots = [];
        this.searchableTables = [];
    }
    async start(context, port = exports.MOCK_API_PORT, wsPort = exports.MOCK_API_PORT) {
        var _a;
        try {
            context.amplify.addCleanUpTask(async (context) => {
                await this.stop(context);
            });
            this.configOverrideManager = await config_override_1.ConfigOverrideManager.getInstance(context);
            await (0, index_1.checkJavaVersion)(context);
            this.apiName = await this.getAppSyncAPI(context);
            const isLocalDBEmpty = !fs.existsSync((0, utils_1.getMockDataDirectory)(context));
            this.ddbClient = await this.startDynamoDBLocalServer(context);
            const resolverDirectory = await this.getResolverTemplateDirectory(context);
            this.resolverOverrideManager = new resolver_overrides_1.ResolverOverrides(resolverDirectory);
            this.apiParameters = await this.loadAPIParameters(context);
            this.appSyncSimulator = new amplify_appsync_simulator_1.AmplifyAppSyncSimulator({
                port,
                wsPort,
            });
            await this.appSyncSimulator.start();
            await this.resolverOverrideManager.start();
            await this.watch(context);
            const appSyncConfig = await this.runTransformer(context, this.apiParameters);
            if (((_a = appSyncConfig === null || appSyncConfig === void 0 ? void 0 : appSyncConfig.tables) === null || _a === void 0 ? void 0 : _a.some((table) => table === null || table === void 0 ? void 0 : table.isSearchable)) && !(0, amplify_cli_core_1.isWindowsPlatform)()) {
                this.opensearchURL = await this.startOpensearchLocalServer(context, isLocalDBEmpty);
            }
            this.appSyncSimulator.init(appSyncConfig);
            await this.generateTestFrontendExports(context);
            await this.generateCode(context, appSyncConfig);
            context.print.info(`AppSync Mock endpoint is running at ${this.appSyncSimulator.url}`);
            await this.startDDBListeners(context, appSyncConfig, false);
        }
        catch (e) {
            const errMessage = 'Failed to start API Mocking.';
            context.print.error(errMessage + ' Running cleanup tasks.');
            await this.stop(context);
            throw new amplify_cli_core_1.AmplifyFault('MockProcessFault', {
                message: `${errMessage}. Reason: ${e === null || e === void 0 ? void 0 : e.message}`,
                link: amplify_cli_core_1.AMPLIFY_SUPPORT_DOCS.CLI_GRAPHQL_TROUBLESHOOTING.url,
            });
        }
    }
    async stop(context) {
        var _a;
        this.ddbClient = null;
        if (this.watcher) {
            await this.watcher.close();
            this.watcher = null;
        }
        try {
            if (this.ddbEmulator) {
                await this.ddbEmulator.terminate();
                this.ddbEmulator = null;
            }
        }
        catch (e) {
            amplify_prompts_1.printer.error(`Failed to stop DynamoDB Local Server ${e.message}`);
        }
        try {
            if (this.opensearchEmulator) {
                await this.opensearchEmulator.terminate();
                this.opensearchEmulator = null;
                this.opensearchURL = null;
            }
        }
        catch (e) {
            amplify_prompts_1.printer.error(`Failed to stop OpenSearch Local Server ${e.message}. Kill the mock process using "kill -9 ${(_a = this.opensearchEmulator) === null || _a === void 0 ? void 0 : _a.pid}" and restart it.`);
        }
        if (this.appSyncSimulator) {
            await this.appSyncSimulator.stop();
        }
        if (this.resolverOverrideManager) {
            this.resolverOverrideManager.stop();
        }
    }
    async runTransformer(context, parameters = {}) {
        const { transformerOutput } = await (0, run_graphql_transformer_1.runTransformer)(context);
        let config = (0, CFNParser_1.processAppSyncResources)(transformerOutput, parameters);
        config = await this.ensureDDBTables(config);
        config = this.configureDDBDataSource(config);
        this.transformerResult = await this.configureLambdaDataSource(context, config);
        this.transformerResult = await this.configureOpensearchDataSource(this.transformerResult);
        this.userOverriddenSlots = transformerOutput.userOverriddenSlots;
        const overriddenTemplates = await this.resolverOverrideManager.sync(this.transformerResult.mappingTemplates, this.userOverriddenSlots);
        return { ...this.transformerResult, mappingTemplates: overriddenTemplates };
    }
    async generateCode(context, config = null) {
        try {
            amplify_prompts_1.printer.info('Running GraphQL codegen');
            const { projectPath } = context.amplify.getEnvInfo();
            const schemaPath = path.join(projectPath, 'amplify', 'backend', 'api', this.apiName, 'build', 'schema.graphql');
            if (config && config.schema) {
                fs.writeFileSync(schemaPath, config.schema.content);
            }
            if (!(0, amplify_codegen_1.isCodegenConfigured)(context, this.apiName)) {
                await (0, amplify_codegen_1.add)(context);
            }
            else {
                (0, amplify_codegen_1.switchToSDLSchema)(context, this.apiName);
                await (0, amplify_codegen_1.generate)(context);
            }
        }
        catch (e) {
            amplify_prompts_1.printer.info(`Failed to run GraphQL codegen with following error:\n${e.message}`);
        }
    }
    async reload(context, filePath, action) {
        const apiDir = await this.getAPIBackendDirectory(context);
        const inputSchemaPath = path.join(apiDir, 'schema');
        const customStackPath = path.join(apiDir, 'stacks');
        const parameterFilePath = await this.getAPIParameterFilePath(context);
        try {
            let shouldReload;
            if (this.resolverOverrideManager.isTemplateFile(filePath, action === 'unlink' ? true : false)) {
                switch (action) {
                    case 'add':
                        shouldReload = this.resolverOverrideManager.onAdd(filePath);
                        break;
                    case 'change':
                        shouldReload = this.resolverOverrideManager.onChange(filePath);
                        break;
                    case 'unlink':
                        shouldReload = this.resolverOverrideManager.onUnlink(filePath);
                        break;
                }
                if (shouldReload) {
                    amplify_prompts_1.printer.info('Mapping template change detected. Reloading...');
                    const mappingTemplates = this.resolverOverrideManager.sync(this.transformerResult.mappingTemplates, this.userOverriddenSlots);
                    await this.appSyncSimulator.reload({
                        ...this.transformerResult,
                        mappingTemplates,
                    });
                }
            }
            else if (filePath.includes(inputSchemaPath)) {
                amplify_prompts_1.printer.info('GraphQL Schema change detected. Reloading...');
                const config = await this.runTransformer(context, this.apiParameters);
                await this.appSyncSimulator.reload(config);
                await this.generateCode(context, config);
                await this.startDDBListeners(context, config, true);
            }
            else if (filePath.includes(parameterFilePath)) {
                const apiParameters = await this.loadAPIParameters(context);
                if (JSON.stringify(apiParameters) !== JSON.stringify(this.apiParameters)) {
                    context.print.info('API Parameter change detected. Reloading...');
                    this.apiParameters = apiParameters;
                    const config = await this.runTransformer(context, this.apiParameters);
                    await this.appSyncSimulator.reload(config);
                    await this.generateCode(context, config);
                }
            }
            else if (filePath.includes(customStackPath)) {
                amplify_prompts_1.printer.info('Custom stack change detected. Reloading...');
                const config = await this.runTransformer(context, this.apiParameters);
                await this.appSyncSimulator.reload(config);
                await this.generateCode(context, config);
                await this.startDDBListeners(context, config, true);
            }
            else if ((filePath === null || filePath === void 0 ? void 0 : filePath.includes((0, utils_1.getMockDataDirectory)(context))) && action === 'unlink') {
                amplify_prompts_1.printer.info('Mock DB deletion detected. Clearing the OpenSearch indices...');
                await this.clearAllIndices(this.opensearchURL);
            }
        }
        catch (e) {
            amplify_prompts_1.printer.info(`Reloading failed with error\n${e}`);
        }
    }
    async generateTestFrontendExports(context) {
        await this.generateFrontendExports(context, {
            endpoint: `${this.appSyncSimulator.url}/graphql`,
            name: this.apiName,
            GraphQLAPIKeyOutput: this.transformerResult.appSync.apiKey,
            additionalAuthenticationProviders: [],
            securityType: this.transformerResult.appSync.authenticationType,
            testMode: true,
        });
    }
    async ensureDDBTables(config) {
        return await (0, dynamo_db_1.createAndUpdateTable)(this.ddbClient, config);
    }
    async startDDBListeners(context, config, onlyNewTables) {
        var _a, _b, _c, _d, _e;
        let tables = config === null || config === void 0 ? void 0 : config.tables;
        const searchableEnabledTableNames = (_b = (_a = config === null || config === void 0 ? void 0 : config.tables) === null || _a === void 0 ? void 0 : _a.filter((table) => table === null || table === void 0 ? void 0 : table.isSearchable)) === null || _b === void 0 ? void 0 : _b.map((table) => { var _a; return (_a = table === null || table === void 0 ? void 0 : table.Properties) === null || _a === void 0 ? void 0 : _a.TableName; });
        if (onlyNewTables) {
            tables = (_c = config === null || config === void 0 ? void 0 : config.tables) === null || _c === void 0 ? void 0 : _c.filter((table) => table === null || table === void 0 ? void 0 : table.isNewlyAdded);
        }
        const tableNames = tables === null || tables === void 0 ? void 0 : tables.map((t) => { var _a; return (_a = t === null || t === void 0 ? void 0 : t.Properties) === null || _a === void 0 ? void 0 : _a.TableName; });
        let newlyAddedSearchableTableNames = [];
        if (!lodash_1.default.isEmpty(searchableEnabledTableNames)) {
            newlyAddedSearchableTableNames = searchableEnabledTableNames.filter((tableName) => !this.searchableTables.includes(tableName));
        }
        this.searchableTables = searchableEnabledTableNames;
        if (!lodash_1.default.isEmpty(tableNames)) {
            const modelLambdaTriggers = await (0, find_lambda_triggers_1.findModelLambdaTriggers)(context, tableNames);
            const searchableLambdaTriggers = await (0, find_lambda_triggers_1.findSearchableLambdaTriggers)(context, newlyAddedSearchableTableNames, this.opensearchURL);
            const allLambdaTriggers = modelLambdaTriggers;
            (_d = Object.entries(searchableLambdaTriggers)) === null || _d === void 0 ? void 0 : _d.forEach(([tableName, lambdaTrigger]) => {
                if (allLambdaTriggers[tableName]) {
                    allLambdaTriggers[tableName].push(lambdaTrigger);
                }
                else {
                    allLambdaTriggers[tableName] = [lambdaTrigger];
                }
            });
            const allTablesWithTriggers = Object.keys(allLambdaTriggers);
            const tableStreamArns = await (0, utils_2.describeTables)(this.ddbClient, allTablesWithTriggers);
            const allListeners = [];
            (_e = Object.entries(allLambdaTriggers)) === null || _e === void 0 ? void 0 : _e.forEach(([tableName, lambdaTriggers]) => {
                if (!lodash_1.default.isEmpty(lambdaTriggers)) {
                    lambdaTriggers.forEach((lambdaTrigger) => {
                        allListeners.push((0, lambda_trigger_handler_1.ddbLambdaTriggerHandler)(context, tableStreamArns[tableName].LatestStreamArn, lambdaTrigger, this.ddbEmulator.url));
                    });
                }
            });
            await Promise.all(allListeners);
        }
    }
    async configureLambdaDataSource(context, config) {
        const lambdaDataSources = config.dataSources.filter((d) => d.type === 'AWS_LAMBDA');
        if (lambdaDataSources.length === 0) {
            return config;
        }
        return {
            ...config,
            dataSources: await Promise.all(config.dataSources.map(async (d) => {
                if (d.type !== 'AWS_LAMBDA') {
                    return d;
                }
                const lambdaConfig = await (0, lambda_arn_to_config_1.lambdaArnToConfig)(context, d.LambdaFunctionArn);
                const invoker = await (0, amplify_category_function_1.getInvoker)(context, {
                    resourceName: lambdaConfig.name,
                    handler: lambdaConfig.handler,
                    envVars: lambdaConfig.environment,
                });
                return {
                    ...d,
                    invoke: (payload) => {
                        return (0, func_1.timeConstrainedInvoker)(invoker({
                            event: payload,
                        }), context.input.options);
                    },
                };
            })),
        };
    }
    async configureOpensearchDataSource(config) {
        if ((0, amplify_cli_core_1.isWindowsPlatform)()) {
            return config;
        }
        const opensearchDataSourceType = 'AMAZON_ELASTICSEARCH';
        const opensearchDataSources = config.dataSources.filter((d) => d.type === opensearchDataSourceType);
        if (lodash_1.default.isEmpty(opensearchDataSources)) {
            return config;
        }
        return {
            ...config,
            dataSources: await Promise.all(config.dataSources.map(async (d) => {
                if (d.type !== opensearchDataSourceType) {
                    return d;
                }
                return {
                    ...d,
                    invoke: async (payload) => {
                        return await (0, opensearch_1.querySearchable)(this.opensearchURL, payload);
                    },
                };
            })),
        };
    }
    async watch(context) {
        this.watcher = await this.registerWatcher(context);
        this.watcher
            .on('add', (path) => {
            void this.reload(context, path, 'add');
        })
            .on('change', (path) => {
            void this.reload(context, path, 'change');
        })
            .on('unlink', (path) => {
            void this.reload(context, path, 'unlink');
        });
    }
    configureDDBDataSource(config) {
        const ddbConfig = this.ddbClient.config;
        return (0, dynamo_db_1.configureDDBDataSource)(config, ddbConfig);
    }
    async getAppSyncAPI(context) {
        const currentMeta = await (0, utils_1.getAmplifyMeta)(context);
        const { api: apis = {} } = currentMeta;
        let name = null;
        Object.entries(apis).some((entry) => {
            if (entry[1].service === 'AppSync' && entry[1].providerPlugin === 'awscloudformation') {
                name = entry[0];
                return true;
            }
            return undefined;
        });
        if (!name) {
            throw new amplify_cli_core_1.AmplifyFault('MockProcessFault', {
                message: 'No AppSync API is added to the project',
                link: amplify_cli_core_1.AMPLIFY_SUPPORT_DOCS.CLI_GRAPHQL_TROUBLESHOOTING.url,
            });
        }
        return name;
    }
    async startDynamoDBLocalServer(context) {
        const dbPath = path.join(await (0, utils_1.getMockDataDirectory)(context), 'dynamodb');
        fs.ensureDirSync(dbPath);
        const mockConfig = await (0, mock_config_file_1.getMockConfig)(context);
        this.ddbEmulator = await dynamoEmulator.launch({
            dbPath,
            port: null,
            ...mockConfig,
        });
        return dynamoEmulator.getClient(this.ddbEmulator);
    }
    async startOpensearchLocalServer(context, isLocalDBEmpty) {
        try {
            const mockConfig = await (0, mock_config_file_1.getMockConfig)(context);
            await this.createMockSearchableArtifacts(context);
            (0, index_1.checkJavaHome)();
            this.opensearchEmulator = await opensearchEmulator.launch((0, mock_directory_1.getMockOpensearchDataDirectory)(context), {
                port: null,
                ...mockConfig,
            });
            if (isLocalDBEmpty) {
                await this.clearAllIndices(this.opensearchEmulator.url);
            }
            return this.opensearchEmulator.url;
        }
        catch (error) {
            throw new amplify_cli_core_1.AmplifyFault('MockProcessFault', {
                message: 'Unable to start the local OpenSearch Instance.',
                details: (error === null || error === void 0 ? void 0 : error.message) || '',
                link: amplify_cli_core_1.AMPLIFY_SUPPORT_DOCS.CLI_GRAPHQL_TROUBLESHOOTING.url,
            });
        }
    }
    async clearAllIndices(openSearchURL) {
        if (!openSearchURL) {
            return;
        }
        const errMessage = 'Unable to Clear the local OpenSearch Indices.';
        try {
            const url = openSearchURL.toString() + '*';
            const result = await (0, node_fetch_1.default)(url, {
                method: 'DELETE',
                headers: {
                    'Content-type': 'application/json',
                },
            });
            const status = await result.json();
            if (!(status === null || status === void 0 ? void 0 : status.acknowledged)) {
                throw new amplify_cli_core_1.AmplifyFault('MockProcessFault', {
                    message: 'The action to delete all items in an index is not acknowledged by the Opensearch server.',
                    link: amplify_cli_core_1.AMPLIFY_SUPPORT_DOCS.CLI_GRAPHQL_TROUBLESHOOTING.url,
                });
            }
        }
        catch (error) {
            throw new amplify_cli_core_1.AmplifyFault('MockProcessFault', {
                message: errMessage,
                link: amplify_cli_core_1.AMPLIFY_SUPPORT_DOCS.CLI_GRAPHQL_TROUBLESHOOTING.url,
            }, error);
        }
    }
    async createMockSearchableArtifacts(context) {
        const opensearchLocalDirectory = opensearchEmulator === null || opensearchEmulator === void 0 ? void 0 : opensearchEmulator.getOpensearchLocalDirectory();
        fs.ensureDirSync(opensearchLocalDirectory);
        const mockSearchableTriggerDirectory = (0, utils_1.getMockSearchableTriggerDirectory)(context);
        fs.ensureDirSync(mockSearchableTriggerDirectory);
        fs.ensureDirSync(path.join(mockSearchableTriggerDirectory, 'src'));
        const searchableLambdaResourceDir = path.resolve(__dirname, '..', '..', 'resources', 'mock-searchable-lambda-trigger');
        const pipFileName = 'Pipfile';
        fs.copySync(path.join(searchableLambdaResourceDir, pipFileName), path.join(mockSearchableTriggerDirectory, pipFileName), {
            overwrite: true,
        });
        fs.copySync(path.join(searchableLambdaResourceDir, 'source-files'), path.join(mockSearchableTriggerDirectory, 'src'), {
            overwrite: true,
        });
        const triggerConfig = (0, find_lambda_triggers_1.getSearchableLambdaTriggerConfig)(context, null);
        const runtimeManager = await context.amplify.loadRuntimePlugin(context, triggerConfig === null || triggerConfig === void 0 ? void 0 : triggerConfig.runtimePluginId);
        amplify_prompts_1.printer.info('Building the searchable lambda trigger');
        await (0, lambda_invoke_1.buildLambdaTrigger)(runtimeManager, triggerConfig);
        fs.ensureDirSync((0, mock_directory_1.getMockOpensearchDataDirectory)(context));
    }
    async getAPIBackendDirectory(context) {
        const { projectPath } = context.amplify.getEnvInfo();
        return path.join(projectPath, 'amplify', 'backend', 'api', this.apiName);
    }
    async getAPIParameterFilePath(context) {
        const backendPath = await this.getAPIBackendDirectory(context);
        return path.join(backendPath, 'parameters.json');
    }
    async loadAPIParameters(context) {
        const paramPath = await this.getAPIParameterFilePath(context);
        if (!fs.existsSync(paramPath)) {
            return {};
        }
        try {
            return JSON.parse(fs.readFileSync(paramPath, 'utf8'));
        }
        catch (e) {
            e.message = `Failed to load API parameters.json \n ${e.message}`;
            throw e;
        }
    }
    async getResolverTemplateDirectory(context) {
        const apiDirectory = await this.getAPIBackendDirectory(context);
        return apiDirectory;
    }
    async registerWatcher(context) {
        const watchDir = await this.getAPIBackendDirectory(context);
        const watchMockDataDir = await (0, utils_1.getMockDataDirectory)(context);
        return chokidar.watch([watchDir, watchMockDataDir], {
            interval: 100,
            ignoreInitial: true,
            followSymlinks: false,
            ignored: ['**/build/**', '**/*db-journal'],
            awaitWriteFinish: true,
        });
    }
    async generateFrontendExports(context, localAppSyncDetails) {
        const currentMeta = await (0, utils_1.getAmplifyMeta)(context);
        const override = currentMeta.api || {};
        if (localAppSyncDetails) {
            const appSyncApi = override[localAppSyncDetails.name] || { output: {} };
            override[localAppSyncDetails.name] = {
                service: 'AppSync',
                ...appSyncApi,
                output: {
                    ...appSyncApi.output,
                    GraphQLAPIEndpointOutput: localAppSyncDetails.endpoint,
                    projectRegion: localAppSyncDetails.region,
                    aws_appsync_authenticationType: localAppSyncDetails.securityType,
                    GraphQLAPIKeyOutput: localAppSyncDetails.GraphQLAPIKeyOutput,
                },
                testMode: localAppSyncDetails.testMode,
                lastPushTimeStamp: new Date(),
            };
        }
        this.configOverrideManager.addOverride('api', override);
        await this.configOverrideManager.generateOverriddenFrontendExports(context);
    }
}
exports.APITest = APITest;
//# sourceMappingURL=api.js.map