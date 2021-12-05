import { $TSAny, $TSContext, isResourceNameUnique, JSONUtilities, pathManager, stateManager } from 'amplify-cli-core';
import {
  AddApiRequest,
  AppSyncServiceConfiguration,
  AppSyncServiceModification,
  ConflictResolution,
  ResolutionStrategy,
  UpdateApiRequest,
} from 'amplify-headless-interface';
import { printer } from 'amplify-prompts';
import * as fs from 'fs-extra';
import { readTransformerConfiguration, TRANSFORM_CURRENT_VERSION, writeTransformerConfiguration } from 'graphql-transformer-core';
import _ from 'lodash';
import * as path from 'path';
import { v4 as uuid } from 'uuid';
import { category } from '../../category-constants';
import { ApiArtifactHandler, ApiArtifactHandlerOptions } from '../api-artifact-handler';
import { AppsyncApiInputState } from './api-input-manager/appsync-api-input-state';
import { cfnParametersFilename, gqlSchemaFilename, provider, rootAssetDir } from './aws-constants';
import { AppSyncCLIInputs, AppSyncServiceConfig } from './service-walkthrough-types/appsync-user-input-types';
import { authConfigHasApiKey, checkIfAuthExists, getAppSyncAuthConfig, getAppSyncResourceName } from './utils/amplify-meta-utils';
import { appSyncAuthTypeToAuthConfig } from './utils/auth-config-to-app-sync-auth-type-bi-di-mapper';
import { printApiKeyWarnings } from './utils/print-api-key-warnings';
import { conflictResolutionToResolverConfig } from './utils/resolver-config-to-conflict-resolution-bi-di-mapper';

// keep in sync with ServiceName in amplify-category-function, but probably it will not change
const FunctionServiceNameLambdaFunction = 'Lambda';

export const getCfnApiArtifactHandler = (context: $TSContext): ApiArtifactHandler => {
  return new CfnApiArtifactHandler(context);
};
const resolversDirName = 'resolvers';
const stacksDirName = 'stacks';
const defaultStackName = 'CustomResources.json';

const defaultCfnParameters = (apiName: string) => ({
  AppSyncApiName: apiName,
  DynamoDBBillingMode: 'PAY_PER_REQUEST',
  DynamoDBEnableServerSideEncryption: false,
});
class CfnApiArtifactHandler implements ApiArtifactHandler {
  private readonly context: $TSContext;

  constructor(context: $TSContext) {
    this.context = context;
  }

  // TODO once the AddApiRequest contains multiple services this class should depend on an ApiArtifactHandler
  // for each service and delegate to the correct one
  createArtifacts = async (request: AddApiRequest): Promise<string> => {
    const meta = stateManager.getMeta();
    const existingApiName = getAppSyncResourceName(meta);
    if (existingApiName) {
      throw new Error(`GraphQL API ${existingApiName} already exists in the project. Use 'amplify update api' to make modifications.`);
    }
    const serviceConfig = request.serviceConfiguration;

    isResourceNameUnique('api', serviceConfig.apiName);

    const resourceDir = this.getResourceDir(serviceConfig.apiName);

    // Ensure the project directory exists and create the stacks & resolvers directories.
    fs.ensureDirSync(resourceDir);
    const resolverDirectoryPath = path.join(resourceDir, resolversDirName);
    if (!fs.existsSync(resolverDirectoryPath)) {
      fs.mkdirSync(resolverDirectoryPath);
    }
    const stacksDirectoryPath = path.join(resourceDir, stacksDirName);
    if (!fs.existsSync(stacksDirectoryPath)) {
      fs.mkdirSync(stacksDirectoryPath);
      fs.copyFileSync(path.join(rootAssetDir, 'resolver-readme', 'RESOLVER_README.md'), path.join(resolverDirectoryPath, 'README.md'));
    }

    // During API add, make sure we're creating a transform.conf.json file with the latest version the CLI supports.
    await this.updateTransformerConfigVersion(resourceDir);

    serviceConfig.conflictResolution = await this.createResolverResources(serviceConfig.conflictResolution);
    await writeResolverConfig(serviceConfig.conflictResolution, resourceDir);

    const appsyncCLIInputs = await this.generateAppsyncCLIInputs(serviceConfig, resourceDir);

    // Write the default custom resources stack out to disk.
    fs.copyFileSync(
      path.join(rootAssetDir, 'cloudformation-templates', 'defaultCustomResources.json'),
      path.join(resourceDir, stacksDirName, defaultStackName),
    );

    // write the template buffer to the project folder
    this.writeSchema(appsyncCLIInputs.serviceConfiguration.gqlSchemaPath, serviceConfig.transformSchema);

    const authConfig = this.extractAuthConfig(appsyncCLIInputs.serviceConfiguration);

    await this.context.amplify.executeProviderUtils(this.context, 'awscloudformation', 'compileSchema', {
      resourceDir,
      parameters: this.getCfnParameters(serviceConfig.apiName, authConfig, resourceDir),
      authConfig,
    });

    this.context.amplify.updateamplifyMetaAfterResourceAdd(category, serviceConfig.apiName, this.createAmplifyMeta(authConfig));
    return serviceConfig.apiName;
  };

  // TODO once the AddApiRequest contains multiple services this class should depend on an ApiArtifactHandler
  // for each service and delegate to the correct one
  updateArtifacts = async (request: UpdateApiRequest, opts?: ApiArtifactHandlerOptions): Promise<void> => {
    const updates = request.serviceModification;
    const apiName = getAppSyncResourceName(stateManager.getMeta());
    if (!apiName) {
      throw new Error(`No AppSync API configured in the project. Use 'amplify add api' to create an API.`);
    }
    const resourceDir = this.getResourceDir(apiName);
    // update appsync cli-inputs
    const appsyncCLIInputs = await this.updateAppsyncCLIInputs(updates, apiName);
    if (updates.transformSchema) {
      this.writeSchema(appsyncCLIInputs.serviceConfiguration.gqlSchemaPath, updates.transformSchema);
    }
    if (updates.conflictResolution) {
      updates.conflictResolution = await this.createResolverResources(appsyncCLIInputs.serviceConfiguration.conflictResolution);
      await writeResolverConfig(updates.conflictResolution, resourceDir);
    }

    const authConfig = getAppSyncAuthConfig(stateManager.getMeta());
    const previousAuthConfig = _.cloneDeep(authConfig);
    const oldConfigHadApiKey = authConfigHasApiKey(authConfig);
    if (updates.defaultAuthType) {
      authConfig.defaultAuthentication = appSyncAuthTypeToAuthConfig(updates.defaultAuthType);
    }
    if (updates.additionalAuthTypes) {
      authConfig.additionalAuthenticationProviders = updates.additionalAuthTypes.map(appSyncAuthTypeToAuthConfig);
    }

    if (!opts?.skipCompile) {
      await this.context.amplify.executeProviderUtils(this.context, 'awscloudformation', 'compileSchema', {
        resourceDir,
        parameters: this.getCfnParameters(apiName, authConfig, resourceDir),
        authConfig,
        previousAuthConfig,
      });
    }

    this.context.amplify.updateamplifyMetaAfterResourceUpdate(category, apiName, 'output', { authConfig });
    this.context.amplify.updateBackendConfigAfterResourceUpdate(category, apiName, 'output', { authConfig });
    printApiKeyWarnings(oldConfigHadApiKey, authConfigHasApiKey(authConfig));
  };

  private writeSchema = (resourceDir: string, schema: string) => {
    fs.writeFileSync(resourceDir, schema);
  };

  private getResourceDir = (apiName: string) => pathManager.getResourceDirectoryPath(undefined, category, apiName);

  private createAmplifyMeta = authConfig => ({
    service: 'AppSync',
    providerPlugin: provider,
    output: {
      authConfig,
    },
  });

  private extractAuthConfig = (config: AppSyncServiceConfig) => ({
    defaultAuthentication: appSyncAuthTypeToAuthConfig(config.defaultAuthType),
    additionalAuthenticationProviders: (config.additionalAuthTypes || []).map(appSyncAuthTypeToAuthConfig),
  });

  private updateTransformerConfigVersion = async resourceDir => {
    const localTransformerConfig = await readTransformerConfiguration(resourceDir);
    localTransformerConfig.Version = TRANSFORM_CURRENT_VERSION;
    localTransformerConfig.ElasticsearchWarning = true;
    await writeTransformerConfiguration(resourceDir, localTransformerConfig);
  };

  private createResolverResources = async (conflictResolution: ConflictResolution = {}) => {
    const newConflictResolution = _.cloneDeep(conflictResolution);

    // if the strat is a new lambda, generate the lambda and update the strategy to reference the new lambda
    const generateLambdaIfNew = async (strat: ResolutionStrategy) => {
      if (strat && strat.type === 'LAMBDA' && strat.resolver.type === 'NEW') {
        strat.resolver = {
          type: 'EXISTING',
          name: await this.createSyncFunction(),
        };
      }
    };
    await generateLambdaIfNew(newConflictResolution.defaultResolutionStrategy);
    await Promise.all(
      (newConflictResolution.perModelResolutionStrategy || [])
        .map(perModelStrat => perModelStrat.resolutionStrategy)
        .map(generateLambdaIfNew),
    );
    return newConflictResolution;
  };

  private getCfnParameters = (apiName: string, authConfig, resourceDir: string) => {
    const cfnPath = path.join(resourceDir, cfnParametersFilename);
    const params = JSONUtilities.readJson<$TSAny>(cfnPath, { throwIfNotExist: false }) || defaultCfnParameters(apiName);
    const cognitoPool = this.getCognitoUserPool(authConfig);
    if (cognitoPool) {
      params.AuthCognitoUserPoolId = cognitoPool;
    } else {
      delete params.AuthCognitoUserPoolId;
    }
    return params;
  };

  private getCognitoUserPool = authConfig => {
    const additionalUserPoolProvider = (authConfig.additionalAuthenticationProviders || []).find(
      provider => provider.authenticationType === 'AMAZON_COGNITO_USER_POOLS',
    );
    const defaultAuth = authConfig.defaultAuthentication || {};
    if (defaultAuth.authenticationType === 'AMAZON_COGNITO_USER_POOLS' || additionalUserPoolProvider) {
      let userPoolId;
      const configuredUserPoolName = checkIfAuthExists();

      if (authConfig.userPoolConfig) {
        ({ userPoolId } = authConfig.userPoolConfig);
      } else if (additionalUserPoolProvider && additionalUserPoolProvider.userPoolConfig) {
        ({ userPoolId } = additionalUserPoolProvider.userPoolConfig);
      } else if (configuredUserPoolName) {
        userPoolId = `auth${configuredUserPoolName}`;
      } else {
        throw new Error('Cannot find a configured Cognito User Pool.');
      }

      return {
        'Fn::GetAtt': [userPoolId, 'Outputs.UserPoolId'],
      };
    }
  };

  private createSyncFunction = async () => {
    const targetDir = pathManager.getBackendDirPath();
    const assetDir = path.normalize(path.join(rootAssetDir, 'sync-conflict-handler'));
    const [shortId] = uuid().split('-');

    const functionName = `syncConflictHandler${shortId}`;

    const functionProps = {
      functionName: `${functionName}`,
      roleName: `${functionName}LambdaRole`,
    };

    const copyJobs = [
      {
        dir: assetDir,
        template: 'sync-conflict-handler-index.js.ejs',
        target: path.join(targetDir, 'function', functionName, 'src', 'index.js'),
      },
      {
        dir: assetDir,
        template: 'sync-conflict-handler-package.json.ejs',
        target: path.join(targetDir, 'function', functionName, 'src', 'package.json'),
      },
      {
        dir: assetDir,
        template: 'sync-conflict-handler-template.json.ejs',
        target: path.join(targetDir, 'function', functionName, `${functionName}-cloudformation-template.json`),
      },
    ];

    // copy over the files
    await this.context.amplify.copyBatch(this.context, copyJobs, functionProps, true);

    const backendConfigs = {
      service: FunctionServiceNameLambdaFunction,
      providerPlugin: provider,
      build: true,
    };

    await this.context.amplify.updateamplifyMetaAfterResourceAdd('function', functionName, backendConfigs);
    printer.success(`Successfully added ${functionName} function locally`);

    return functionName + '-${env}';
  };

  private generateAppsyncCLIInputs = async (serviceConfig: AppSyncServiceConfiguration, resourceDir: string) => {
    const appsyncCLIInputs: AppSyncCLIInputs = {
      version: 1,
      serviceConfiguration: {
        apiName: serviceConfig.apiName,
        serviceName: serviceConfig.serviceName,
        gqlSchemaPath: path.join(resourceDir, gqlSchemaFilename),
        defaultAuthType: serviceConfig.defaultAuthType,
      },
    };
    if (!_.isEmpty(serviceConfig.additionalAuthTypes)) {
      appsyncCLIInputs.serviceConfiguration.additionalAuthTypes = serviceConfig.additionalAuthTypes;
    }

    if (!_.isEmpty(serviceConfig.conflictResolution)) {
      appsyncCLIInputs.serviceConfiguration.conflictResolution = {
        defaultResolutionStrategy: serviceConfig.conflictResolution.defaultResolutionStrategy,
        perModelResolutionStrategy: serviceConfig.conflictResolution.perModelResolutionStrategy,
      };
    }
    // deploy appsync inputs
    const cliState = new AppsyncApiInputState(serviceConfig.apiName);
    await cliState.saveCLIInputPayload(appsyncCLIInputs);
    return appsyncCLIInputs;
  };

  private updateAppsyncCLIInputs = async (updates: AppSyncServiceModification, apiName: string) => {
    const cliState = new AppsyncApiInputState(apiName);
    const prevAppsyncInputs = cliState.getCLIInputPayload();

    const appsyncInputs: AppSyncCLIInputs = prevAppsyncInputs;
    if (!_.isEmpty(appsyncInputs.serviceConfiguration)) {
      appsyncInputs.serviceConfiguration.gqlSchemaPath = path.join(this.getResourceDir(apiName), gqlSchemaFilename);
    }
    if (updates.conflictResolution) {
      appsyncInputs.serviceConfiguration.conflictResolution = updates.conflictResolution;
    }
    if (updates.defaultAuthType) {
      appsyncInputs.serviceConfiguration.defaultAuthType = updates.defaultAuthType;
    }
    if (updates.additionalAuthTypes) {
      appsyncInputs.serviceConfiguration.additionalAuthTypes = updates.additionalAuthTypes;
    }
    await cliState.saveCLIInputPayload(appsyncInputs);
    return appsyncInputs;
  };
}

/**
 * This function is defined outside of the class because REST API generation uses it outside of the class above
 * Long-term, the class above should be extended to also include REST API generation
 *
 * write to the transformer conf if the resolverConfig is valid
 */
export const writeResolverConfig = async (conflictResolution: ConflictResolution, resourceDir: string) => {
  const localTransformerConfig = await readTransformerConfiguration(resourceDir);
  localTransformerConfig.ResolverConfig = conflictResolutionToResolverConfig(conflictResolution);
  await writeTransformerConfiguration(resourceDir, localTransformerConfig);
};
