import { ApiArtifactHandler } from '../api-artifact-handler';
import {
  AddApiRequest,
  ConflictResolution,
  AppSyncServiceConfiguration,
  ResolutionStrategy,
  UpdateApiRequest,
} from 'amplify-headless-interface';
import path from 'path';
import fs from 'fs-extra';
import { category } from '../../category-constants';
import { rootAssetDir, provider, gqlSchemaFilename, cfnParametersFilename } from './aws-constants';
import { readTransformerConfiguration, TRANSFORM_CURRENT_VERSION, writeTransformerConfiguration } from 'graphql-transformer-core';
import { conflictResolutionToResolverConfig } from './utils/resolver-config-to-conflict-resolution-bi-di-mapper';
import { appSyncAuthTypeToAuthConfig } from './utils/auth-config-to-app-sync-auth-type-bi-di-mapper';
import uuid from 'uuid';
import _ from 'lodash';
import { getAppSyncResourceName, getAppSyncAuthConfig, checkIfAuthExists, authConfigHasApiKey } from './utils/amplify-meta-utils';
import { printApiKeyWarnings } from './utils/print-api-key-warnings';

// keep in sync with ServiceName in amplify-category-function, but probably it will not change
const FunctionServiceNameLambdaFunction = 'Lambda';

export const getCfnApiArtifactHandler = (context): ApiArtifactHandler => {
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
  private readonly context: any;

  constructor(context) {
    this.context = context;
  }

  // TODO once the AddApiRequest contains multiple services this class should depend on an ApiArtifactHandler
  // for each service and delegate to the correct one
  createArtifacts = async (request: AddApiRequest): Promise<string> => {
    const existingApiName = getAppSyncResourceName(this.context.amplify.getProjectMeta());
    if (existingApiName) {
      throw new Error(`GraphQL API ${existingApiName} already exists in the project. Use 'amplify update api' to make modifications.`);
    }
    const serviceConfig = request.serviceConfiguration;
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

    // Write the default custom resources stack out to disk.
    fs.copyFileSync(
      path.join(rootAssetDir, 'cloudformation-templates', 'defaultCustomResources.json'),
      path.join(resourceDir, stacksDirName, defaultStackName),
    );

    // write the template buffer to the project folder
    this.writeSchema(resourceDir, serviceConfig.transformSchema);

    const authConfig = this.extractAuthConfig(serviceConfig);

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
  updateArtifacts = async (request: UpdateApiRequest): Promise<void> => {
    const updates = request.serviceModification;
    const apiName = getAppSyncResourceName(this.context.amplify.getProjectMeta());
    if (!apiName) {
      throw new Error(`No AppSync API configured in the project. Use 'amplify add api' to create an API.`);
    }
    const resourceDir = this.getResourceDir(apiName);
    if (updates.transformSchema) {
      this.writeSchema(resourceDir, updates.transformSchema);
    }
    if (updates.conflictResolution) {
      updates.conflictResolution = await this.createResolverResources(updates.conflictResolution);
      await writeResolverConfig(updates.conflictResolution, resourceDir);
    }
    const authConfig = getAppSyncAuthConfig(this.context.amplify.getProjectMeta());
    const oldConfigHadApiKey = authConfigHasApiKey(authConfig);
    if (updates.defaultAuthType) {
      authConfig.defaultAuthentication = appSyncAuthTypeToAuthConfig(updates.defaultAuthType);
    }
    if (updates.additionalAuthTypes) {
      authConfig.additionalAuthenticationProviders = updates.additionalAuthTypes.map(appSyncAuthTypeToAuthConfig);
    }
    await this.context.amplify.executeProviderUtils(this.context, 'awscloudformation', 'compileSchema', {
      resourceDir,
      parameters: this.getCfnParameters(apiName, authConfig, resourceDir),
      authConfig,
    });

    this.context.amplify.updateamplifyMetaAfterResourceUpdate(category, apiName, 'output', { authConfig });
    this.context.amplify.updateBackendConfigAfterResourceUpdate(category, apiName, 'output', { authConfig });
    printApiKeyWarnings(this.context, oldConfigHadApiKey, authConfigHasApiKey(authConfig));
  };

  private writeSchema = (resourceDir: string, schema: string) => {
    fs.writeFileSync(path.join(resourceDir, gqlSchemaFilename), schema);
  };

  private getResourceDir = (apiName: string) => path.join(this.context.amplify.pathManager.getBackendDirPath(), category, apiName);

  private createAmplifyMeta = authConfig => ({
    service: 'AppSync',
    providerPlugin: provider,
    output: {
      authConfig,
    },
  });

  private extractAuthConfig = (config: AppSyncServiceConfiguration) => ({
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
    const params =
      this.context.amplify.readJsonFile(path.join(resourceDir, cfnParametersFilename), undefined, false) || defaultCfnParameters(apiName);
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
      const configuredUserPoolName = checkIfAuthExists(this.context);

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
    const targetDir = this.context.amplify.pathManager.getBackendDirPath();
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
        target: `${targetDir}/function/${functionName}/src/index.js`,
      },
      {
        dir: assetDir,
        template: 'sync-conflict-handler-package.json.ejs',
        target: `${targetDir}/function/${functionName}/src/package.json`,
      },
      {
        dir: assetDir,
        template: 'sync-conflict-handler-template.json.ejs',
        target: `${targetDir}/function/${functionName}/${functionName}-cloudformation-template.json`,
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
    this.context.print.success(`Successfully added ${functionName} function locally`);

    return functionName + '-${env}';
  };
}

/**
 * This function is defined outside of the class because REST API generation uses it outside of the class above
 * Long-term, the class above should be extended to also include REST API generation
 *
 * write to the transformer conf if the resolverConfig is valid
 */
export const writeResolverConfig = async (conflictResolution: ConflictResolution, resourceDir) => {
  const localTransformerConfig = await readTransformerConfiguration(resourceDir);
  localTransformerConfig.ResolverConfig = conflictResolutionToResolverConfig(conflictResolution);
  await writeTransformerConfiguration(resourceDir, localTransformerConfig);
};
