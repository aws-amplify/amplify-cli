import { ApiArtifactHandler } from '../ApiArtifactHandler';
import { AddApiRequest, ConflictResolution, AppSyncServiceConfiguration, ResolutionStrategy } from 'amplify-headless-interface';
import path from 'path';
import fs from 'fs-extra';
import { category } from '../../categoryConstants';
import { rootAssetDir, provider } from './awsConstants';
import { readTransformerConfiguration, TRANSFORM_CURRENT_VERSION, writeTransformerConfiguration } from 'graphql-transformer-core';
import { conflictResolutionToResolverConfig } from './utils/resolverConfigToConflictResolutionBiDiMapper';
import { appSyncAuthTypeToAuthConfig } from './utils/authConfigToAppSyncAuthTypeBiDiMapper';
import uuid from 'uuid';
import _ from 'lodash';

export const getCfnApiArtifactHandler = (context): ApiArtifactHandler => {
  return new CfnApiArtifactHandler(context);
};
const schemaFileName = 'schema.graphql';
const resolversDirName = 'resolvers';
const stacksDirName = 'stacks';
const defaultStackName = 'CustomResources.json';

const defaultCfnParameters = (apiName: string) => ({
  AppSyncApiName: apiName,
  DynamoDBBillingMode: 'PAY_PER_REQUEST',
  DynamoDBEnableServerSideEncryption: false,
});
class CfnApiArtifactHandler implements ApiArtifactHandler {
  private context: any;

  constructor(context) {
    this.context = context;
  }

  createArtifacts = async (request: AddApiRequest): Promise<string> => {
    const serviceConfig = request.serviceConfiguration;
    const backendDir = this.context.amplify.pathManager.getBackendDirPath();
    const resourceDir = path.join(backendDir, category, serviceConfig.apiName);

    // Ensure the project directory exists and create the stacks & resolvers directories.
    fs.ensureDirSync(resourceDir);
    const resolverDirectoryPath = path.join(resourceDir, resolversDirName);
    if (!fs.existsSync(resolverDirectoryPath)) {
      fs.mkdirSync(resolverDirectoryPath);
    }
    const stacksDirectoryPath = path.join(resourceDir, stacksDirName);
    if (!fs.existsSync(stacksDirectoryPath)) {
      fs.mkdirSync(stacksDirectoryPath);
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
    fs.writeFileSync(path.join(resourceDir, schemaFileName), serviceConfig.transformSchema);

    const authConfig = this.extractAuthConfig(serviceConfig);

    await this.context.amplify.executeProviderUtils(this.context, 'awscloudformation', 'compileSchema', {
      resourceDir,
      parameters: defaultCfnParameters(serviceConfig.apiName),
      authConfig,
    });

    this.context.amplify.updateamplifyMetaAfterResourceAdd(category, serviceConfig.apiName, this.createAmplifyMeta(authConfig));
    return serviceConfig.apiName;
  };

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
      service: 'Lambda',
      providerPlugin: 'awscloudformation',
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
  if (conflictResolution && (conflictResolution.defaultResolutionStrategy || conflictResolution.perModelResolutionStrategy)) {
    const localTransformerConfig = await readTransformerConfiguration(resourceDir);
    localTransformerConfig.ResolverConfig = conflictResolutionToResolverConfig(conflictResolution);
    await writeTransformerConfiguration(resourceDir, localTransformerConfig);
  }
};
