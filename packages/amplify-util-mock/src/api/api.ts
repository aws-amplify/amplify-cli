import * as fs from 'fs-extra';
import * as dynamoEmulator from 'amplify-dynamodb-simulator';
import { AmplifyAppSyncSimulator, AmplifyAppSyncSimulatorConfig } from '@aws-amplify/amplify-appsync-simulator';
import * as opensearchEmulator from '@aws-amplify/amplify-opensearch-simulator';
import { $TSContext, $TSAny, AmplifyFault, AMPLIFY_SUPPORT_DOCS, isWindowsPlatform, AmplifyError } from '@aws-amplify/amplify-cli-core';
import { add, generate, isCodegenConfigured, switchToSDLSchema } from 'amplify-codegen';
import * as path from 'path';
import * as chokidar from 'chokidar';
import _ from 'lodash';
import fetch from 'node-fetch';

import { getAmplifyMeta, getMockDataDirectory, getMockSearchableTriggerDirectory } from '../utils';
import { checkJavaVersion, checkJavaHome } from '../utils/index';
import { runTransformer } from './run-graphql-transformer';
import { processAppSyncResources } from '../CFNParser';
import { ResolverOverrides } from './resolver-overrides';
import { ConfigOverrideManager } from '../utils/config-override';
import { configureDDBDataSource, createAndUpdateTable } from '../utils/dynamo-db';
import { describeTables } from '../utils/dynamo-db/utils';
import {
  findModelLambdaTriggers,
  findSearchableLambdaTriggers,
  getSearchableLambdaTriggerConfig,
  LambdaTrigger,
} from '../utils/lambda/find-lambda-triggers';
import { getMockConfig } from '../utils/mock-config-file';
import { getInvoker } from '@aws-amplify/amplify-category-function';
import { lambdaArnToConfig } from './lambda-arn-to-config';
import { timeConstrainedInvoker } from '../func';
import { ddbLambdaTriggerHandler } from './lambda-trigger-handler';
import { TableDescription } from '@aws-sdk/client-dynamodb';
import { querySearchable } from '../utils/opensearch';
import { getMockOpensearchDataDirectory } from '../utils/mock-directory';
import { buildLambdaTrigger } from './lambda-invoke';
import { printer } from '@aws-amplify/amplify-prompts';

export const GRAPHQL_API_ENDPOINT_OUTPUT = 'GraphQLAPIEndpointOutput';
export const GRAPHQL_API_KEY_OUTPUT = 'GraphQLAPIKeyOutput';
export const MOCK_API_KEY = 'da2-fakeApiId123456';
export const MOCK_API_PORT = 20002;
const errorSuffix = `\n For troubleshooting the GraphQL API, visit ${AMPLIFY_SUPPORT_DOCS.CLI_GRAPHQL_TROUBLESHOOTING.url} `;

export class APITest {
  private apiName: string;
  private transformerResult: any;
  private ddbClient;
  private opensearchURL;
  private appSyncSimulator: AmplifyAppSyncSimulator;
  private resolverOverrideManager: ResolverOverrides;
  private watcher: chokidar.FSWatcher;
  private ddbEmulator;
  private opensearchEmulator;
  private configOverrideManager: ConfigOverrideManager;
  private apiParameters: object = {};
  private userOverriddenSlots: string[] = [];
  private searchableTables: string[] = [];

  async start(
    context,
    port: number = MOCK_API_PORT,
    wsPort: number = MOCK_API_PORT,
    httpsConfig?: { sslKeyPath: string; sslCertPath: string },
  ) {
    try {
      context.amplify.addCleanUpTask(async (context) => {
        await this.stop(context);
      });
      this.configOverrideManager = await ConfigOverrideManager.getInstance(context);
      // check java version
      await checkJavaVersion(context);
      this.apiName = await this.getAppSyncAPI(context);
      const isLocalDBEmpty = !fs.existsSync(getMockDataDirectory(context));
      this.ddbClient = await this.startDynamoDBLocalServer(context);
      const resolverDirectory = await this.getResolverTemplateDirectory(context);
      this.resolverOverrideManager = new ResolverOverrides(resolverDirectory);
      this.apiParameters = await this.loadAPIParameters(context);
      this.appSyncSimulator = new AmplifyAppSyncSimulator({
        port,
        wsPort,
        httpsConfig: httpsConfig,
      });
      await this.appSyncSimulator.start();
      await this.resolverOverrideManager.start();
      await this.watch(context);
      const appSyncConfig: AmplifyAppSyncSimulatorConfig = await this.runTransformer(context, this.apiParameters);

      // If any of the model types are searchable, start opensearch local instance
      if (appSyncConfig?.tables?.some((table: $TSAny) => table?.isSearchable) && !isWindowsPlatform()) {
        this.opensearchURL = await this.startOpensearchLocalServer(context, isLocalDBEmpty);
      }
      this.appSyncSimulator.init(appSyncConfig);

      await this.generateTestFrontendExports(context);
      await this.generateCode(context, appSyncConfig);

      context.print.info(`AppSync Mock endpoint is running at ${this.appSyncSimulator.url}`);
      context.print.info(`GraphiQL IDE is available for local testing at ${this.appSyncSimulator.localhostUrl}`);
      await this.startDDBListeners(context, appSyncConfig, false);
    } catch (e) {
      const errMessage = 'Failed to start API Mocking.';
      context.print.error(errMessage + ' Running cleanup tasks.');
      await this.stop(context);
      if (e.resolution == undefined || e.link == undefined) {
        context.print.red(`Reason: ${e.message}`);
      } else {
        context.print.red(`Reason: ${e.message}\nResolution: ${e.resolution}`);
        context.print.green(`${e.link}`);
      }
    }
  }

  async stop(context) {
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
    } catch (e) {
      // failed to stop DDB emulator
      printer.error(`Failed to stop DynamoDB Local Server ${e.message}`);
    }

    try {
      if (this.opensearchEmulator) {
        await this.opensearchEmulator.terminate();
        this.opensearchEmulator = null;
        this.opensearchURL = null;
      }
    } catch (e) {
      // failed to stop opensearch emulator
      printer.error(
        `Failed to stop OpenSearch Local Server ${e.message}. Kill the mock process using "kill -9 ${this.opensearchEmulator?.pid}" and restart it.`,
      );
    }

    if (this.appSyncSimulator) {
      await this.appSyncSimulator.stop();
    }
    if (this.resolverOverrideManager) {
      this.resolverOverrideManager.stop();
    }
  }

  private async runTransformer(context, parameters = {}) {
    const { transformerOutput } = await runTransformer(context);
    let config: any = processAppSyncResources(transformerOutput, parameters);
    config = await this.ensureDDBTables(config);
    config = await this.configureDDBDataSource(config);
    this.transformerResult = await this.configureLambdaDataSource(context, config);
    this.transformerResult = await this.configureOpensearchDataSource(this.transformerResult);
    this.userOverriddenSlots = transformerOutput.userOverriddenSlots;
    const overriddenTemplates = await this.resolverOverrideManager.sync(this.transformerResult.mappingTemplates, this.userOverriddenSlots);
    return { ...this.transformerResult, mappingTemplates: overriddenTemplates };
  }

  private async generateCode(context: any, config: AmplifyAppSyncSimulatorConfig = null) {
    try {
      printer.info('Running GraphQL codegen');
      const { projectPath } = context.amplify.getEnvInfo();
      const schemaPath = path.join(projectPath, 'amplify', 'backend', 'api', this.apiName, 'build', 'schema.graphql');
      if (config && config.schema) {
        fs.writeFileSync(schemaPath, config.schema.content);
      }
      if (!isCodegenConfigured(context, this.apiName)) {
        await add(context);
      } else {
        switchToSDLSchema(context, this.apiName);
        await generate(context);
      }
    } catch (e) {
      printer.info(`Failed to run GraphQL codegen with following error:\n${e.message}`);
    }
  }

  private async reload(context, filePath, action) {
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
          printer.info('Mapping template change detected. Reloading...');
          const mappingTemplates = this.resolverOverrideManager.sync(this.transformerResult.mappingTemplates, this.userOverriddenSlots);
          await this.appSyncSimulator.reload({
            ...this.transformerResult,
            mappingTemplates,
          });
        }
      } else if (filePath.includes(inputSchemaPath)) {
        printer.info('GraphQL Schema change detected. Reloading...');
        const config: AmplifyAppSyncSimulatorConfig = await this.runTransformer(context, this.apiParameters);
        await this.appSyncSimulator.reload(config);
        await this.generateCode(context, config);
        await this.startDDBListeners(context, config, true);
      } else if (filePath.includes(parameterFilePath)) {
        const apiParameters = await this.loadAPIParameters(context);
        if (JSON.stringify(apiParameters) !== JSON.stringify(this.apiParameters)) {
          context.print.info('API Parameter change detected. Reloading...');
          this.apiParameters = apiParameters;
          const config = await this.runTransformer(context, this.apiParameters);
          await this.appSyncSimulator.reload(config);
          await this.generateCode(context, config);
        }
      } else if (filePath.includes(customStackPath)) {
        printer.info('Custom stack change detected. Reloading...');
        const config = await this.runTransformer(context, this.apiParameters);
        await this.appSyncSimulator.reload(config);
        await this.generateCode(context, config);
        await this.startDDBListeners(context, config, true);
      } else if (filePath?.includes(getMockDataDirectory(context)) && action === 'unlink') {
        printer.info('Mock DB deletion detected. Clearing the OpenSearch indices...');
        await this.clearAllIndices(this.opensearchURL);
      }
    } catch (e) {
      printer.info(`Reloading failed with error\n${e}`);
    }
  }

  private async generateTestFrontendExports(context) {
    await this.generateFrontendExports(context, {
      endpoint: `${this.appSyncSimulator.url}/graphql`,
      name: this.apiName,
      GraphQLAPIKeyOutput: this.transformerResult.appSync.apiKey,
      additionalAuthenticationProviders: [],
      securityType: this.transformerResult.appSync.authenticationType,
      testMode: true,
    });
  }

  private async ensureDDBTables(config) {
    return await createAndUpdateTable(this.ddbClient, config);
  }

  private async startDDBListeners(context: $TSContext, config: $TSAny, onlyNewTables: boolean): Promise<void> {
    let tables = config?.tables;
    const searchableEnabledTableNames = config?.tables
      ?.filter((table) => table?.isSearchable)
      ?.map((table) => table?.Properties?.TableName);
    if (onlyNewTables) {
      tables = config?.tables?.filter((table) => table?.isNewlyAdded);
    }
    const tableNames = tables?.map((t: $TSAny) => t?.Properties?.TableName);

    // enable triggers for newly added searchable tables
    let newlyAddedSearchableTableNames: string[] = [];
    if (!_.isEmpty(searchableEnabledTableNames)) {
      newlyAddedSearchableTableNames = searchableEnabledTableNames.filter((tableName) => !this.searchableTables.includes(tableName));
    }
    this.searchableTables = searchableEnabledTableNames;

    if (!_.isEmpty(tableNames)) {
      const modelLambdaTriggers: { [index: string]: LambdaTrigger[] } = await findModelLambdaTriggers(context, tableNames);
      const searchableLambdaTriggers: { [index: string]: LambdaTrigger } = await findSearchableLambdaTriggers(
        context,
        newlyAddedSearchableTableNames,
        this.opensearchURL,
      );
      const allLambdaTriggers = modelLambdaTriggers;
      Object.entries(searchableLambdaTriggers)?.forEach(([tableName, lambdaTrigger]) => {
        if (allLambdaTriggers[tableName]) {
          allLambdaTriggers[tableName].push(lambdaTrigger);
        } else {
          allLambdaTriggers[tableName] = [lambdaTrigger];
        }
      });

      const allTablesWithTriggers = Object.keys(allLambdaTriggers);
      const tableStreamArns: { [index: string]: TableDescription } = await describeTables(this.ddbClient, allTablesWithTriggers);
      const allListeners = [];
      Object.entries(allLambdaTriggers)?.forEach(([tableName, lambdaTriggers]) => {
        if (!_.isEmpty(lambdaTriggers)) {
          lambdaTriggers.forEach((lambdaTrigger: LambdaTrigger) => {
            allListeners.push(
              ddbLambdaTriggerHandler(context, tableStreamArns[tableName].LatestStreamArn, lambdaTrigger, this.ddbEmulator.url),
            );
          });
        }
      });
      await Promise.all(allListeners);
    }
  }

  private async configureLambdaDataSource(context, config) {
    const lambdaDataSources = config.dataSources.filter((d) => d.type === 'AWS_LAMBDA');
    if (lambdaDataSources.length === 0) {
      return config;
    }
    return {
      ...config,
      dataSources: await Promise.all(
        config.dataSources.map(async (d) => {
          if (d.type !== 'AWS_LAMBDA') {
            return d;
          }
          const lambdaConfig = await lambdaArnToConfig(context, d.LambdaFunctionArn);
          const invoker = await getInvoker(context, {
            resourceName: lambdaConfig.name,
            handler: lambdaConfig.handler,
            envVars: lambdaConfig.environment,
          });
          return {
            ...d,
            invoke: (payload) => {
              return timeConstrainedInvoker(
                invoker({
                  event: payload,
                }),
                context.input.options,
              );
            },
          };
        }),
      ),
    };
  }

  private async configureOpensearchDataSource(config: $TSAny): Promise<$TSAny> {
    if (isWindowsPlatform()) {
      return config;
    }
    const opensearchDataSourceType = 'AMAZON_ELASTICSEARCH';
    const opensearchDataSources = config.dataSources.filter((d) => d.type === opensearchDataSourceType);
    if (_.isEmpty(opensearchDataSources)) {
      return config;
    }
    return {
      ...config,
      dataSources: await Promise.all(
        config.dataSources.map(async (d) => {
          if (d.type !== opensearchDataSourceType) {
            return d;
          }
          return {
            ...d,
            invoke: async (payload) => {
              return await querySearchable(this.opensearchURL, payload);
            },
          };
        }),
      ),
    };
  }

  private async watch(context) {
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

  private async configureDDBDataSource(config) {
    const ddbConfig = this.ddbClient.config;
    return await configureDDBDataSource(config, ddbConfig);
  }
  public async getAppSyncAPI(context) {
    const currentMeta = await getAmplifyMeta(context);
    const { api: apis = {} } = currentMeta;
    let name = null;
    Object.entries(apis).some((entry: any) => {
      if (entry[1].service === 'AppSync' && entry[1].providerPlugin === 'awscloudformation') {
        name = entry[0];
        return true;
      }
      return undefined;
    });
    if (!name) {
      throw new AmplifyError('MockProcessError', {
        message: 'No AppSync API is added to the project',
        resolution: `Use 'amplify add api' in the root of your app directory to create a GraphQL API.`,
        link: `${errorSuffix}`,
      });
    }
    return name;
  }

  private async startDynamoDBLocalServer(context) {
    const dbPath = path.join(await getMockDataDirectory(context), 'dynamodb');
    fs.ensureDirSync(dbPath);
    const mockConfig = await getMockConfig(context);
    this.ddbEmulator = await dynamoEmulator.launch({
      dbPath,
      port: null,
      ...mockConfig,
    });
    return dynamoEmulator.getClient(this.ddbEmulator);
  }

  private async startOpensearchLocalServer(context: $TSContext, isLocalDBEmpty: boolean) {
    try {
      const mockConfig = await getMockConfig(context);
      await this.createMockSearchableArtifacts(context);
      checkJavaHome();
      this.opensearchEmulator = await opensearchEmulator.launch(getMockOpensearchDataDirectory(context), {
        port: null, // let the emulator choose the default
        ...mockConfig,
      });
      if (isLocalDBEmpty) {
        await this.clearAllIndices(this.opensearchEmulator.url);
      }
      return this.opensearchEmulator.url;
    } catch (error) {
      throw new AmplifyFault('MockProcessFault', {
        message: 'Unable to start the local OpenSearch Instance.',
        details: error?.message || '',
        link: AMPLIFY_SUPPORT_DOCS.CLI_GRAPHQL_TROUBLESHOOTING.url,
      });
    }
  }

  private async clearAllIndices(openSearchURL: URL) {
    if (!openSearchURL) {
      return;
    }
    const errMessage = 'Unable to Clear the local OpenSearch Indices.';
    try {
      const url = openSearchURL.toString() + '*';
      const result = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-type': 'application/json',
        },
      });
      const status = await result.json();
      if (!status?.acknowledged) {
        throw new AmplifyFault('MockProcessFault', {
          message: 'The action to delete all items in an index is not acknowledged by the Opensearch server.',
          link: AMPLIFY_SUPPORT_DOCS.CLI_GRAPHQL_TROUBLESHOOTING.url,
        });
      }
    } catch (error) {
      throw new AmplifyFault(
        'MockProcessFault',
        {
          message: errMessage,
          link: AMPLIFY_SUPPORT_DOCS.CLI_GRAPHQL_TROUBLESHOOTING.url,
        },
        error,
      );
    }
  }

  private async createMockSearchableArtifacts(context: $TSContext) {
    const opensearchLocalDirectory = opensearchEmulator?.getOpensearchLocalDirectory();
    fs.ensureDirSync(opensearchLocalDirectory);
    const mockSearchableTriggerDirectory = getMockSearchableTriggerDirectory(context);
    fs.ensureDirSync(mockSearchableTriggerDirectory);
    fs.ensureDirSync(path.join(mockSearchableTriggerDirectory, 'src'));
    const searchableLambdaResourceDir = path.resolve(__dirname, '..', '..', 'resources', 'mock-searchable-lambda-trigger');

    // copy the Pipfile first
    const pipFileName = 'Pipfile';
    fs.copySync(path.join(searchableLambdaResourceDir, pipFileName), path.join(mockSearchableTriggerDirectory, pipFileName), {
      overwrite: true,
    });

    // copy the source files
    fs.copySync(path.join(searchableLambdaResourceDir, 'source-files'), path.join(mockSearchableTriggerDirectory, 'src'), {
      overwrite: true,
    });

    // build the searchable lambda trigger
    const triggerConfig = getSearchableLambdaTriggerConfig(context, null);
    const runtimeManager = await context.amplify.loadRuntimePlugin(context, triggerConfig?.runtimePluginId);
    printer.info('Building the searchable lambda trigger');
    await buildLambdaTrigger(runtimeManager, triggerConfig);
    fs.ensureDirSync(getMockOpensearchDataDirectory(context));
  }

  private async getAPIBackendDirectory(context) {
    const { projectPath } = context.amplify.getEnvInfo();
    return path.join(projectPath, 'amplify', 'backend', 'api', this.apiName);
  }

  private async getAPIParameterFilePath(context): Promise<string> {
    const backendPath = await this.getAPIBackendDirectory(context);
    return path.join(backendPath, 'parameters.json');
  }

  private async loadAPIParameters(context): Promise<object> {
    const paramPath = await this.getAPIParameterFilePath(context);
    if (!fs.existsSync(paramPath)) {
      return {};
    }
    try {
      return JSON.parse(fs.readFileSync(paramPath, 'utf8'));
    } catch (e) {
      e.message = `Failed to load API parameters.json \n ${e.message}`;
      throw e;
    }
  }

  private async getResolverTemplateDirectory(context) {
    const apiDirectory = await this.getAPIBackendDirectory(context);
    return apiDirectory;
  }

  private async registerWatcher(context: any): Promise<chokidar.FSWatcher> {
    const watchDir = await this.getAPIBackendDirectory(context);
    const watchMockDataDir = await getMockDataDirectory(context);
    return chokidar.watch([watchDir, watchMockDataDir], {
      interval: 100,
      ignoreInitial: true,
      followSymlinks: false,
      ignored: ['**/build/**', '**/*db-journal'],
      awaitWriteFinish: true,
    });
  }

  private async generateFrontendExports(
    context: any,
    localAppSyncDetails: {
      name: string;
      endpoint: string;
      securityType: string;
      additionalAuthenticationProviders: string[];
      GraphQLAPIKeyOutput?: string;
      region?: string;
      testMode: boolean;
    },
  ) {
    const currentMeta = await getAmplifyMeta(context);
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
