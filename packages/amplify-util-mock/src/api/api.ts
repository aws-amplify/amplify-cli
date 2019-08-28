import * as fs from 'fs-extra';
import * as dynamoEmulator from 'amplify-dynamodb-simulator';
import { AmplifyAppSyncSimulator, AmplifyAppSyncSimulatorConfig } from 'amplify-appsync-simulator';
import { add, generate, isCodegenConfigured, switchToSDLSchema } from 'amplify-codegen';
import * as path from 'path';
import * as chokidar from 'chokidar';

import { getAmplifyMeta, addCleanupTask, getMockDataDirectory } from '../utils';
import { runTransformer } from './run-graphql-transformer';
import { processAppSyncResources } from '../CFNParser';
import { ResolverOverrides } from './resolver-overrides';
import { ConfigOverrideManager } from '../utils/config-override';
import { configureDDBDataSource, ensureDynamoDBTables } from '../utils/ddb-utils';
import { invoke } from '../utils/lambda/invoke';

export class APITest {
  private apiName: string;
  private transformerResult: any;
  private ddbClient;
  private appSyncSimulator: AmplifyAppSyncSimulator;
  private resolverOverrideManager: ResolverOverrides;
  private watcher: chokidar.FSWatcher;
  private ddbEmulator;
  private configOverrideManager: ConfigOverrideManager;

  private projectRoot: string;

  async start(context, port: number = 20002, wsPort: number = 20003) {
    try {
      addCleanupTask(context, async context => {
        await this.stop(context);
      });
      this.projectRoot = context.amplify.getEnvInfo().projectPath;
      this.configOverrideManager = ConfigOverrideManager.getInstance(context);
      this.apiName = await this.getAppSyncAPI(context);
      this.ddbClient = await this.startDynamoDBLocalServer(context);
      const resolverDirectory = await this.getResolverTemplateDirectory(context);
      this.resolverOverrideManager = new ResolverOverrides(resolverDirectory);
      this.appSyncSimulator = new AmplifyAppSyncSimulator({
        port,
        wsPort,
      });
      await this.appSyncSimulator.start();
      await this.resolverOverrideManager.start();
      await this.watch(context);
      const appSyncConfig: AmplifyAppSyncSimulatorConfig = await this.runTransformer(context);
      this.appSyncSimulator.init(appSyncConfig);

      await this.generateTestFrontendExports(context);
      await this.generateCode(context);

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

  private async runTransformer(context) {
    const { transformerOutput, stack } = await runTransformer(context);
    let config: any = processAppSyncResources(stack, transformerOutput);
    await this.ensureDDBTables(config);
    this.transformerResult = this.configureDDBDataSource(config);
    this.transformerResult = this.configureLambdaDataSource(config);
    const overriddenTemplates = await this.resolverOverrideManager.sync(
      this.transformerResult.mappingTemplates
    );
    return { ...this.transformerResult, mappingTemplates: overriddenTemplates };
  }
  private async generateCode(context, transformerOutput = null) {
    try {
      context.print.info('Running GraphQL codegen');
      const { projectPath } = context.amplify.getEnvInfo();
      const schemaPath = path.join(
        projectPath,
        'amplify',
        'backend',
        'api',
        this.apiName,
        'build',
        'schema.graphql'
      );
      if (transformerOutput) {
        fs.writeFileSync(schemaPath, transformerOutput.schema);
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
    const apiDir = await this.getAPIBackendDirectory(context)
    const inputSchemaPath = path.join(apiDir, 'schema');
    try {
      let shouldReload;
      if (this.resolverOverrideManager.isTemplateFile(filePath)) {
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
          const mappingTemplates = this.resolverOverrideManager.sync(
            this.transformerResult.mappingTemplates
          );
          await this.appSyncSimulator.reload({
            ...this.transformerResult,
            mappingTemplates,
          });
        }
      } else if(filePath.includes(inputSchemaPath)) {
        context.print.info('GraphQL Schema change detected. Reloading...');
        const config = await this.runTransformer(context);
        await this.appSyncSimulator.reload(config);
        await this.generateCode(context);
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
    await ensureDynamoDBTables(this.ddbClient, config);
  }

  private configureLambdaDataSource(config) {
    config.dataSources
      .filter(d => d.type === 'AWS_LAMBDA')
      .forEach(d => {
        const arn = d.LambdaFunctionArn;
        const arnParts = arn.split(':');
        let functionName = arnParts[arnParts.length - 1];
        if (functionName.endsWith('-${env}')) {
          functionName = functionName.replace('-${env}', '');
          const lambdaPath = path.join(
            this.projectRoot,
            'amplify',
            'backend',
            'function',
            functionName,
            'src'
          );
          if (!fs.existsSync(path.join(lambdaPath, 'index.js'))) {
            throw new Error(`Lambda function ${functionName} does not exist in your project. \nPlease run amplify add function`);
          }
          d.invoke = payload => {
            return invoke({
              packageFolder: lambdaPath,
              handler: 'handler',
              fileName: 'index.js',
              event: payload,
            });
          };
        } else {
          throw new Error(
            'Local mocking does not support AWS_LAMBDA data source that is not provisioned in the project.\nEnsure that the environment is specified as described in https://aws-amplify.github.io/docs/cli-toolchain/graphql#function'
          );
        }
      });
    return config;
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
    const { projectPath } = context.amplify.getEnvInfo();
    const dbPath = path.join(await getMockDataDirectory(context), 'dynamodb');
    fs.ensureDirSync(dbPath);
    this.ddbEmulator = await dynamoEmulator.launch({
      dbPath,
      port: null,
    });
    return dynamoEmulator.getClient(this.ddbEmulator);
  }

  private async getAPIBackendDirectory(context) {
    const { projectPath } = context.amplify.getEnvInfo();
    return path.join(projectPath, 'amplify', 'backend', 'api', this.apiName);
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
    }
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
