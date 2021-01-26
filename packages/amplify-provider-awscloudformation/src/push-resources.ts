import _ from 'lodash';
import * as fs from 'fs-extra';
import { EOL } from 'os';
import * as path from 'path';
import { validateFile } from 'cfn-lint';
import glob from 'glob';
import {
  pathManager,
  PathConstants,
  stateManager,
  FeatureFlags,
  JSONUtilities,
  $TSAny,
  $TSContext,
  $TSObject,
  $TSMeta,
  DeploymentStepState,
  DeploymentStepStatus,
} from 'amplify-cli-core';
import ora from 'ora';
import { S3 } from './aws-utils/aws-s3';
import Cloudformation from './aws-utils/aws-cfn';
import { formUserAgentParam } from './aws-utils/user-agent';
import constants, { ProviderName as providerName } from './constants';
import { buildResource } from './build-resources';
import { uploadAppSyncFiles } from './upload-appsync-files';
import { prePushGraphQLCodegen, postPushGraphQLCodegen } from './graphql-codegen';
import { prePushAuthTransform } from './auth-transform';
import { transformGraphQLSchema } from './transform-graphql-schema';
import { displayHelpfulURLs } from './display-helpful-urls';
import { downloadAPIModels } from './download-api-models';
import { GraphQLResourceManager } from './graphql-transformer';
import { loadResourceParameters } from './resourceParams';
import { uploadAuthTriggerFiles } from './upload-auth-trigger-files';
import archiver from './utils/archiver';
import amplifyServiceManager from './amplify-service-manager';
import { DeploymentManager } from './iterative-deployment';
import { Fn, Template } from 'cloudform-types';
import { getGqlUpdatedResource } from './graphql-transformer/utils';
import { DeploymentStep, DeploymentOp } from './iterative-deployment/deployment-manager';
import { DeploymentStateManager } from './iterative-deployment/deployment-state-manager';
import { isAmplifyAdminApp } from './utils/admin-helpers';
import { fileLogger } from './utils/aws-logger';
import { createEnvLevelConstructs } from './utils/env-level-constructs';
import { NETWORK_STACK_LOGICAL_ID } from './network/stack';

const logger = fileLogger('push-resources');

// keep in sync with ServiceName in amplify-category-function, but probably it will not change
const FunctionServiceNameLambdaLayer = 'LambdaLayer';
// keep in sync with ServiceName in amplify-category-api, but probably it will not change
const ApiServiceNameElasticContainer = 'ElasticContainer';

const spinner = ora('Updating resources in the cloud. This may take a few minutes...');
const rootStackFileName = 'rootStackTemplate.json';
const nestedStackFileName = 'nested-cloudformation-stack.yml';
const optionalBuildDirectoryName = 'build';
const cfnTemplateGlobPattern = '*template*.+(yaml|yml|json)';
const parametersJson = 'parameters.json';

export async function run(context: $TSContext, resourceDefinition: $TSObject) {
  const deploymentStateManager = await DeploymentStateManager.createDeploymentStateManager(context);
  let iterativeDeploymentWasInvoked = false;

  try {
    const {
      resourcesToBeCreated,
      resourcesToBeUpdated,
      resourcesToBeSynced,
      resourcesToBeDeleted,
      tagsUpdated,
      allResources,
    } = resourceDefinition;
    const clousformationMeta = context.amplify.getProjectMeta().providers.awscloudformation;
    const {
      parameters: { options },
    } = context;

    let resources: $TSObject[];

    if (context.exeInfo && context.exeInfo.forcePush) {
      resources = allResources;
    } else {
      resources = resourcesToBeCreated.concat(resourcesToBeUpdated);
    }

    await createEnvLevelConstructs(context);

    validateCfnTemplates(context, resources);

    for await (const resource of resources) {
      if (resource.service === ApiServiceNameElasticContainer && resource.category === 'api') {
        const {
          exposedContainer,
          pipelineInfo: { consoleUrl },
        } = await context.amplify.invokePluginMethod(context, 'api', undefined, 'generateContainersArtifacts', [context, resource]);
        await context.amplify.updateamplifyMetaAfterResourceUpdate('api', resource.resourceName, 'exposedContainer', exposedContainer);

        context.print.info(`\nIn a few moments, you can check image build status for ${resource.resourceName} at the following URL:`);

        context.print.info(`${consoleUrl}\n`);

        context.print.info(
          `It may take a few moments for this to appear. If you have trouble with first time deployments, please try refreshing this page after a few moments and watch the CodeBuild Details for debugging information.`,
        );
      }

      if (resource.service === ApiServiceNameElasticContainer && resource.category === 'hosting') {
        await context.amplify.invokePluginMethod(context, 'hosting', 'ElasticContainer', 'generateHostingResources', [context, resource]);
      }
    }

    await packageResources(context, resources);

    await transformGraphQLSchema(context, {
      handleMigration: opts => updateStackForAPIMigration(context, 'api', undefined, opts),
      minify: options['minify'],
    });

    // If there is a deployment already in progress we have to fail the push operation as another
    // push in between could lead non-recoverable stacks and files.
    if (await deploymentStateManager.isDeploymentInProgress()) {
      context.print.error('A deployment is already in progress for the project, cannot push resources until it finishes.');

      return;
    }

    let deploymentSteps: DeploymentStep[] = [];

    // location where the intermediate deployment steps are stored
    let stateFolder: string;

    // Check if iterative updates are enabled or not and generate the required deployment steps if needed.
    if (FeatureFlags.getBoolean('graphQLTransformer.enableIterativeGSIUpdates')) {
      const gqlResource = getGqlUpdatedResource(resourcesToBeUpdated);

      if (gqlResource) {
        const gqlManager = await GraphQLResourceManager.createInstance(context, gqlResource, clousformationMeta.StackId);
        deploymentSteps = await gqlManager.run();

        if (deploymentSteps.length > 1) {
          iterativeDeploymentWasInvoked = true;

          // Initialize deployment state to signal a new iterative deployment
          // When using iterative push, the deployment steps provided by GraphQLResourceManager does not include the last step
          // where the root stack is pushed
          const deploymentStepStates: DeploymentStepState[] = new Array(deploymentSteps.length + 1).fill(true).map(() => ({
            status: DeploymentStepStatus.WAITING_FOR_DEPLOYMENT,
          }));

          // If start cannot update because a deployment has started between the start of this method and this point
          // we have to return before uploading any artifacts that could fail the other deployment.
          if (!(await deploymentStateManager.startDeployment(deploymentStepStates))) {
            context.print.error('A deployment is already in progress for the project, cannot push resources until it finishes.');

            return;
          }
        }

        stateFolder = gqlManager.getStateFilesDirectory();
      }
    }

    await uploadAppSyncFiles(context, resources, allResources);
    await prePushAuthTransform(context, resources);
    await prePushGraphQLCodegen(context, resourcesToBeCreated, resourcesToBeUpdated);

    let projectDetails = context.amplify.getProjectDetails();
    await updateS3Templates(context, resources, projectDetails.amplifyMeta);

    // We do not need CloudFormation update if only syncable resources are the changes.
    if (resourcesToBeCreated.length > 0 || resourcesToBeUpdated.length > 0 || resourcesToBeDeleted.length > 0 || tagsUpdated) {
      // If there is an API change, there will be one deployment step. But when there needs an iterative update the step count is > 1
      if (deploymentSteps.length > 1) {
        // create deployment manager
        const deploymentManager = await DeploymentManager.createInstance(context, clousformationMeta.DeploymentBucketName, spinner, {
          userAgent: formUserAgentParam(context, generateUserAgentAction(resourcesToBeCreated, resourcesToBeUpdated)),
        });

        deploymentSteps.forEach(step => deploymentManager.addStep(step));

        // generate nested stack
        const backEndDir = pathManager.getBackendDirPath();
        const nestedStackFilepath = path.normalize(path.join(backEndDir, providerName, nestedStackFileName));
        await generateAndUploadRootStack(context, nestedStackFilepath, nestedStackFileName);

        // Use state manager to do the final deployment. The final deployment include not just API change but the whole Amplify Project
        const finalStep: DeploymentOp = {
          stackTemplatePathOrUrl: nestedStackFileName,
          tableNames: [],
          stackName: clousformationMeta.StackName,
          parameters: {
            DeploymentBucketName: clousformationMeta.DeploymentBucketName,
            AuthRoleName: clousformationMeta.AuthRoleName,
            UnauthRoleName: clousformationMeta.UnauthRoleName,
          },
          capabilities: ['CAPABILITY_NAMED_IAM', 'CAPABILITY_AUTO_EXPAND'],
        };

        deploymentManager.addStep({
          deployment: finalStep,
          rollback: deploymentSteps[deploymentSteps.length - 1].deployment,
        });

        spinner.start();
        await deploymentManager.deploy(deploymentStateManager);

        // delete the intermidiate states as it is ephemeral
        if (stateFolder && fs.existsSync(stateFolder)) {
          fs.removeSync(stateFolder);
        }
      } else {
        // Non iterative update
        spinner.start();

        const nestedStack = await formNestedStack(context, context.amplify.getProjectDetails());

        await updateCloudFormationNestedStack(context, nestedStack, resourcesToBeCreated, resourcesToBeUpdated);
      }
    }

    await postPushGraphQLCodegen(context);
    await amplifyServiceManager.postPushCheck(context);

    if (resources.concat(resourcesToBeDeleted).length > 0) {
      await context.amplify.updateamplifyMetaAfterPush(resources);
    }

    if (resourcesToBeSynced.length > 0) {
      const importResources = resourcesToBeSynced.filter((r: { sync: string }) => r.sync === 'import');
      const unlinkedResources = resourcesToBeSynced.filter((r: { sync: string }) => r.sync === 'unlink');

      if (importResources.length > 0) {
        await context.amplify.updateamplifyMetaAfterPush(importResources);
      }

      if (unlinkedResources.length > 0) {
        for (let i = 0; i < unlinkedResources.length; i++) {
          context.amplify.updateamplifyMetaAfterResourceDelete(unlinkedResources[i].category, unlinkedResources[i].resourceName);
        }
      }
    }

    for (let i = 0; i < resourcesToBeDeleted.length; i++) {
      context.amplify.updateamplifyMetaAfterResourceDelete(resourcesToBeDeleted[i].category, resourcesToBeDeleted[i].resourceName);
    }

    await uploadAuthTriggerFiles(context, resourcesToBeCreated, resourcesToBeUpdated);

    let updatedAllResources = (await context.amplify.getResourceStatus()).allResources;

    const newAPIresources = [];

    updatedAllResources = updatedAllResources.filter((resource: { service: string }) => resource.service === 'API Gateway');

    for (let i = 0; i < updatedAllResources.length; i++) {
      if (resources.findIndex(resource => resource.resourceName === updatedAllResources[i].resourceName) > -1) {
        newAPIresources.push(updatedAllResources[i]);
      }
    }

    // Check if there was any imported auth resource and if there was we have to refresh the
    // COGNITO_USER_POOLS configuration for AppSync APIs in meta if we have any
    if (resourcesToBeSynced.length > 0) {
      const importResources = resourcesToBeSynced.filter((r: { sync: string }) => r.sync === 'import');

      if (importResources.length > 0) {
        const { imported, userPoolId } = context.amplify.getImportedAuthProperties(context);

        // Sanity check it will always be true in this case
        if (imported) {
          const appSyncAPIs = allResources.filter((resource: { service: string }) => resource.service === 'AppSync');
          const meta = stateManager.getMeta(undefined);
          let hasChanges = false;

          for (const appSyncAPI of appSyncAPIs) {
            const apiResource = _.get(meta, ['api', appSyncAPI.resourceName]);

            if (apiResource) {
              const defaultAuthentication = _.get(apiResource, ['output', 'authConfig', 'defaultAuthentication']);

              if (defaultAuthentication && defaultAuthentication.authenticationType === 'AMAZON_COGNITO_USER_POOLS') {
                defaultAuthentication.userPoolConfig.userPoolId = userPoolId;

                hasChanges = true;
              }

              const additionalAuthenticationProviders = _.get(apiResource, ['output', 'authConfig', 'additionalAuthenticationProviders']);

              for (const additionalAuthenticationProvider of additionalAuthenticationProviders) {
                if (
                  additionalAuthenticationProvider &&
                  additionalAuthenticationProvider.authenticationType === 'AMAZON_COGNITO_USER_POOLS'
                ) {
                  additionalAuthenticationProvider.userPoolConfig.userPoolId = userPoolId;

                  hasChanges = true;
                }
              }
            }
          }

          if (hasChanges) {
            stateManager.setMeta(undefined, meta);
          }
        }
      }
    }

    await downloadAPIModels(context, newAPIresources);

    // Store current cloud backend in S3 deployment bcuket
    await storeCurrentCloudBackend(context);
    await amplifyServiceManager.storeArtifactsForAmplifyService(context);

    //check for auth resources and remove deployment secret for push
    resources
      .filter(resource => resource.category === 'auth' && resource.service === 'Cognito' && resource.providerPlugin === 'awscloudformation')
      .map(({ category, resourceName }) => context.amplify.removeDeploymentSecrets(context, category, resourceName));

    spinner.succeed('All resources are updated in the cloud');

    await displayHelpfulURLs(context, resources);
  } catch (error) {
    if (iterativeDeploymentWasInvoked) {
      await deploymentStateManager.failDeployment();
    }
    spinner.fail('An error occurred when pushing the resources to the cloud');

    logger('run', [resourceDefinition])(error);

    throw error;
  }
}

export async function updateStackForAPIMigration(context: $TSContext, category: string, resourceName: string, options: $TSAny) {
  const { resourcesToBeCreated, resourcesToBeUpdated, resourcesToBeDeleted, allResources } = await context.amplify.getResourceStatus(
    category,
    resourceName,
    providerName,
  );

  const { isReverting, isCLIMigration } = options;

  let resources = resourcesToBeCreated.concat(resourcesToBeUpdated);
  let projectDetails = context.amplify.getProjectDetails();

  validateCfnTemplates(context, resources);

  resources = allResources.filter(resource => resource.service === 'AppSync');

  await packageResources(context, resources);

  await uploadAppSyncFiles(context, resources, allResources, {
    useDeprecatedParameters: isReverting,
    defaultParams: {
      CreateAPIKey: 0,
      APIKeyExpirationEpoch: -1,
      authRoleName: {
        Ref: 'AuthRoleName',
      },
      unauthRoleName: {
        Ref: 'UnauthRoleName',
      },
    },
  });

  await updateS3Templates(context, resources, projectDetails.amplifyMeta);

  try {
    if (!isCLIMigration) {
      spinner.start();
    }

    projectDetails = context.amplify.getProjectDetails();

    if (resources.length > 0 || resourcesToBeDeleted.length > 0) {
      // isCLIMigration implies a top level CLI migration is underway.
      // We do not inject an env in such situations so we pass a resourceName.
      // When it is an API level migration, we do pass an env so omit the resourceName.
      let nestedStack: Template;

      if (isReverting && isCLIMigration) {
        // When this is a CLI migration and we are rolling back, we do not want to inject
        // an [env] for any templates.
        nestedStack = await formNestedStack(context, projectDetails, category, resourceName, 'AppSync', true);
      } else if (isCLIMigration) {
        nestedStack = await formNestedStack(context, projectDetails, category, resourceName, 'AppSync');
      } else {
        nestedStack = await formNestedStack(context, projectDetails, category);
      }

      await updateCloudFormationNestedStack(context, nestedStack, resourcesToBeCreated, resourcesToBeUpdated);
    }

    await context.amplify.updateamplifyMetaAfterPush(resources);

    if (!isCLIMigration) {
      spinner.stop();
    }
  } catch (error) {
    if (!isCLIMigration) {
      spinner.fail('An error occurred when migrating the API project.');
    }

    throw error;
  }
}

export async function storeCurrentCloudBackend(context: $TSContext) {
  const zipFilename = '#current-cloud-backend.zip';
  const backendDir = pathManager.getBackendDirPath();
  const tempDir = path.join(backendDir, '.temp');
  const currentCloudBackendDir = pathManager.getCurrentCloudBackendDirPath();

  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }
  // handle tag file
  const tagFilePath = pathManager.getTagFilePath();
  const tagCloudFilePath = pathManager.getCurrentTagFilePath();
  if (fs.existsSync(tagFilePath)) {
    fs.copySync(tagFilePath, tagCloudFilePath, { overwrite: true });
  }

  const cliJSONFiles = glob.sync(PathConstants.CLIJSONFileNameGlob, {
    cwd: pathManager.getAmplifyDirPath(),
    absolute: true,
  });

  const zipFilePath = path.normalize(path.join(tempDir, zipFilename));
  let log = null;
  const result = await archiver.run(currentCloudBackendDir, zipFilePath, undefined, cliJSONFiles);

  const s3Key = `${result.zipFilename}`;

  const s3 = await S3.getInstance(context);

  const s3Params = {
    Body: fs.createReadStream(result.zipFilePath),
    Key: s3Key,
  };

  log = logger('storeCurrentcoudBackend.s3.uploadFile', [{ Key: s3Key }]);
  log();
  try {
    await s3.uploadFile(s3Params);
  } catch (error) {
    log(error);
    throw error;
  }

  fs.removeSync(tempDir);
}

function validateCfnTemplates(context: $TSContext, resourcesToBeUpdated: $TSAny[]) {
  for (const { category, resourceName } of resourcesToBeUpdated) {
    const backEndDir = pathManager.getBackendDirPath();
    const resourceDir = path.normalize(path.join(backEndDir, category, resourceName));
    const cfnFiles = glob.sync(cfnTemplateGlobPattern, {
      cwd: resourceDir,
      ignore: [parametersJson],
    });

    for (const cfnFile of cfnFiles) {
      const filePath = path.normalize(path.join(resourceDir, cfnFile));

      try {
        validateFile(filePath);
      } catch (err) {
        context.print.error(`Invalid CloudFormation template: ${filePath}${EOL}${err.message}`);
      }
    }
  }
}

async function packageResources(context: $TSContext, resources: $TSAny[]) {
  // Only build and package resources which are required
  return Promise.all(resources.filter(resource => resource.build).map(resource => packageResource(context, resource)));
}

async function packageResource(context: $TSContext, resource: $TSAny) {
  let result: $TSAny;
  let log: $TSAny = null;
  const { envName }: { envName: string } = context.amplify.getEnvInfo();

  if (resource.service === FunctionServiceNameLambdaLayer) {
    result = await context.amplify.invokePluginMethod(context, 'function', undefined, 'packageLayer', [context, resource]);
  } else {
    result = await buildResource(context, resource);
  }

  // Upload zip file to S3
  const s3Key = `amplify-builds/${result.zipFilename}`;

  const s3 = await S3.getInstance(context);

  const s3Params = {
    Body: fs.createReadStream(result.zipFilePath),
    Key: s3Key,
  };
  log = logger('packageResources.s3.uploadFile', [{ Key: s3Key }]);
  log();
  let s3Bucket: string;
  try {
    s3Bucket = await s3.uploadFile(s3Params);
  } catch (error) {
    log(error);
    throw error;
  }

  // Update cfn template
  const { category, resourceName }: { category: string; resourceName: string } = resource;
  const backEndDir = pathManager.getBackendDirPath();
  const resourceDir = path.normalize(path.join(backEndDir, category, resourceName));

  const cfnFiles = glob.sync(cfnTemplateGlobPattern, {
    cwd: resourceDir,
    ignore: [parametersJson],
  });

  if (cfnFiles.length !== 1) {
    const errorMessage =
      cfnFiles.length > 1
        ? 'Only one CloudFormation template is allowed in the resource directory'
        : 'CloudFormation template is missing in the resource directory';
    context.print.error(errorMessage);
    context.print.error(resourceDir);

    throw new Error(errorMessage);
  }

  const cfnFile = cfnFiles[0];
  const cfnFilePath = path.normalize(path.join(resourceDir, cfnFile));
  const cfnMeta = JSONUtilities.readJson<$TSAny>(cfnFilePath);
  const paramType = { Type: 'String' };

  if (resource.service === FunctionServiceNameLambdaLayer) {
    cfnMeta.Parameters.deploymentBucketName = paramType;
    cfnMeta.Parameters.s3Key = paramType;
    storeS3BucketInfo(category, s3Bucket, envName, resourceName, s3Key);
  } else if (resource.service === ApiServiceNameElasticContainer) {
    const cfnParams = { ParamZipPath: s3Key };

    const cfnParamsFilePath = path.normalize(path.join(resourceDir, 'parameters.json'));
    JSONUtilities.writeJson(cfnParamsFilePath, cfnParams);
  } else {
    cfnMeta.Parameters.deploymentBucketName = paramType;
    cfnMeta.Parameters.s3Key = paramType;
    if (cfnMeta.Resources.LambdaFunction.Type === 'AWS::Serverless::Function') {
      cfnMeta.Resources.LambdaFunction.Properties.CodeUri = {
        Bucket: Fn.Ref('deploymentBucketName'),
        Key: Fn.Ref('s3Key'),
      };
    } else {
      cfnMeta.Resources.LambdaFunction.Properties.Code = {
        S3Bucket: Fn.Ref('deploymentBucketName'),
        S3Key: Fn.Ref('s3Key'),
      };
    }
    storeS3BucketInfo(category, s3Bucket, envName, resourceName, s3Key);
  }
  JSONUtilities.writeJson(cfnFilePath, cfnMeta);
}

function storeS3BucketInfo(category: string, deploymentBucketName: string, envName: string, resourceName: string, s3Key: string) {
  const amplifyMeta = stateManager.getMeta();
  const teamProviderInfo = stateManager.getTeamProviderInfo();

  const tpiResourceParams: $TSAny = _.get(teamProviderInfo, [envName, 'categories', category, resourceName], {});
  _.assign(tpiResourceParams, { deploymentBucketName, s3Key });
  _.set(teamProviderInfo, [envName, 'categories', category, resourceName], tpiResourceParams);

  _.set(amplifyMeta, [category, resourceName, 's3Bucket'], { deploymentBucketName, s3Key });
  stateManager.setMeta(undefined, amplifyMeta);
  stateManager.setTeamProviderInfo(undefined, teamProviderInfo);
}

async function updateCloudFormationNestedStack(
  context: $TSContext,
  nestedStack: $TSAny,
  resourcesToBeCreated: $TSAny,
  resourcesToBeUpdated: $TSAny,
) {
  const backEndDir = pathManager.getBackendDirPath();
  const nestedStackFilepath = path.normalize(path.join(backEndDir, providerName, nestedStackFileName));

  JSONUtilities.writeJson(nestedStackFilepath, nestedStack);

  const cfnItem = await new Cloudformation(context, generateUserAgentAction(resourcesToBeCreated, resourcesToBeUpdated));
  const providerDirectory = path.normalize(path.join(backEndDir, providerName));

  const log = logger('updateCloudFormationNestedStack', [providerDirectory, nestedStackFilepath]);
  try {
    log();
    await cfnItem.updateResourceStack(path.normalize(path.join(backEndDir, providerName)), nestedStackFileName);
  } catch (error) {
    log(error);
    throw error;
  }
}

function generateUserAgentAction(resourcesToBeCreated: $TSAny, resourcesToBeUpdated: $TSAny) {
  const uniqueCategoriesAdded = getAllUniqueCategories(resourcesToBeCreated);
  const uniqueCategoriesUpdated = getAllUniqueCategories(resourcesToBeUpdated);
  let userAgentAction = '';

  if (uniqueCategoriesAdded.length > 0) {
    uniqueCategoriesAdded.forEach(category => {
      if (category.length >= 2) {
        category = category.substring(0, 2);
      }

      userAgentAction += `${category}:c `;
    });
  }

  if (uniqueCategoriesUpdated.length > 0) {
    uniqueCategoriesUpdated.forEach(category => {
      if (category.length >= 2) {
        category = category.substring(0, 2);
      }

      userAgentAction += `${category}:u `;
    });
  }
  return userAgentAction;
}

function getAllUniqueCategories(resources: $TSObject[]): $TSObject[] {
  const categories = new Set();

  resources.forEach(resource => categories.add(resource.category));

  return [...categories];
}

function getCfnFiles(category: string, resourceName: string) {
  const backEndDir = pathManager.getBackendDirPath();
  const resourceDir = path.normalize(path.join(backEndDir, category, resourceName));
  const resourceBuildDir = path.join(resourceDir, optionalBuildDirectoryName);

  /**
   * The API category w/ GraphQL builds into a build/ directory.
   * This looks for a build directory and uses it if one exists.
   * Otherwise falls back to the default behavior.
   */
  if (fs.existsSync(resourceBuildDir) && fs.lstatSync(resourceBuildDir).isDirectory()) {
    const cfnFiles = glob.sync(cfnTemplateGlobPattern, {
      cwd: resourceBuildDir,
      ignore: [parametersJson],
    });

    if (cfnFiles.length > 0) {
      return {
        resourceDir: resourceBuildDir,
        cfnFiles,
      };
    }
  }

  const cfnFiles = glob.sync(cfnTemplateGlobPattern, {
    cwd: resourceDir,
    ignore: [parametersJson],
  });

  return {
    resourceDir,
    cfnFiles,
  };
}

function updateS3Templates(context: $TSContext, resourcesToBeUpdated: $TSAny, amplifyMeta: $TSMeta) {
  const promises = [];

  for (const { category, resourceName } of resourcesToBeUpdated) {
    const { resourceDir, cfnFiles } = getCfnFiles(category, resourceName);

    for (const cfnFile of cfnFiles) {
      promises.push(uploadTemplateToS3(context, resourceDir, cfnFile, category, resourceName, amplifyMeta));
    }
  }

  return Promise.all(promises);
}

async function uploadTemplateToS3(
  context: $TSContext,
  resourceDir: string,
  cfnFile: string,
  category: string,
  resourceName: string,
  amplifyMeta: $TSMeta,
) {
  const filePath = path.normalize(path.join(resourceDir, cfnFile));
  const s3 = await S3.getInstance(context);

  const s3Params = {
    Body: fs.createReadStream(filePath),
    Key: `amplify-cfn-templates/${category}/${cfnFile}`,
  };

  const log = logger('uploadTemplateToS3.s3.uploadFile', [{ Key: s3Params.Key }]);
  let projectBucket;
  try {
    projectBucket = await s3.uploadFile(s3Params, false);
  } catch (error) {
    log(error);
    throw error;
  }

  const templateURL = `https://s3.amazonaws.com/${projectBucket}/amplify-cfn-templates/${category}/${cfnFile}`;
  const providerMetadata = amplifyMeta[category][resourceName].providerMetadata || {};

  providerMetadata.s3TemplateURL = templateURL;
  providerMetadata.logicalId = category + resourceName;

  context.amplify.updateamplifyMetaAfterResourceUpdate(category, resourceName, 'providerMetadata', providerMetadata);
}

async function formNestedStack(
  context: $TSContext,
  projectDetails: $TSObject,
  categoryName?: string,
  resourceName?: string,
  serviceName?: string,
  skipEnv?: boolean,
) {
  const initTemplateFilePath = path.join(__dirname, '..', 'resources', rootStackFileName);
  const nestedStack = JSONUtilities.readJson<Template>(initTemplateFilePath);

  // Track Amplify Console generated stacks
  try {
    const amplifyMeta = stateManager.getMeta();
    const appId = amplifyMeta.providers[providerName].AmplifyAppId;
    if ((await isAmplifyAdminApp(appId)).isAdminApp) {
      nestedStack.Description = 'Root Stack for AWS Amplify Console';
    }
  } catch (err) {
    console.info('App not deployed yet.');
  }

  const { amplifyMeta } = projectDetails;
  let authResourceName: string;

  const { NetworkStackS3Url } = amplifyMeta.providers[constants.ProviderName];

  if (NetworkStackS3Url) {
    nestedStack.Resources[NETWORK_STACK_LOGICAL_ID] = {
      Type: 'AWS::CloudFormation::Stack',
      Properties: {
        TemplateURL: NetworkStackS3Url,
      },
    };

    nestedStack.Resources.DeploymentBucket.Properties['VersioningConfiguration'] = {
      Status: 'Enabled',
    };

    nestedStack.Resources.DeploymentBucket.Properties['LifecycleConfiguration'] = {
      Rules: [
        {
          ExpirationInDays: 7,
          NoncurrentVersionExpirationInDays: 7,
          Prefix: 'codepipeline-amplify/',
          Status: 'Enabled',
        },
      ],
    };
  }

  let categories = Object.keys(amplifyMeta);

  categories = categories.filter(category => category !== 'provider');

  categories.forEach(category => {
    const resources = Object.keys(amplifyMeta[category]);

    resources.forEach(resource => {
      const resourceDetails = amplifyMeta[category][resource];

      if (category === 'auth' && resource !== 'userPoolGroups') {
        authResourceName = resource;
      }

      const resourceKey = category + resource;
      let templateURL;

      if (resourceDetails.providerPlugin) {
        const parameters = <$TSObject>loadResourceParameters(context, category, resource);
        const { dependsOn } = resourceDetails;

        if (dependsOn) {
          for (let i = 0; i < dependsOn.length; i += 1) {
            for (let j = 0; j < dependsOn[i].attributes.length; j += 1) {
              // If the depends on resource is an imported resource we cannot form GetAtt type reference
              // since there is no such thing. We have to read the output.{AttributeName} from the meta
              // and inject the value itself into the parameters block
              let parameterValue;

              const dependentResource = _.get(amplifyMeta, [dependsOn[i].category, dependsOn[i].resourceName], undefined);

              if (!dependentResource && dependsOn[i].category) {
                throw new Error(`Cannot get resource: ${dependsOn[i].resourceName} from '${dependsOn[i].category}' category.`);
              }

              if (dependentResource && dependentResource.serviceType === 'imported') {
                const outputAttributeValue = _.get(dependentResource, ['output', dependsOn[i].attributes[j]], undefined);

                if (!outputAttributeValue) {
                  const error = new Error(
                    `Cannot read the '${dependsOn[i].attributes[j]}' dependent attribute value from the output section of resource: '${dependsOn[i].resourceName}'.`,
                  );
                  error.stack = undefined;

                  throw error;
                }

                parameterValue = outputAttributeValue;
              } else {
                const dependsOnStackName = dependsOn[i].category + dependsOn[i].resourceName;

                parameterValue = { 'Fn::GetAtt': [dependsOnStackName, `Outputs.${dependsOn[i].attributes[j]}`] };
              }

              const parameterKey = `${dependsOn[i].category}${dependsOn[i].resourceName}${dependsOn[i].attributes[j]}`;

              parameters[parameterKey] = parameterValue;
            }

            if (dependsOn[i].exports) {
              Object.keys(dependsOn[i].exports)
                .map(key => ({ key, value: dependsOn[i].exports[key] }))
                .forEach(({ key, value }) => {
                  parameters[key] = { 'Fn::ImportValue': value };
                });
            }
          }
        }

        const values = Object.values(parameters);
        const keys = Object.keys(parameters);

        for (let a = 0; a < values.length; a += 1) {
          if (Array.isArray(values[a])) {
            parameters[keys[a]] = values[a].join();
          }
        }

        const currentEnv = context.amplify.getEnvInfo().envName;

        if (!skipEnv && resourceName) {
          if (resource === resourceName && category === categoryName && amplifyMeta[category][resource].service === serviceName) {
            Object.assign(parameters, { env: currentEnv });
          }
        } else if (!skipEnv) {
          Object.assign(parameters, { env: currentEnv });
        }

        // If auth is imported check the parameters section of the nested template
        // and if it has auth or unauth role arn or name or userpool id, then inject it from the
        // imported auth resource's properties
        const {
          imported,
          userPoolId,
          authRoleArn,
          authRoleName,
          unauthRoleArn,
          unauthRoleName,
        } = context.amplify.getImportedAuthProperties(context);

        if (category !== 'auth' && resourceDetails.service !== 'Cognito' && imported) {
          if (parameters.AuthCognitoUserPoolId) {
            parameters.AuthCognitoUserPoolId = userPoolId;
          }

          if (parameters.authRoleArn) {
            parameters.authRoleArn = authRoleArn;
          }

          if (parameters.authRoleName) {
            parameters.authRoleName = authRoleName;
          }

          if (parameters.unauthRoleArn) {
            parameters.unauthRoleArn = unauthRoleArn;
          }

          if (parameters.unauthRoleName) {
            parameters.unauthRoleName = unauthRoleName;
          }
        }

        if (resourceDetails.providerMetadata) {
          templateURL = resourceDetails.providerMetadata.s3TemplateURL;

          nestedStack.Resources[resourceKey] = {
            Type: 'AWS::CloudFormation::Stack',
            Properties: {
              TemplateURL: templateURL,
              Parameters: parameters,
            },
          };
        }
      }
    });
  });

  if (authResourceName) {
    const importedAuth = _.get(amplifyMeta, ['auth', authResourceName], undefined);

    // If auth is imported we cannot update the IDP as it is not part of the stack resources we deploy.
    if (importedAuth && importedAuth.serviceType !== 'imported') {
      const authParameters = loadResourceParameters(context, 'auth', authResourceName);

      if (authParameters.identityPoolName) {
        updateIdPRolesInNestedStack(nestedStack, authResourceName);
      }
    }
  }

  return nestedStack;
}

function updateIdPRolesInNestedStack(nestedStack: $TSAny, authResourceName: $TSAny) {
  const authLogicalResourceName = `auth${authResourceName}`;
  const idpUpdateRoleCfnFilePath = path.join(__dirname, '..', 'resources', 'update-idp-roles-cfn.json');
  const idpUpdateRoleCfn = JSONUtilities.readJson<$TSObject>(idpUpdateRoleCfnFilePath);

  idpUpdateRoleCfn.UpdateRolesWithIDPFunction.DependsOn.push(authLogicalResourceName);
  idpUpdateRoleCfn.UpdateRolesWithIDPFunctionOutputs.Properties.idpId['Fn::GetAtt'].unshift(authLogicalResourceName);

  Object.assign(nestedStack.Resources, idpUpdateRoleCfn);
}

export async function generateAndUploadRootStack(context: $TSContext, destinationPath: string, destinationS3Key: string) {
  const projectDetails = context.amplify.getProjectDetails();
  const nestedStack = await formNestedStack(context, projectDetails);

  JSONUtilities.writeJson(destinationPath, nestedStack);

  // upload the nested stack
  const s3Client = await S3.getInstance(context);
  const s3Params = {
    Body: Buffer.from(JSONUtilities.stringify(nestedStack)),
    Key: destinationS3Key,
  };

  await s3Client.uploadFile(s3Params, false);
}
