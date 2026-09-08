// TODO This file is a catastrophe that is going to need a dedicated refactor effort
/* eslint-disable import/no-cycle */
/* eslint-disable max-depth */
/* eslint-disable max-lines-per-function */
/* eslint-disable prefer-const */
/* eslint-disable no-param-reassign */
/* eslint-disable no-return-await */
/* eslint-disable consistent-return */
/* eslint-disable no-continue */
/* eslint-disable max-len */
/* eslint-disable spellcheck/spell-checker */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable func-style */
/* eslint-disable no-restricted-syntax */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-await-in-loop */
import _ from 'lodash';
import * as fs from 'fs-extra';
import * as path from 'path';
import type { GlobOptionsWithFileTypesFalse } from 'glob';
import { globSync } from 'glob';
import {
  AmplifyCategories,
  AmplifySupportedService,
  pathManager,
  stateManager,
  FeatureFlags,
  JSONUtilities,
  $TSAny,
  $TSContext,
  $TSObject,
  $TSMeta,
  DeploymentStepState,
  DeploymentStepStatus,
  readCFNTemplate,
  Template,
  ApiCategoryFacade,
  AmplifyError,
  AmplifyFault,
  ManuallyTimedCodePath,
} from '@aws-amplify/amplify-cli-core';
import { Fn } from 'cloudform-types';
import { getEnvParamManager } from '@aws-amplify/amplify-environment-parameters';
import { printer } from '@aws-amplify/amplify-prompts';
import { S3 } from './aws-utils/aws-s3';
import Cloudformation from './aws-utils/aws-cfn';
import { formUserAgentParam } from './aws-utils/user-agent';
import constants, { ProviderName as providerName } from './constants';
import { uploadAppSyncFiles } from './upload-appsync-files';
import { prePushGraphQLCodegen, postPushGraphQLCodegen } from './graphql-codegen';
import { adminModelgen } from './admin-modelgen';
import { prePushAuthTransform } from './auth-transform';
import { displayHelpfulURLs } from './display-helpful-urls';
import { downloadAPIModels } from './download-api-models';
import { GraphQLResourceManager } from './graphql-resource-manager';
import { loadResourceParameters } from './resourceParams';
import { uploadAuthTriggerFiles } from './upload-auth-trigger-files';
import { storeCurrentCloudBackend } from './utils/upload-current-cloud-backend';
import { storeArtifactsForAmplifyService, postPushCheck } from './amplify-service-manager';
import { DeploymentManager, DeploymentStep, DeploymentOp, DeploymentStateManager, runIterativeRollback } from './iterative-deployment';
import { isAmplifyAdminApp } from './utils/admin-helpers';
import { fileLogger } from './utils/aws-logger';
import { APIGW_AUTH_STACK_LOGICAL_ID, loadApiCliInputs } from './utils/consolidate-apigw-policies';
import { createEnvLevelConstructs } from './utils/env-level-constructs';
import { NETWORK_STACK_LOGICAL_ID } from './network/stack';
import { preProcessCFNTemplate, writeCustomPoliciesToCFNTemplate } from './pre-push-cfn-processor/cfn-pre-processor';
import { AUTH_TRIGGER_STACK, AUTH_TRIGGER_TEMPLATE } from './utils/upload-auth-trigger-template';
import { ensureValidFunctionModelDependencies } from './utils/remove-dependent-function';
import { legacyLayerMigration, postPushLambdaLayerCleanup, prePushLambdaLayerPrompt } from './lambdaLayerInvocations';
import {
  postDeploymentCleanup,
  prependDeploymentStepsToDisconnectFunctionsFromReplacedModelTables,
} from './disconnect-dependent-resources';
import { storeRootStackTemplate } from './initializer';
import { transformRootStack } from './override-manager';
import { prePushTemplateDescriptionHandler } from './template-description-utils';
import { buildOverridesEnabledResources } from './build-override-enabled-resources';
import { deleteEnvironmentParametersForResources } from './utils/ssm-utils/delete-ssm-parameters';
import { invokePostPushAnalyticsUpdate } from './plugin-client-api-analytics';
import { printCdkMigrationWarning } from './print-cdk-migration-warning';
import { minifyJSONFile } from './utils/minify-json';
import { handleCloudFormationError } from './cloud-formation-error-handler';
import { handleCommonSdkError } from './handle-common-sdk-errors';

const logger = fileLogger('push-resources');

// keep in sync with ServiceName in amplify-category-api, but probably it will not change
const ApiServiceNameElasticContainer = 'ElasticContainer';

const optionalBuildDirectoryName = 'build';
const cfnTemplateGlobPattern = '*template*.+(yaml|yml|json)';
const nestedStackTemplateGlobPattern = 'stacks/*.+(yaml|yml|json)';
const parametersJson = 'parameters.json';
export const defaultRootStackFileName = 'rootStackTemplate.json';
export const rootStackFileName = 'root-cloudformation-stack.json';

const deploymentInProgressErrorMessage = () => {
  printer.error('A deployment is in progress.');
  printer.error('If the prior rollback was aborted, run:');
  printer.error('"amplify push --iterative-rollback" to rollback the prior deployment');
  printer.error('"amplify push --force" to re-deploy');
};

/**
 * Prepares and pushes resources to the cloud.
 */
export const run = async (context: $TSContext, resourceDefinition: $TSObject, rebuild = false) => {
  const deploymentStateManager = await DeploymentStateManager.createDeploymentStateManager(context);
  let iterativeDeploymentWasInvoked = false;
  let layerResources = [];

  try {
    const {
      resourcesToBeCreated,
      resourcesToBeUpdated,
      resourcesToBeSynced,
      resourcesToBeDeleted,
      tagsUpdated,
      allResources,
      rootStackUpdated,
    } = resourceDefinition;
    const cloudformationMeta = context.amplify.getProjectMeta().providers.awscloudformation;
    const {
      parameters: { options },
    } = context;
    let resources = !!context?.exeInfo?.forcePush || rebuild ? allResources : resourcesToBeCreated.concat(resourcesToBeUpdated);

    layerResources = resources.filter((r: { service: string }) => r.service === AmplifySupportedService.LAMBDA_LAYER);
    const eventMap = createEventMap(context, resources);

    if (deploymentStateManager.isDeploymentInProgress() && !deploymentStateManager.isDeploymentFinished()) {
      if (context.exeInfo?.forcePush || context.exeInfo?.iterativeRollback) {
        await runIterativeRollback(context, cloudformationMeta, deploymentStateManager, eventMap);
        if (context.exeInfo?.iterativeRollback) {
          return;
        }
      }
    }

    await createEnvLevelConstructs(context);

    // removing dependent functions if @model{Table} is deleted
    const apiResourceToBeUpdated = resourcesToBeUpdated.filter((resource: { service: string }) => resource.service === 'AppSync');
    if (apiResourceToBeUpdated.length) {
      const functionResourceToBeUpdated = await ensureValidFunctionModelDependencies(
        context,
        apiResourceToBeUpdated,
        allResources as $TSObject[],
      );
      // filter updated function to replace with existing updated ones(in case of duplicates)
      if (functionResourceToBeUpdated !== undefined && functionResourceToBeUpdated.length > 0) {
        resources = _.uniqBy(resources.concat(functionResourceToBeUpdated), 'resourceName');
      }
    }

    for (const resource of resources) {
      if (resource.service === ApiServiceNameElasticContainer && resource.category === 'api') {
        const {
          exposedContainer,
          pipelineInfo: { consoleUrl },
        }: $TSObject = await context.amplify.invokePluginMethod(context, 'api', undefined, 'generateContainersArtifacts', [
          context,
          resource,
        ]);
        await context.amplify.updateamplifyMetaAfterResourceUpdate('api', resource.resourceName, 'exposedContainer', exposedContainer);

        printer.blankLine();
        printer.info(`In a few moments, you can check image build status for ${resource.resourceName} at the following URL:`);

        printer.info(`${consoleUrl}`);
        printer.blankLine();

        printer.info(
          'It may take a few moments for this to appear. If you have trouble with first time deployments, please try refreshing this page after a few moments and watch the CodeBuild Details for debugging information.',
        );

        if (resourcesToBeUpdated.find((res: { resourceName: string }) => res.resourceName === resource.resourceName)) {
          resource.lastPackageTimeStamp = undefined;
          await context.amplify.updateamplifyMetaAfterResourceUpdate('api', resource.resourceName, 'lastPackageTimeStamp', undefined);
        }
      }

      if (resource.service === ApiServiceNameElasticContainer && resource.category === 'hosting') {
        await context.amplify.invokePluginMethod(context, 'hosting', 'ElasticContainer', 'generateHostingResources', [context, resource]);
      }
    }

    for (const resource of layerResources) {
      await legacyLayerMigration(context, resource.resourceName);
    }

    /**
     * calling transform schema here to support old project with out overrides
     */
    const appSyncAPIPresent = resources.filter((resource: { service: string }) => resource.service === 'AppSync');
    if (appSyncAPIPresent.length > 0) {
      await ApiCategoryFacade.transformGraphQLSchema(context, {
        handleMigration: (opts) => updateStackForAPIMigration(context, 'api', undefined, opts),
        minify: options.minify || context.input.options?.minify,
        promptApiKeyCreation: true,
      });
    }

    await prePushLambdaLayerPrompt(context, resources);
    await context.amplify.invokePluginMethod(
      context,
      AmplifyCategories.FUNCTION,
      AmplifySupportedService.LAMBDA,
      'ensureLambdaExecutionRoleOutputs',
      [],
    );
    await prepareBuildableResources(context, resources);
    await buildOverridesEnabledResources(context, resources);

    // print cdk migration warning
    await printCdkMigrationWarning(context);

    // Removed api transformation to generate resources before starting deploy/

    // If there is a deployment already in progress we have to fail the push operation as another
    // push in between could lead non-recoverable stacks and files.
    if (deploymentStateManager.isDeploymentInProgress()) {
      deploymentInProgressErrorMessage();
      return;
    }

    let deploymentSteps: DeploymentStep[] = [];

    // location where the intermediate deployment steps are stored
    const stateFolder: { local?: string; cloud?: string } = {};

    // Check if iterative updates are enabled or not and generate the required deployment steps if needed.
    if (FeatureFlags.getBoolean('graphQLTransformer.enableIterativeGSIUpdates')) {
      const getGqlUpdatedResource = (resourcesToCheck: any[]) =>
        resourcesToCheck.find(
          (resourceToCheck) =>
            resourceToCheck?.service === 'AppSync' &&
            resourceToCheck?.providerMetadata?.logicalId &&
            resourceToCheck?.providerPlugin === 'awscloudformation',
        ) || null;
      const gqlResource = getGqlUpdatedResource(rebuild ? resources : resourcesToBeUpdated);

      if (gqlResource) {
        const gqlManager = await GraphQLResourceManager.createInstance(context, gqlResource, cloudformationMeta.StackId, rebuild);
        deploymentSteps = await gqlManager.run();

        // If any models are being replaced, we prepend steps to the iterative deployment to remove references to the replaced table in functions that have a dependency on the tables
        const modelsBeingReplaced = gqlManager.getTablesBeingReplaced().map((meta) => meta.stackName); // stackName is the same as the model name
        deploymentSteps = await prependDeploymentStepsToDisconnectFunctionsFromReplacedModelTables(
          context,
          modelsBeingReplaced,
          deploymentSteps,
        );
        if (deploymentSteps.length > 0) {
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
            deploymentInProgressErrorMessage();
            return;
          }
        }
        stateFolder.local = gqlManager.getStateFilesDirectory();
        stateFolder.cloud = await gqlManager.getCloudStateFilesDirectory();
      }
    }

    await uploadAppSyncFiles(context, resources, allResources);
    await prePushAuthTransform(context, resources);
    await prePushGraphQLCodegen(context, resourcesToBeCreated, resourcesToBeUpdated);
    const projectDetails = context.amplify.getProjectDetails();
    await prePushTemplateDescriptionHandler(context, resourcesToBeCreated);
    await updateS3Templates(context, resources, projectDetails.amplifyMeta);

    // We do not need CloudFormation update if only syncable resources are the changes.
    if (
      resourcesToBeCreated.length > 0 ||
      resourcesToBeUpdated.length > 0 ||
      resourcesToBeDeleted.length > 0 ||
      tagsUpdated ||
      rootStackUpdated ||
      context.exeInfo.forcePush ||
      rebuild
    ) {
      context.usageData.stopCodePathTimer(ManuallyTimedCodePath.PUSH_TRANSFORM);
      context.usageData.startCodePathTimer(ManuallyTimedCodePath.PUSH_DEPLOYMENT);
      // if there are deploymentSteps, need to do an iterative update
      if (deploymentSteps.length > 0) {
        // create deployment manager
        const deploymentManager = await DeploymentManager.createInstance(context, cloudformationMeta.DeploymentBucketName, eventMap, {
          userAgent: formUserAgentParam(context, generateUserAgentAction(resourcesToBeCreated, resourcesToBeUpdated)),
        });

        deploymentSteps.forEach((step) => deploymentManager.addStep(step));

        // generate nested stack
        const backEndDir = pathManager.getBackendDirPath();
        const rootStackFilepath = path.normalize(path.join(backEndDir, providerName, rootStackFileName));
        await generateAndUploadRootStack(context, rootStackFilepath, rootStackFileName);

        // Use state manager to do the final deployment. The final deployment include not just API change but the whole Amplify Project
        const finalStep: DeploymentOp = {
          stackTemplatePathOrUrl: rootStackFileName,
          tableNames: [],
          stackName: cloudformationMeta.StackName,
          parameters: {
            DeploymentBucketName: cloudformationMeta.DeploymentBucketName,
            AuthRoleName: cloudformationMeta.AuthRoleName,
            UnauthRoleName: cloudformationMeta.UnauthRoleName,
          },
          capabilities: ['CAPABILITY_NAMED_IAM', 'CAPABILITY_AUTO_EXPAND'],
        };

        deploymentManager.addStep({
          deployment: finalStep,
          rollback: deploymentSteps[deploymentSteps.length - 1].deployment,
        });
        await deploymentManager.deploy(deploymentStateManager);

        // delete the intermediate states as it is ephemeral
        if (stateFolder.local) {
          try {
            fs.removeSync(stateFolder.local);
          } catch (err) {
            printer.error(`Could not delete state directory locally: ${err}`);
          }
        }
        const s3 = await S3.getInstance(context);
        if (stateFolder.cloud) {
          try {
            await s3.deleteDirectory(cloudformationMeta.DeploymentBucketName, stateFolder.cloud);
          } catch (error) {
            throw handleCommonSdkError(error);
          }
        }
        await postDeploymentCleanup(s3, cloudformationMeta.DeploymentBucketName);
      } else {
        // Non iterative update
        const nestedStack = await formNestedStack(context, context.amplify.getProjectDetails());

        try {
          await updateCloudFormationNestedStack(context, nestedStack, resourcesToBeCreated, resourcesToBeUpdated, eventMap);
          await storeRootStackTemplate(context, nestedStack);
          // if the only root stack updates, function is called with empty resources . this fn copies amplifyMeta and backend Config to #current-cloud-backend
          await context.amplify.updateamplifyMetaAfterPush([]);
        } catch (err) {
          handleCloudFormationError(err);
        }
      }
      context.usageData.stopCodePathTimer(ManuallyTimedCodePath.PUSH_DEPLOYMENT);
      // Cleanup the deployment-state file
      await deploymentStateManager.deleteDeploymentStateFile();
    }

    await postPushGraphQLCodegen(context);
    await context.amplify.invokePluginMethod(
      context,
      AmplifyCategories.AUTH,
      AmplifySupportedService.COGNITO,
      'updateAppClientWithGeneratedSecret',
      [context],
    );
    await postPushCheck(context);

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
        // Sync backend-config.json to cloud folder
        await context.amplify.updateamplifyMetaAfterPush(unlinkedResources);

        for (let i = 0; i < unlinkedResources.length; i += 1) {
          context.amplify.updateamplifyMetaAfterResourceDelete(unlinkedResources[i].category, unlinkedResources[i].resourceName);
        }
      }
    }

    for (let i = 0; i < resourcesToBeDeleted.length; i += 1) {
      context.amplify.updateamplifyMetaAfterResourceDelete(resourcesToBeDeleted[i].category, resourcesToBeDeleted[i].resourceName);
    }

    await uploadAuthTriggerFiles(context, resourcesToBeCreated, resourcesToBeUpdated);

    let updatedAllResources = (await context.amplify.getResourceStatus()).allResources;

    const newAPIresources = [];

    updatedAllResources = updatedAllResources.filter((resource: { service: string }) => resource.service === AmplifySupportedService.APIGW);

    for (let i = 0; i < updatedAllResources.length; i += 1) {
      if (resources.findIndex((resource: { resourceName: any }) => resource.resourceName === updatedAllResources[i].resourceName) > -1) {
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

    // remove ephemeral Lambda layer state
    if (
      resources.concat(resourcesToBeDeleted).filter((r: { service: string }) => r.service === AmplifySupportedService.LAMBDA_LAYER).length >
      0
    ) {
      await postPushLambdaLayerCleanup(context, resources, projectDetails.localEnvInfo.envName);
      await context.amplify.updateamplifyMetaAfterPush(resources);
    }

    // Generate frontend resources for any notifications channels enabled on analytics resources.
    const analyticsResources = resourcesToBeCreated.filter(
      (resource: { category: string }) => resource.category === AmplifyCategories.ANALYTICS,
    );
    if (analyticsResources && analyticsResources.length > 0) {
      context = await invokePostPushAnalyticsUpdate(context);
      await context.amplify.updateamplifyMetaAfterPush(analyticsResources);
    }

    // Store current cloud backend in S3 deployment bucket
    await storeCurrentCloudBackend(context);
    await storeArtifactsForAmplifyService(context);

    // check for auth resources and remove deployment secret for push
    resources
      .filter(
        (resource: { category: string; service: string; providerPlugin: string }) =>
          resource.category === 'auth' && resource.service === 'Cognito' && resource.providerPlugin === 'awscloudformation',
      )
      .map(({ category, resourceName }) => context.amplify.removeDeploymentSecrets(context, category, resourceName));

    await adminModelgen(context, resources);
    await deleteEnvironmentParametersForResources(context, stateManager.getLocalEnvInfo().envName, [
      ...resourcesToBeDeleted,
      ...resourcesToBeSynced.filter((r) => r.sync === 'unlink'),
    ]);
    await displayHelpfulURLs(context, resources);
  } catch (error) {
    if (iterativeDeploymentWasInvoked) {
      await deploymentStateManager.failDeployment();
    }
    rollbackLambdaLayers(layerResources);
    throw new AmplifyFault(
      'DeploymentFault',
      {
        message: error.message,
        code: error.name,
        details: error.details,
      },
      error,
    );
  }
};

/**
 * update the cloudformation stack for the API migration
 */
export const updateStackForAPIMigration = async (context: $TSContext, category: string, resourceName: string, options: $TSAny) => {
  const { resourcesToBeCreated, resourcesToBeUpdated, resourcesToBeDeleted, allResources } = await context.amplify.getResourceStatus(
    category,
    resourceName,
    providerName,
  );

  const { isReverting, isCLIMigration } = options;

  let projectDetails = context.amplify.getProjectDetails();

  const resources = allResources.filter((resource: { service: string }) => resource.service === 'AppSync');

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

    const eventMap = createEventMap(context, [...resourcesToBeCreated, ...resourcesToBeUpdated]);
    await updateCloudFormationNestedStack(context, nestedStack, resourcesToBeCreated, resourcesToBeUpdated, eventMap);
  }

  await context.amplify.updateamplifyMetaAfterPush(resources);
};

const prepareBuildableResources = async (context: $TSContext, resources: $TSAny[]): Promise<void> => {
  // Only build and package resources which are required
  const resourcesToBuild = resources.filter((resource) => resource.build);
  for (const resource of resourcesToBuild) {
    await prepareResource(context, resource);
  }
};

const prepareResource = async (context: $TSContext, resource: $TSAny) => {
  resource.lastBuildTimeStamp = await context.amplify.invokePluginMethod(context, AmplifyCategories.FUNCTION, undefined, 'buildResource', [
    context,
    resource,
  ]);

  const result: { newPackageCreated: boolean; zipFilename: string; zipFilePath: string } = await context.amplify.invokePluginMethod(
    context,
    AmplifyCategories.FUNCTION,
    undefined,
    'packageResource',
    [context, resource],
  );

  if (result.newPackageCreated === false) {
    return;
  }

  const { envName }: { envName: string } = context.amplify.getEnvInfo();
  // Upload zip file to S3
  const s3Key = `amplify-builds/${result.zipFilename}`;

  const s3 = await S3.getInstance(context);

  const s3Params = {
    Body: fs.createReadStream(result.zipFilePath),
    Key: s3Key,
  };
  logger('packageResources.s3.uploadFile', [{ Key: s3Key }])();

  let s3Bucket;
  try {
    s3Bucket = await s3.uploadFile(s3Params);
  } catch (error) {
    throw handleCommonSdkError(error);
  }

  // Update cfn template
  const { category, resourceName }: { category: string; resourceName: string } = resource;
  const backendDir = pathManager.getBackendDirPath();
  const resourceDir = path.normalize(path.join(backendDir, category, resourceName));

  const cfnFiles = globSync(cfnTemplateGlobPattern, {
    cwd: resourceDir,
    ignore: [parametersJson],
  });

  if (cfnFiles.length !== 1) {
    throw new AmplifyError('CloudFormationTemplateError', {
      message:
        cfnFiles.length > 1
          ? 'Only one CloudFormation template is allowed in the resource directory'
          : 'No CloudFormation template found in the resource directory',
      details: `Resource directory: ${resourceDir}`,
    });
  }

  const cfnFile = cfnFiles[0];
  const cfnFilePath = path.normalize(path.join(resourceDir, cfnFile));
  const paramType = { Type: 'String' };

  if (resource.service === AmplifySupportedService.LAMBDA_LAYER) {
    storeS3BucketInfo(category, s3Bucket, envName, resourceName, s3Key);
  } else if (resource.service === ApiServiceNameElasticContainer) {
    const cfnParams = { ParamZipPath: s3Key };
    stateManager.setResourceParametersJson(undefined, category, resourceName, cfnParams);
  } else {
    const { cfnTemplate } = readCFNTemplate(cfnFilePath);
    cfnTemplate.Parameters.deploymentBucketName = paramType;
    cfnTemplate.Parameters.s3Key = paramType;
    const deploymentBucketNameRef = 'deploymentBucketName';
    const s3KeyRef = 's3Key';

    if (cfnTemplate.Resources.LambdaFunction.Type === 'AWS::Serverless::Function') {
      cfnTemplate.Resources.LambdaFunction.Properties.CodeUri = {
        Bucket: Fn.Ref(deploymentBucketNameRef),
        Key: Fn.Ref(s3KeyRef),
      };
    } else {
      cfnTemplate.Resources.LambdaFunction.Properties.Code = {
        S3Bucket: Fn.Ref(deploymentBucketNameRef),
        S3Key: Fn.Ref(s3KeyRef),
      };
    }
    storeS3BucketInfo(category, s3Bucket, envName, resourceName, s3Key);
    JSONUtilities.writeJson(cfnFilePath, cfnTemplate);
  }
};

const storeS3BucketInfo = (category: string, deploymentBucketName: string, envName: string, resourceName: string, s3Key: string) => {
  const amplifyMeta = stateManager.getMeta();
  getEnvParamManager(envName).getResourceParamManager(category, resourceName).setParams({ deploymentBucketName, s3Key });

  _.setWith(amplifyMeta, [category, resourceName, 's3Bucket'], { deploymentBucketName, s3Key });
  stateManager.setMeta(undefined, amplifyMeta);
};

const updateCloudFormationNestedStack = async (
  context: $TSContext,
  nestedStack: $TSAny,
  resourcesToBeCreated: $TSAny,
  resourcesToBeUpdated: $TSAny,
  eventMap: $TSAny,
) => {
  const rootStackFilePath = path.join(pathManager.getRootStackBuildDirPath(pathManager.findProjectRoot()), rootStackFileName);
  // deploy preprocess nested stack to disk
  await storeRootStackTemplate(context, nestedStack);
  const transformedStackPath = await preProcessCFNTemplate(rootStackFilePath);
  const cfnItem = await new Cloudformation(context, generateUserAgentAction(resourcesToBeCreated, resourcesToBeUpdated), {}, eventMap);

  await cfnItem.updateResourceStack(transformedStackPath);
};

const generateUserAgentAction = (resourcesToBeCreated: $TSAny, resourcesToBeUpdated: $TSAny) => {
  const uniqueCategoriesAdded = getAllUniqueCategories(resourcesToBeCreated);
  const uniqueCategoriesUpdated = getAllUniqueCategories(resourcesToBeUpdated);
  let userAgentAction = '';

  if (uniqueCategoriesAdded.length > 0) {
    uniqueCategoriesAdded.forEach((category) => {
      if (category.length >= 2) {
        category = category.substring(0, 2);
      }

      userAgentAction += `${category}:c `;
    });
  }

  if (uniqueCategoriesUpdated.length > 0) {
    uniqueCategoriesUpdated.forEach((category) => {
      if (category.length >= 2) {
        category = category.substring(0, 2);
      }

      userAgentAction += `${category}:u `;
    });
  }
  return userAgentAction;
};

const getAllUniqueCategories = (resources: $TSObject[]): $TSObject[] => {
  const categories = new Set();

  resources.forEach((resource) => categories.add(resource.category));

  return [...categories];
};

/**
 * switched from IOptions to GlobOptionsWithFileTypesFalse, see: https://github.com/isaacs/node-glob/issues/529
 */
export const getCfnFiles = (
  category: string,
  resourceName: string,
  includeAllNestedStacks = false,
  options?: GlobOptionsWithFileTypesFalse,
) => {
  const backEndDir = pathManager.getBackendDirPath();
  const resourceDir = path.normalize(path.join(backEndDir, category, resourceName));
  const resourceBuildDir = path.join(resourceDir, optionalBuildDirectoryName);

  /**
   * The API category w/ GraphQL builds into a build/ directory.
   * This looks for a build directory and uses it if one exists.
   * Otherwise falls back to the default behavior.
   */
  if (fs.existsSync(resourceBuildDir) && fs.lstatSync(resourceBuildDir).isDirectory()) {
    const cfnFiles = globSync(cfnTemplateGlobPattern, {
      cwd: resourceBuildDir,
      ignore: [parametersJson, AUTH_TRIGGER_TEMPLATE],
      ...options,
    });

    if (includeAllNestedStacks) {
      cfnFiles.push(
        ...globSync(nestedStackTemplateGlobPattern, {
          cwd: resourceBuildDir,
          ignore: [parametersJson, AUTH_TRIGGER_TEMPLATE],
          ...options,
        }),
      );
    }

    if (cfnFiles.length > 0) {
      return {
        resourceDir: resourceBuildDir,
        cfnFiles,
      };
    }
  }

  const cfnFiles = globSync(cfnTemplateGlobPattern, {
    cwd: resourceDir,
    ignore: [parametersJson, AUTH_TRIGGER_TEMPLATE],
    ...options,
  });

  return {
    resourceDir,
    cfnFiles,
  };
};

const updateS3Templates = async (context: $TSContext, resourcesToBeUpdated: $TSAny, amplifyMeta: $TSMeta) => {
  const promises = [];

  for (const { category, resourceName, service } of resourcesToBeUpdated) {
    const { resourceDir, cfnFiles } = getCfnFiles(category, resourceName);
    for (const cfnFile of cfnFiles) {
      await writeCustomPoliciesToCFNTemplate(resourceName, service, cfnFile, category, { minify: context.input.options?.minify });
      const transformedCFNPath = await preProcessCFNTemplate(path.join(resourceDir, cfnFile), { minify: context.input.options?.minify });

      promises.push(uploadTemplateToS3(context, transformedCFNPath, category, resourceName, amplifyMeta));
    }
  }

  // Add CFN templates that are not tied to an individual resource.
  const { APIGatewayAuthURL } = context.amplify.getProjectDetails()?.amplifyMeta?.providers?.[constants.ProviderName] ?? {};

  if (APIGatewayAuthURL) {
    const resourceDir = path.join((context.amplify.pathManager as any).getBackendDirPath(), 'api');
    promises.push(uploadTemplateToS3(context, path.join(resourceDir, `${APIGW_AUTH_STACK_LOGICAL_ID}.json`), 'api', '', null));
  }

  return Promise.all(promises);
};

/**
 *
 */
export const uploadTemplateToS3 = async (
  context: $TSContext,
  filePath: string,
  category: string,
  resourceName: string,
  amplifyMeta: $TSMeta,
): Promise<void> => {
  const cfnFile = path.parse(filePath).base;
  if (context.input.options?.minify) {
    minifyJSONFile(filePath);
  }
  const s3 = await S3.getInstance(context);

  const s3Params = {
    Body: fs.createReadStream(filePath),
    Key: `amplify-cfn-templates/${category}/${cfnFile}`,
  };

  logger('uploadTemplateToS3.s3.uploadFile', [{ Key: s3Params.Key }])();
  let projectBucket;
  try {
    projectBucket = await s3.uploadFile(s3Params, false);
  } catch (error) {
    throw handleCommonSdkError(error);
  }

  if (amplifyMeta) {
    const templateURL = `https://s3.amazonaws.com/${projectBucket}/amplify-cfn-templates/${category}/${cfnFile}`;
    const providerMetadata = amplifyMeta[category][resourceName].providerMetadata || {};

    providerMetadata.s3TemplateURL = templateURL;
    providerMetadata.logicalId = category + resourceName;

    context.amplify.updateamplifyMetaAfterResourceUpdate(category, resourceName, 'providerMetadata', providerMetadata);
  }
};

const createResourceObject = (
  resource: string,
  category: string,
): {
  category: string;
  key: string;
} => ({
  category: `${category}-${resource}`,
  key: category + resource,
});

const getCategoryResources = (file: string, resourceDir: string) => {
  const cloudFormationJsonPath = path.join(resourceDir, file);
  const { cfnTemplate } = readCFNTemplate(cloudFormationJsonPath);
  const categoryResources = cfnTemplate.Resources ? Object.keys(cfnTemplate.Resources) : [];
  return categoryResources;
};

type EventMap = {
  rootStackName: string;
  envName: string;
  projectName: string;
  rootResources: { key: string; category: string }[];
  eventToCategories: Map<string, string>;
  categories: { name: string; size: number }[];
  logicalResourceNames: string[];
};

/**
 Create an event map which will be used to map each incoming CloudFormation event into a category.
 This is done so as to group events under progress bars for the root project as well as for each category.
 */
const createEventMap = (context: $TSContext, resourcesToBeCreatedOrUpdated: $TSAny): EventMap => {
  let eventMap = {} as EventMap;

  const { envName } = context.amplify.getEnvInfo();
  const { projectName } = context.amplify.getProjectConfig();
  const meta = stateManager.getMeta();
  const rootStackName = meta.providers.awscloudformation.StackName;
  // Setting up initial configurations.
  eventMap.rootStackName = rootStackName;
  eventMap.envName = envName;
  eventMap.projectName = projectName;
  eventMap.rootResources = [];
  eventMap.eventToCategories = new Map();
  eventMap.categories = [];
  eventMap.logicalResourceNames = [];

  // Type script throws an error unless I explicitly convert to string
  const resources = getAllUniqueCategories(resourcesToBeCreatedOrUpdated).map((item) => `${item}`);

  Object.keys(meta).forEach((category) => {
    if (category !== 'providers') {
      Object.keys(meta[category]).forEach((resource) => {
        eventMap.rootResources.push(createResourceObject(resource, category));
        handleCfnFiles(eventMap, category, resource, resources);
      });
    }
  });

  return eventMap;
};

// Retrieve cfn template files and build eventMap that is later used for showing deployment progress and error reporting
const handleCfnFiles = (eventMap: EventMap, category: string, resource: string, updatedResources: string[]) => {
  // Build part of eventMap that is used for showing event progress. Only uses first level nested stacks to keep the console uncluttered.
  const { resourceDir, cfnFiles } = getCfnFiles(category, resource, false);
  cfnFiles.forEach((file) => {
    const categoryResources = getCategoryResources(file, resourceDir);
    // Mapping Resource events to categories.
    categoryResources.forEach((res) => {
      eventMap.eventToCategories.set(res, `${category}-${resource}`);
    });
    if (updatedResources.includes(category)) {
      eventMap.categories.push({ name: `${category}-${resource}`, size: categoryResources.length });
    }
  });

  // Build part of EventMap that is used for error reporting. Get all resources from all nested stacks.
  const { cfnFiles: allCfnFiles } = getCfnFiles(category, resource, true);
  allCfnFiles.forEach((file) => {
    const categoryResources = getCategoryResources(file, resourceDir);
    // Adding all the resources
    categoryResources.forEach((res) => eventMap.logicalResourceNames.push(res));
  });
};

/**
 *
 */
export const formNestedStack = async (
  context: $TSContext,
  projectDetails: $TSObject,
  categoryName?: string,
  resourceName?: string,
  serviceName?: string,
  skipEnv?: boolean,
  useExistingMeta?: boolean,
): Promise<Template> => {
  let rootStack: Template;
  // CFN transform for Root stack
  rootStack = await transformRootStack(context);

  // get the {deploymentBucketName , AuthRoleName , UnAuthRole from overridden data}

  const metaToBeUpdated = {
    DeploymentBucketName: rootStack.Resources.DeploymentBucket.Properties.BucketName,
    AuthRoleName: rootStack.Resources.AuthRole.Properties.RoleName,
    UnauthRoleName: rootStack.Resources.UnauthRole.Properties.RoleName,
  };
  // sanitize this data if needed
  for (const key of Object.keys(metaToBeUpdated)) {
    if (typeof metaToBeUpdated[key] === 'object' && 'Ref' in metaToBeUpdated[key]) {
      delete metaToBeUpdated[key];
    }
  }

  const projectPath = pathManager.findProjectRoot();
  const amplifyMeta = useExistingMeta ? projectDetails.amplifyMeta : stateManager.getMeta(projectPath);
  // update amplify meta with updated root stack Info
  if (Object.keys(metaToBeUpdated).length) {
    context.amplify.updateProviderAmplifyMeta(providerName, metaToBeUpdated);
    // update teamProviderInfo
    const { envName } = context.amplify.getEnvInfo();
    const teamProviderInfo = stateManager.getTeamProviderInfo(projectPath);
    const tpiResourceParams: $TSAny = _.get(teamProviderInfo, [envName, 'awscloudformation'], {});
    _.assign(tpiResourceParams, metaToBeUpdated);
    _.setWith(teamProviderInfo, [envName, 'awscloudformation'], tpiResourceParams);
    stateManager.setTeamProviderInfo(projectPath, teamProviderInfo);
  }

  // Track Amplify Console generated stacks
  try {
    const appId = amplifyMeta.providers[providerName].AmplifyAppId;
    if ((await isAmplifyAdminApp(appId)).isAdminApp) {
      rootStack.Description = 'Root Stack for AWS Amplify Console';
    }
  } catch (err) {
    // if it is not an AmplifyAdmin app, do nothing
  }

  let authResourceName: string;

  const { APIGatewayAuthURL, NetworkStackS3Url, AuthTriggerTemplateURL } = amplifyMeta.providers[constants.ProviderName];
  const { envName } = stateManager.getLocalEnvInfo(projectPath);
  if (APIGatewayAuthURL) {
    const stack = {
      Type: 'AWS::CloudFormation::Stack',
      Properties: {
        TemplateURL: APIGatewayAuthURL,
        Parameters: {
          authRoleName: {
            Ref: 'AuthRoleName',
          },
          unauthRoleName: {
            Ref: 'UnauthRoleName',
          },
          env: envName,
        },
      },
    };

    const apis: $TSObject = amplifyMeta?.api ?? {};
    for (const [apiName, api] of Object.entries(apis)) {
      if (await loadApiCliInputs(context, apiName, api)) {
        stack.Properties.Parameters[apiName] = {
          'Fn::GetAtt': [api.providerMetadata.logicalId, 'Outputs.ApiId'],
        };
      }
    }

    rootStack.Resources[APIGW_AUTH_STACK_LOGICAL_ID] = stack;
  }

  if (AuthTriggerTemplateURL) {
    const stack: $TSAny = {
      Type: 'AWS::CloudFormation::Stack',
      Properties: {
        TemplateURL: AuthTriggerTemplateURL,
        Parameters: {
          env: envName,
        } as Record<string, $TSAny>,
      },
      DependsOn: [],
    };

    const cognitoResource = stateManager.getResourceFromMeta(amplifyMeta, 'auth', 'Cognito');
    const authRootStackResourceName = `auth${cognitoResource.resourceName}`;
    const authTriggerCfnParameters: $TSAny = await context.amplify.invokePluginMethod(
      context,
      AmplifyCategories.AUTH,
      AmplifySupportedService.COGNITO,
      'getAuthTriggerStackCfnParameters',
      [stack, cognitoResource.resourceName],
    );
    stack.Properties.Parameters = { ...stack.Properties.Parameters, ...authTriggerCfnParameters };
    stack.DependsOn.push(authRootStackResourceName);

    const { dependsOn } = cognitoResource.resource as { dependsOn: any };

    dependsOn.forEach((resource: { category: any; resourceName: any; attributes: any }) => {
      const dependsOnStackName = `${resource.category}${resource.resourceName}`;
      if (isAuthTrigger(resource)) {
        const lambdaRoleKey = `function${resource.resourceName}LambdaExecutionRole`;
        const lambdaRoleValue = { 'Fn::GetAtt': [dependsOnStackName, `Outputs.LambdaExecutionRoleArn`] };
        stack.Properties.Parameters[lambdaRoleKey] = lambdaRoleValue;
      }
      stack.DependsOn.push(dependsOnStackName);

      const dependsOnAttributes = resource?.attributes;

      dependsOnAttributes.forEach((attribute: any) => {
        const parameterKey = `${resource.category}${resource.resourceName}${attribute}`;
        const parameterValue = { 'Fn::GetAtt': [dependsOnStackName, `Outputs.${attribute}`] };

        stack.Properties.Parameters[parameterKey] = parameterValue;
      });
    });

    rootStack.Resources[AUTH_TRIGGER_STACK] = stack;
  }

  if (NetworkStackS3Url) {
    rootStack.Resources[NETWORK_STACK_LOGICAL_ID] = {
      Type: 'AWS::CloudFormation::Stack',
      Properties: {
        TemplateURL: NetworkStackS3Url,
      },
    };

    rootStack.Resources.DeploymentBucket.Properties.VersioningConfiguration = {
      Status: 'Enabled',
    };

    rootStack.Resources.DeploymentBucket.Properties.LifecycleConfiguration = {
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

  categories = categories.filter((category) => category !== 'providers');
  categories.forEach((category) => {
    const resources = Object.keys(amplifyMeta[category]);
    resources.forEach((resource) => {
      const resourceDetails = amplifyMeta[category][resource];

      if (category === 'auth' && resource !== 'userPoolGroups') {
        authResourceName = resource;
      }

      const resourceKey = category + resource;
      let templateURL: any;

      if (resourceDetails.providerPlugin) {
        const parameters = <$TSObject>loadResourceParameters(context, category, resource);
        const { dependsOn } = resourceDetails;
        if (dependsOn) {
          for (let i = 0; i < dependsOn.length; i += 1) {
            for (const attribute of dependsOn[i]?.attributes || []) {
              // If the depends on resource is an imported resource we cannot form GetAtt type reference
              // since there is no such thing. We have to read the output.{AttributeName} from the meta
              // and inject the value itself into the parameters block
              let parameterValue: { 'Fn::GetAtt': any[] };

              const dependentResource = _.get(amplifyMeta, [dependsOn[i].category, dependsOn[i].resourceName], undefined);

              if (!dependentResource && dependsOn[i].category) {
                throw new AmplifyError('PushResourcesError', {
                  message: `Cannot get resource: ${dependsOn[i].resourceName} from '${dependsOn[i].category}' category.`,
                });
              }

              if (dependentResource && dependentResource.serviceType === 'imported') {
                const outputAttributeValue = _.get(dependentResource, ['output', attribute], undefined);

                if (!outputAttributeValue) {
                  throw new AmplifyError('PushResourcesError', {
                    message: `Cannot read the '${attribute}' dependent attribute value from the output section of resource: '${dependsOn[i].resourceName}'.`,
                  });
                }

                parameterValue = outputAttributeValue;
              } else {
                // Fn::GetAtt adds dependency in root stack and dependsOn stack
                const dependsOnStackName = dependsOn[i].category + dependsOn[i].resourceName;
                parameterValue = { 'Fn::GetAtt': [dependsOnStackName, `Outputs.${attribute}`] };
              }

              const parameterKey = `${dependsOn[i].category}${dependsOn[i].resourceName}${attribute}`;
              // if resource is GQL API and dependency is auth, don't add CFN param here
              // this is because GQL APIs handle the auth dependency by referencing the UserPoolId directly in the API's parameters.json file
              const isResourceGqlWithAuthDep = resourceDetails?.service === 'AppSync' && dependsOn[i]?.category === 'auth';
              if (isAuthTrigger(dependsOn[i]) || isResourceGqlWithAuthDep) {
                continue;
              }
              parameters[parameterKey] = parameterValue;
            }

            if (dependsOn[i].exports) {
              Object.keys(dependsOn[i].exports)
                .map((key) => ({ key, value: dependsOn[i].exports[key] }))
                .forEach(({ key, value }) => {
                  parameters[key] = { 'Fn::ImportValue': value };
                });
            }
          }
        }

        for (const [key, value] of Object.entries(parameters)) {
          if (Array.isArray(value)) {
            parameters[key] = value.join();
          }
        }

        if (
          (category === AmplifyCategories.API || category === AmplifyCategories.HOSTING) &&
          resourceDetails.service === ApiServiceNameElasticContainer
        ) {
          parameters.deploymentBucketName = Fn.Ref('DeploymentBucketName');
          parameters.rootStackName = Fn.Ref('AWS::StackName');
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
        const { imported, userPoolId, authRoleArn, authRoleName, unauthRoleArn, unauthRoleName } =
          context.amplify.getImportedAuthProperties(context);

        /** mimic some side effects from {@link uploadAppSyncFiles} writeUpdatedParametersJson */
        if (category === AmplifyCategories.API) {
          // If authRoleName parameter not present, add it
          if (!parameters.authRoleName) {
            parameters.authRoleName = {
              Ref: 'AuthRoleName',
            };
          }

          // If unauthRoleName parameter not present, add it
          if (!parameters.unauthRoleName) {
            parameters.unauthRoleName = {
              Ref: 'UnauthRoleName',
            };
          }
        }

        if (category !== AmplifyCategories.AUTH && resourceDetails.service !== 'Cognito' && imported) {
          if (parameters.AuthCognitoUserPoolId) {
            parameters.AuthCognitoUserPoolId = userPoolId;
          }

          if (parameters.authRoleArn) {
            parameters.authRoleArn = authRoleArn;
          }

          if (parameters.authRoleName) {
            parameters.authRoleName = authRoleName || { Ref: 'AuthRoleName' }; // if only a user pool is imported, we ref the root stack AuthRoleName because the child stacks still need this parameter
          }

          if (parameters.unauthRoleArn) {
            parameters.unauthRoleArn = unauthRoleArn;
          }

          if (parameters.unauthRoleName) {
            parameters.unauthRoleName = unauthRoleName || { Ref: 'UnauthRoleName' }; // if only a user pool is imported, we ref the root stack UnauthRoleName because the child stacks still need this parameter
          }
        }
        if (resourceDetails.providerMetadata) {
          templateURL = resourceDetails.providerMetadata.s3TemplateURL;

          rootStack.Resources[resourceKey] = {
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
    const importedAuth = _.get(amplifyMeta, [AmplifyCategories.AUTH, authResourceName], undefined);

    // If auth is imported we cannot update the IDP as it is not part of the stack resources we deploy.
    if (importedAuth && importedAuth.serviceType !== 'imported') {
      const authParameters = loadResourceParameters(context, AmplifyCategories.AUTH, authResourceName);

      if (authParameters.identityPoolName) {
        updateIdPRolesInNestedStack(rootStack, authResourceName);
      }
    }
  }

  return rootStack;
};

const updateIdPRolesInNestedStack = (nestedStack: $TSAny, authResourceName: $TSAny) => {
  const authLogicalResourceName = `auth${authResourceName}`;
  const idpUpdateRoleCfnFilePath = path.join(__dirname, '..', 'resources', 'update-idp-roles-cfn.json');
  const idpUpdateRoleCfn = JSONUtilities.readJson<$TSObject>(idpUpdateRoleCfnFilePath);

  idpUpdateRoleCfn.UpdateRolesWithIDPFunction.DependsOn.push(authLogicalResourceName);
  idpUpdateRoleCfn.UpdateRolesWithIDPFunctionOutputs.Properties.idpId['Fn::GetAtt'].unshift(authLogicalResourceName);

  Object.assign(nestedStack.Resources, idpUpdateRoleCfn);
};

const isAuthTrigger = (dependsOnResource: $TSObject) =>
  FeatureFlags.getBoolean('auth.breakCircularDependency') &&
  dependsOnResource.category === 'function' &&
  dependsOnResource.triggerProvider === 'Cognito';

/**
 *
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const generateAndUploadRootStack = async (context: $TSContext, destinationPath: string, destinationS3Key: string) => {
  const projectDetails = context.amplify.getProjectDetails();
  const nestedStack = await formNestedStack(context, projectDetails);

  await storeRootStackTemplate(context, nestedStack);

  // upload the nested stack
  const s3Client = await S3.getInstance(context);
  const s3Params = {
    Body: Buffer.from(JSONUtilities.stringify(nestedStack, { minify: context.input.options?.minify })),
    Key: destinationS3Key,
  };

  try {
    await s3Client.uploadFile(s3Params, false);
  } catch (error) {
    throw handleCommonSdkError(error);
  }
};

const rollbackLambdaLayers = (layerResources: $TSAny[]) => {
  if (layerResources.length > 0) {
    const projectRoot = pathManager.findProjectRoot();
    const currentMeta = stateManager.getCurrentMeta(projectRoot);
    const meta = stateManager.getMeta(projectRoot);

    layerResources.forEach((r) => {
      const layerMetaPath = [AmplifyCategories.FUNCTION, r.resourceName, 'latestPushedVersionHash'];
      const previousHash = _.get<string | undefined>(currentMeta, layerMetaPath, undefined);
      _.setWith(meta, layerMetaPath, previousHash);
    });

    stateManager.setMeta(projectRoot, meta);
  }
};
