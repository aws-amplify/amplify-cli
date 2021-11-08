import * as fs from 'fs-extra';
import * as dynamoEmulator from 'amplify-dynamodb-simulator';
import { AmplifyAppSyncSimulator, AmplifyAppSyncSimulatorConfig } from 'amplify-appsync-simulator';
import { add, generate, isCodegenConfigured, switchToSDLSchema } from 'amplify-codegen';
import * as path from 'path';
import * as chokidar from 'chokidar';

import { getAmplifyMeta, getMockDataDirectory } from '../utils';
import { checkJavaVersion } from '../utils/index';
import { runTransformer } from './run-graphql-transformer';
import { processAppSyncResources } from '../CFNParser';
import { ResolverOverrides } from './resolver-overrides';
import { ConfigOverrideManager } from '../utils/config-override';
import { configureDDBDataSource, createAndUpdateTable } from '../utils/dynamo-db';
import { getMockConfig } from '../utils/mock-config-file';
import { getInvoker } from 'amplify-category-function';
import { lambdaArnToConfig } from './lambda-arn-to-config';
import { timeConstrainedInvoker } from '../func';

export const GRAPHQL_API_ENDPOINT_OUTPUT = 'GraphQLAPIEndpointOutput';
export const GRAPHQL_API_KEY_OUTPUT = 'GraphQLAPIKeyOutput';
export const MOCK_API_KEY = 'da2-fakeApiId123456';
export const MOCK_API_PORT = 20002;

export class APITest {
  private apiName: string;
  private transformerResult: any;
  private ddbClient;
  private appSyncSimulator: AmplifyAppSyncSimulator;
  private resolverOverrideManager: ResolverOverrides;
  private watcher: chokidar.FSWatcher;
  private ddbEmulator;
  private configOverrideManager: ConfigOverrideManager;
  private apiParameters: object = {};

  async start(context, port: number = MOCK_API_PORT, wsPort: number = 20003) {
    try {
      context.amplify.addCleanUpTask(async context => {
        await this.stop(context);
      });
      this.configOverrideManager = ConfigOverrideManager.getInstance(context);
      // check java version
      await checkJavaVersion(context);
      this.apiName = await this.getAppSyncAPI(context);
      this.ddbClient = await this.startDynamoDBLocalServer(context);
      const resolverDirectory = await this.getResolverTemplateDirectory(context);
      this.resolverOverrideManager = new ResolverOverrides(resolverDirectory);
      this.apiParameters = await this.loadAPIParameters(context);
      this.appSyncSimulator = new AmplifyAppSyncSimulator({
        port,
        wsPort,
      });
      await this.appSyncSimulator.start();
      await this.resolverOverrideManager.start();
      await this.watch(context);
      const appSyncConfig: AmplifyAppSyncSimulatorConfig = await this.runTransformer(context, this.apiParameters);
      this.appSyncSimulator.init(appSyncConfig);

      await this.generateTestFrontendExports(context);
      await this.generateCode(context, appSyncConfig);

      context.print.info(`AppSync Mock endpoint is running at ${this.appSyncSimulator.url}`);
    } catch (e) {
      context.print.error(`Failed to start API Mock endpoint ${e}`);
    }
  }

  async stop(context) {
    this.ddbClient = null;
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
    try {
      if (this.ddbEmulator) {
        await this.ddbEmulator.terminate();
        this.ddbEmulator = null;
      }
    } catch (e) {
      // failed to stop DDB emulator
      context.print.error(`Failed to stop DynamoDB Local Server ${e.message}`);
    }

    await this.appSyncSimulator.stop();
    this.resolverOverrideManager.stop();
  }

  private async runTransformer(context, parameters = {}) {
    const { transformerOutput } = await runTransformer(context);
    let config: any = processAppSyncResources(transformerOutput, parameters);
    await this.ensureDDBTables(config);
    config = this.configureDDBDataSource(config);
    this.transformerResult = await this.configureLambdaDataSource(context, config);
    const overriddenTemplates = await this.resolverOverrideManager.sync(this.transformerResult.mappingTemplates);
    return { ...this.transformerResult, mappingTemplates: overriddenTemplates };
  }

  private async generateCode(context: any, config: AmplifyAppSyncSimulatorConfig = null) {
    try {
      context.print.info('Running GraphQL codegen');
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
      context.print.info(`Failed to run GraphQL codegen with following error:\n${e.message}`);
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
          context.print.info('Mapping template change detected. Reloading...');
          const mappingTemplates = this.resolverOverrideManager.sync(this.transformerResult.mappingTemplates);
          await this.appSyncSimulator.reload({
            ...this.transformerResult,
            mappingTemplates,
          });
        }
      } else if (filePath.includes(inputSchemaPath)) {
        context.print.info('GraphQL Schema change detected. Reloading...');
        const config: AmplifyAppSyncSimulatorConfig = await this.runTransformer(context, this.apiParameters);
        await this.appSyncSimulator.reload(config);
        await this.generateCode(context, config);
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
        context.print.info('Custom stack change detected. Reloading...');
        const config = await this.runTransformer(context, this.apiParameters);
        await this.appSyncSimulator.reload(config);
        await this.generateCode(context, config);
      }
    } catch (e) {
      context.print.info(`Reloading failed with error\n${e}`);
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
    const tables = config.tables.map(t => t.Properties);
    await createAndUpdateTable(this.ddbClient, config);
  }

  private async configureLambdaDataSource(context, config) {
    const lambdaDataSources = config.dataSources.filter(d => d.type === 'AWS_LAMBDA');
    if (lambdaDataSources.length === 0) {
      return config;
    }
    return {
      ...config,
      dataSources: await Promise.all(
        config.dataSources.map(async d => {
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
            invoke: payload => {
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

  private async watch(context) {
    this.watcher = await this.registerWatcher(context);
    this.watcher
      .on('add', path => {
        this.reload(context, path, 'add');
      })
      .on('change', path => {
        this.reload(context, path, 'change');
      })
      .on('unlink', path => {
        this.reload(context, path, 'unlink');
      });
  }

  private configureDDBDataSource(config) {
    const ddbConfig = this.ddbClient.config;
    return configureDDBDataSource(config, ddbConfig);
  }
  private async getAppSyncAPI(context) {
    const currentMeta = await getAmplifyMeta(context);
    const { api: apis = {} } = currentMeta;
    let appSyncApi = null;
    let name = null;
    Object.entries(apis).some((entry: any) => {
      if (entry[1].service === 'AppSync' && entry[1].providerPlugin === 'awscloudformation') {
        appSyncApi = entry[1];
        name = entry[0];
        return true;
      }
    });
    if (!name) {
      throw new Error('No AppSync API is added to the project');
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
    return chokidar.watch(watchDir, {
      interval: 100,
      ignoreInitial: true,
      followSymlinks: false,
      ignored: '**/build/**',
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
