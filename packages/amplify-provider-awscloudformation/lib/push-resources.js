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
exports.generateAndUploadRootStack = exports.formNestedStack = exports.uploadTemplateToS3 = exports.getCfnFiles = exports.updateStackForAPIMigration = exports.run = exports.rootStackFileName = exports.defaultRootStackFileName = void 0;
const lodash_1 = __importDefault(require("lodash"));
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const glob_1 = __importDefault(require("glob"));
const amplify_cli_core_1 = require("amplify-cli-core");
const cloudform_types_1 = require("cloudform-types");
const amplify_environment_parameters_1 = require("@aws-amplify/amplify-environment-parameters");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const aws_s3_1 = require("./aws-utils/aws-s3");
const aws_cfn_1 = __importDefault(require("./aws-utils/aws-cfn"));
const user_agent_1 = require("./aws-utils/user-agent");
const constants_1 = __importStar(require("./constants"));
const upload_appsync_files_1 = require("./upload-appsync-files");
const graphql_codegen_1 = require("./graphql-codegen");
const admin_modelgen_1 = require("./admin-modelgen");
const auth_transform_1 = require("./auth-transform");
const display_helpful_urls_1 = require("./display-helpful-urls");
const download_api_models_1 = require("./download-api-models");
const graphql_resource_manager_1 = require("./graphql-resource-manager");
const resourceParams_1 = require("./resourceParams");
const upload_auth_trigger_files_1 = require("./upload-auth-trigger-files");
const upload_current_cloud_backend_1 = require("./utils/upload-current-cloud-backend");
const amplify_service_manager_1 = require("./amplify-service-manager");
const iterative_deployment_1 = require("./iterative-deployment");
const admin_helpers_1 = require("./utils/admin-helpers");
const aws_logger_1 = require("./utils/aws-logger");
const consolidate_apigw_policies_1 = require("./utils/consolidate-apigw-policies");
const env_level_constructs_1 = require("./utils/env-level-constructs");
const stack_1 = require("./network/stack");
const cfn_pre_processor_1 = require("./pre-push-cfn-processor/cfn-pre-processor");
const upload_auth_trigger_template_1 = require("./utils/upload-auth-trigger-template");
const remove_dependent_function_1 = require("./utils/remove-dependent-function");
const lambdaLayerInvocations_1 = require("./lambdaLayerInvocations");
const disconnect_dependent_resources_1 = require("./disconnect-dependent-resources");
const initializer_1 = require("./initializer");
const override_manager_1 = require("./override-manager");
const template_description_utils_1 = require("./template-description-utils");
const build_override_enabled_resources_1 = require("./build-override-enabled-resources");
const plugin_client_api_analytics_1 = require("./plugin-client-api-analytics");
const print_cdk_migration_warning_1 = require("./print-cdk-migration-warning");
const minify_json_1 = require("./utils/minify-json");
const cloud_formation_error_handler_1 = require("./cloud-formation-error-handler");
const logger = (0, aws_logger_1.fileLogger)('push-resources');
const ApiServiceNameElasticContainer = 'ElasticContainer';
const optionalBuildDirectoryName = 'build';
const cfnTemplateGlobPattern = '*template*.+(yaml|yml|json)';
const nestedStackTemplateGlobPattern = 'stacks/*.+(yaml|yml|json)';
const parametersJson = 'parameters.json';
exports.defaultRootStackFileName = 'rootStackTemplate.json';
exports.rootStackFileName = 'root-cloudformation-stack.json';
const deploymentInProgressErrorMessage = () => {
    amplify_prompts_1.printer.error('A deployment is in progress.');
    amplify_prompts_1.printer.error('If the prior rollback was aborted, run:');
    amplify_prompts_1.printer.error('"amplify push --iterative-rollback" to rollback the prior deployment');
    amplify_prompts_1.printer.error('"amplify push --force" to re-deploy');
};
const run = async (context, resourceDefinition, rebuild = false) => {
    var _a, _b, _c, _d, _e;
    const deploymentStateManager = await iterative_deployment_1.DeploymentStateManager.createDeploymentStateManager(context);
    let iterativeDeploymentWasInvoked = false;
    let layerResources = [];
    try {
        const { resourcesToBeCreated, resourcesToBeUpdated, resourcesToBeSynced, resourcesToBeDeleted, tagsUpdated, allResources, rootStackUpdated, } = resourceDefinition;
        const cloudformationMeta = context.amplify.getProjectMeta().providers.awscloudformation;
        const { parameters: { options }, } = context;
        let resources = !!((_a = context === null || context === void 0 ? void 0 : context.exeInfo) === null || _a === void 0 ? void 0 : _a.forcePush) || rebuild ? allResources : resourcesToBeCreated.concat(resourcesToBeUpdated);
        layerResources = resources.filter((r) => r.service === amplify_cli_core_1.AmplifySupportedService.LAMBDA_LAYER);
        const eventMap = createEventMap(context, resources);
        if (deploymentStateManager.isDeploymentInProgress() && !deploymentStateManager.isDeploymentFinished()) {
            if (((_b = context.exeInfo) === null || _b === void 0 ? void 0 : _b.forcePush) || ((_c = context.exeInfo) === null || _c === void 0 ? void 0 : _c.iterativeRollback)) {
                await (0, iterative_deployment_1.runIterativeRollback)(context, cloudformationMeta, deploymentStateManager, eventMap);
                if ((_d = context.exeInfo) === null || _d === void 0 ? void 0 : _d.iterativeRollback) {
                    return;
                }
            }
        }
        await (0, env_level_constructs_1.createEnvLevelConstructs)(context);
        const apiResourceToBeUpdated = resourcesToBeUpdated.filter((resource) => resource.service === 'AppSync');
        if (apiResourceToBeUpdated.length) {
            const functionResourceToBeUpdated = await (0, remove_dependent_function_1.ensureValidFunctionModelDependencies)(context, apiResourceToBeUpdated, allResources);
            if (functionResourceToBeUpdated !== undefined && functionResourceToBeUpdated.length > 0) {
                resources = lodash_1.default.uniqBy(resources.concat(functionResourceToBeUpdated), 'resourceName');
            }
        }
        for (const resource of resources) {
            if (resource.service === ApiServiceNameElasticContainer && resource.category === 'api') {
                const { exposedContainer, pipelineInfo: { consoleUrl }, } = await context.amplify.invokePluginMethod(context, 'api', undefined, 'generateContainersArtifacts', [
                    context,
                    resource,
                ]);
                await context.amplify.updateamplifyMetaAfterResourceUpdate('api', resource.resourceName, 'exposedContainer', exposedContainer);
                amplify_prompts_1.printer.blankLine();
                amplify_prompts_1.printer.info(`In a few moments, you can check image build status for ${resource.resourceName} at the following URL:`);
                amplify_prompts_1.printer.info(`${consoleUrl}`);
                amplify_prompts_1.printer.blankLine();
                amplify_prompts_1.printer.info('It may take a few moments for this to appear. If you have trouble with first time deployments, please try refreshing this page after a few moments and watch the CodeBuild Details for debugging information.');
                if (resourcesToBeUpdated.find((res) => res.resourceName === resource.resourceName)) {
                    resource.lastPackageTimeStamp = undefined;
                    await context.amplify.updateamplifyMetaAfterResourceUpdate('api', resource.resourceName, 'lastPackageTimeStamp', undefined);
                }
            }
            if (resource.service === ApiServiceNameElasticContainer && resource.category === 'hosting') {
                await context.amplify.invokePluginMethod(context, 'hosting', 'ElasticContainer', 'generateHostingResources', [context, resource]);
            }
        }
        for (const resource of layerResources) {
            await (0, lambdaLayerInvocations_1.legacyLayerMigration)(context, resource.resourceName);
        }
        await amplify_cli_core_1.ApiCategoryFacade.transformGraphQLSchema(context, {
            handleMigration: (opts) => (0, exports.updateStackForAPIMigration)(context, 'api', undefined, opts),
            minify: options.minify || ((_e = context.input.options) === null || _e === void 0 ? void 0 : _e.minify),
            promptApiKeyCreation: true,
        });
        await (0, lambdaLayerInvocations_1.prePushLambdaLayerPrompt)(context, resources);
        await context.amplify.invokePluginMethod(context, amplify_cli_core_1.AmplifyCategories.FUNCTION, amplify_cli_core_1.AmplifySupportedService.LAMBDA, 'ensureLambdaExecutionRoleOutputs', []);
        await prepareBuildableResources(context, resources);
        await (0, build_override_enabled_resources_1.buildOverridesEnabledResources)(context, resources);
        await (0, print_cdk_migration_warning_1.printCdkMigrationWarning)(context);
        if (deploymentStateManager.isDeploymentInProgress()) {
            deploymentInProgressErrorMessage();
            return;
        }
        let deploymentSteps = [];
        const stateFolder = {};
        if (amplify_cli_core_1.FeatureFlags.getBoolean('graphQLTransformer.enableIterativeGSIUpdates')) {
            const getGqlUpdatedResource = (resourcesToCheck) => resourcesToCheck.find((resourceToCheck) => {
                var _a;
                return (resourceToCheck === null || resourceToCheck === void 0 ? void 0 : resourceToCheck.service) === 'AppSync' &&
                    ((_a = resourceToCheck === null || resourceToCheck === void 0 ? void 0 : resourceToCheck.providerMetadata) === null || _a === void 0 ? void 0 : _a.logicalId) &&
                    (resourceToCheck === null || resourceToCheck === void 0 ? void 0 : resourceToCheck.providerPlugin) === 'awscloudformation';
            }) || null;
            const gqlResource = getGqlUpdatedResource(rebuild ? resources : resourcesToBeUpdated);
            if (gqlResource) {
                const gqlManager = await graphql_resource_manager_1.GraphQLResourceManager.createInstance(context, gqlResource, cloudformationMeta.StackId, rebuild);
                deploymentSteps = await gqlManager.run();
                const modelsBeingReplaced = gqlManager.getTablesBeingReplaced().map((meta) => meta.stackName);
                deploymentSteps = await (0, disconnect_dependent_resources_1.prependDeploymentStepsToDisconnectFunctionsFromReplacedModelTables)(context, modelsBeingReplaced, deploymentSteps);
                if (deploymentSteps.length > 0) {
                    iterativeDeploymentWasInvoked = true;
                    const deploymentStepStates = new Array(deploymentSteps.length + 1).fill(true).map(() => ({
                        status: amplify_cli_core_1.DeploymentStepStatus.WAITING_FOR_DEPLOYMENT,
                    }));
                    if (!(await deploymentStateManager.startDeployment(deploymentStepStates))) {
                        deploymentInProgressErrorMessage();
                        return;
                    }
                }
                stateFolder.local = gqlManager.getStateFilesDirectory();
                stateFolder.cloud = await gqlManager.getCloudStateFilesDirectory();
            }
        }
        await (0, upload_appsync_files_1.uploadAppSyncFiles)(context, resources, allResources);
        await (0, auth_transform_1.prePushAuthTransform)(context, resources);
        await (0, graphql_codegen_1.prePushGraphQLCodegen)(context, resourcesToBeCreated, resourcesToBeUpdated);
        const projectDetails = context.amplify.getProjectDetails();
        await (0, template_description_utils_1.prePushTemplateDescriptionHandler)(context, resourcesToBeCreated);
        await updateS3Templates(context, resources, projectDetails.amplifyMeta);
        if (resourcesToBeCreated.length > 0 ||
            resourcesToBeUpdated.length > 0 ||
            resourcesToBeDeleted.length > 0 ||
            tagsUpdated ||
            rootStackUpdated ||
            context.exeInfo.forcePush ||
            rebuild) {
            context.usageData.stopCodePathTimer(amplify_cli_core_1.ManuallyTimedCodePath.PUSH_TRANSFORM);
            context.usageData.startCodePathTimer(amplify_cli_core_1.ManuallyTimedCodePath.PUSH_DEPLOYMENT);
            if (deploymentSteps.length > 0) {
                const deploymentManager = await iterative_deployment_1.DeploymentManager.createInstance(context, cloudformationMeta.DeploymentBucketName, eventMap, {
                    userAgent: (0, user_agent_1.formUserAgentParam)(context, generateUserAgentAction(resourcesToBeCreated, resourcesToBeUpdated)),
                });
                deploymentSteps.forEach((step) => deploymentManager.addStep(step));
                const backEndDir = amplify_cli_core_1.pathManager.getBackendDirPath();
                const rootStackFilepath = path.normalize(path.join(backEndDir, constants_1.ProviderName, exports.rootStackFileName));
                await (0, exports.generateAndUploadRootStack)(context, rootStackFilepath, exports.rootStackFileName);
                const finalStep = {
                    stackTemplatePathOrUrl: exports.rootStackFileName,
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
                if (stateFolder.local) {
                    try {
                        fs.removeSync(stateFolder.local);
                    }
                    catch (err) {
                        amplify_prompts_1.printer.error(`Could not delete state directory locally: ${err}`);
                    }
                }
                const s3 = await aws_s3_1.S3.getInstance(context);
                if (stateFolder.cloud) {
                    await s3.deleteDirectory(cloudformationMeta.DeploymentBucketName, stateFolder.cloud);
                }
                await (0, disconnect_dependent_resources_1.postDeploymentCleanup)(s3, cloudformationMeta.DeploymentBucketName);
            }
            else {
                const nestedStack = await (0, exports.formNestedStack)(context, context.amplify.getProjectDetails());
                try {
                    await updateCloudFormationNestedStack(context, nestedStack, resourcesToBeCreated, resourcesToBeUpdated, eventMap);
                    await (0, initializer_1.storeRootStackTemplate)(context, nestedStack);
                    await context.amplify.updateamplifyMetaAfterPush([]);
                }
                catch (err) {
                    (0, cloud_formation_error_handler_1.handleCloudFormationError)(err);
                }
            }
            context.usageData.stopCodePathTimer(amplify_cli_core_1.ManuallyTimedCodePath.PUSH_DEPLOYMENT);
            await deploymentStateManager.deleteDeploymentStateFile();
        }
        await (0, graphql_codegen_1.postPushGraphQLCodegen)(context);
        await (0, amplify_service_manager_1.postPushCheck)(context);
        if (resources.concat(resourcesToBeDeleted).length > 0) {
            await context.amplify.updateamplifyMetaAfterPush(resources);
        }
        if (resourcesToBeSynced.length > 0) {
            const importResources = resourcesToBeSynced.filter((r) => r.sync === 'import');
            const unlinkedResources = resourcesToBeSynced.filter((r) => r.sync === 'unlink');
            if (importResources.length > 0) {
                await context.amplify.updateamplifyMetaAfterPush(importResources);
            }
            if (unlinkedResources.length > 0) {
                await context.amplify.updateamplifyMetaAfterPush(unlinkedResources);
                for (let i = 0; i < unlinkedResources.length; i += 1) {
                    context.amplify.updateamplifyMetaAfterResourceDelete(unlinkedResources[i].category, unlinkedResources[i].resourceName);
                }
            }
        }
        for (let i = 0; i < resourcesToBeDeleted.length; i += 1) {
            context.amplify.updateamplifyMetaAfterResourceDelete(resourcesToBeDeleted[i].category, resourcesToBeDeleted[i].resourceName);
        }
        await (0, upload_auth_trigger_files_1.uploadAuthTriggerFiles)(context, resourcesToBeCreated, resourcesToBeUpdated);
        let updatedAllResources = (await context.amplify.getResourceStatus()).allResources;
        const newAPIresources = [];
        updatedAllResources = updatedAllResources.filter((resource) => resource.service === amplify_cli_core_1.AmplifySupportedService.APIGW);
        for (let i = 0; i < updatedAllResources.length; i += 1) {
            if (resources.findIndex((resource) => resource.resourceName === updatedAllResources[i].resourceName) > -1) {
                newAPIresources.push(updatedAllResources[i]);
            }
        }
        if (resourcesToBeSynced.length > 0) {
            const importResources = resourcesToBeSynced.filter((r) => r.sync === 'import');
            if (importResources.length > 0) {
                const { imported, userPoolId } = context.amplify.getImportedAuthProperties(context);
                if (imported) {
                    const appSyncAPIs = allResources.filter((resource) => resource.service === 'AppSync');
                    const meta = amplify_cli_core_1.stateManager.getMeta(undefined);
                    let hasChanges = false;
                    for (const appSyncAPI of appSyncAPIs) {
                        const apiResource = lodash_1.default.get(meta, ['api', appSyncAPI.resourceName]);
                        if (apiResource) {
                            const defaultAuthentication = lodash_1.default.get(apiResource, ['output', 'authConfig', 'defaultAuthentication']);
                            if (defaultAuthentication && defaultAuthentication.authenticationType === 'AMAZON_COGNITO_USER_POOLS') {
                                defaultAuthentication.userPoolConfig.userPoolId = userPoolId;
                                hasChanges = true;
                            }
                            const additionalAuthenticationProviders = lodash_1.default.get(apiResource, ['output', 'authConfig', 'additionalAuthenticationProviders']);
                            for (const additionalAuthenticationProvider of additionalAuthenticationProviders) {
                                if (additionalAuthenticationProvider &&
                                    additionalAuthenticationProvider.authenticationType === 'AMAZON_COGNITO_USER_POOLS') {
                                    additionalAuthenticationProvider.userPoolConfig.userPoolId = userPoolId;
                                    hasChanges = true;
                                }
                            }
                        }
                    }
                    if (hasChanges) {
                        amplify_cli_core_1.stateManager.setMeta(undefined, meta);
                    }
                }
            }
        }
        await (0, download_api_models_1.downloadAPIModels)(context, newAPIresources);
        if (resources.concat(resourcesToBeDeleted).filter((r) => r.service === amplify_cli_core_1.AmplifySupportedService.LAMBDA_LAYER).length >
            0) {
            await (0, lambdaLayerInvocations_1.postPushLambdaLayerCleanup)(context, resources, projectDetails.localEnvInfo.envName);
            await context.amplify.updateamplifyMetaAfterPush(resources);
        }
        const analyticsResources = resourcesToBeCreated.filter((resource) => resource.category === amplify_cli_core_1.AmplifyCategories.ANALYTICS);
        if (analyticsResources && analyticsResources.length > 0) {
            context = await (0, plugin_client_api_analytics_1.invokePostPushAnalyticsUpdate)(context);
            await context.amplify.updateamplifyMetaAfterPush(analyticsResources);
        }
        await (0, upload_current_cloud_backend_1.storeCurrentCloudBackend)(context);
        await (0, amplify_service_manager_1.storeArtifactsForAmplifyService)(context);
        resources
            .filter((resource) => resource.category === 'auth' && resource.service === 'Cognito' && resource.providerPlugin === 'awscloudformation')
            .map(({ category, resourceName }) => context.amplify.removeDeploymentSecrets(context, category, resourceName));
        await (0, admin_modelgen_1.adminModelgen)(context, resources);
        await (0, display_helpful_urls_1.displayHelpfulURLs)(context, resources);
    }
    catch (error) {
        if (iterativeDeploymentWasInvoked) {
            await deploymentStateManager.failDeployment();
        }
        rollbackLambdaLayers(layerResources);
        throw new amplify_cli_core_1.AmplifyFault('DeploymentFault', {
            message: error.message,
            code: error.code,
            details: error.details,
        }, error);
    }
};
exports.run = run;
const updateStackForAPIMigration = async (context, category, resourceName, options) => {
    const { resourcesToBeCreated, resourcesToBeUpdated, resourcesToBeDeleted, allResources } = await context.amplify.getResourceStatus(category, resourceName, constants_1.ProviderName);
    const { isReverting, isCLIMigration } = options;
    let projectDetails = context.amplify.getProjectDetails();
    const resources = allResources.filter((resource) => resource.service === 'AppSync');
    await (0, upload_appsync_files_1.uploadAppSyncFiles)(context, resources, allResources, {
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
        let nestedStack;
        if (isReverting && isCLIMigration) {
            nestedStack = await (0, exports.formNestedStack)(context, projectDetails, category, resourceName, 'AppSync', true);
        }
        else if (isCLIMigration) {
            nestedStack = await (0, exports.formNestedStack)(context, projectDetails, category, resourceName, 'AppSync');
        }
        else {
            nestedStack = await (0, exports.formNestedStack)(context, projectDetails, category);
        }
        const eventMap = createEventMap(context, [...resourcesToBeCreated, ...resourcesToBeUpdated]);
        await updateCloudFormationNestedStack(context, nestedStack, resourcesToBeCreated, resourcesToBeUpdated, eventMap);
    }
    await context.amplify.updateamplifyMetaAfterPush(resources);
};
exports.updateStackForAPIMigration = updateStackForAPIMigration;
const prepareBuildableResources = async (context, resources) => {
    await Promise.all(resources.filter((resource) => resource.build).map((resource) => prepareResource(context, resource)));
};
const prepareResource = async (context, resource) => {
    resource.lastBuildTimeStamp = await context.amplify.invokePluginMethod(context, amplify_cli_core_1.AmplifyCategories.FUNCTION, undefined, 'buildResource', [
        context,
        resource,
    ]);
    const result = await context.amplify.invokePluginMethod(context, amplify_cli_core_1.AmplifyCategories.FUNCTION, undefined, 'packageResource', [context, resource]);
    if (result.newPackageCreated === false) {
        return;
    }
    const { envName } = context.amplify.getEnvInfo();
    const s3Key = `amplify-builds/${result.zipFilename}`;
    const s3 = await aws_s3_1.S3.getInstance(context);
    const s3Params = {
        Body: fs.createReadStream(result.zipFilePath),
        Key: s3Key,
    };
    logger('packageResources.s3.uploadFile', [{ Key: s3Key }])();
    const s3Bucket = await s3.uploadFile(s3Params);
    const { category, resourceName } = resource;
    const backendDir = amplify_cli_core_1.pathManager.getBackendDirPath();
    const resourceDir = path.normalize(path.join(backendDir, category, resourceName));
    const cfnFiles = glob_1.default.sync(cfnTemplateGlobPattern, {
        cwd: resourceDir,
        ignore: [parametersJson],
    });
    if (cfnFiles.length !== 1) {
        throw new amplify_cli_core_1.AmplifyError('CloudFormationTemplateError', {
            message: cfnFiles.length > 1
                ? 'Only one CloudFormation template is allowed in the resource directory'
                : 'No CloudFormation template found in the resource directory',
            details: `Resource directory: ${resourceDir}`,
        });
    }
    const cfnFile = cfnFiles[0];
    const cfnFilePath = path.normalize(path.join(resourceDir, cfnFile));
    const paramType = { Type: 'String' };
    if (resource.service === amplify_cli_core_1.AmplifySupportedService.LAMBDA_LAYER) {
        storeS3BucketInfo(category, s3Bucket, envName, resourceName, s3Key);
    }
    else if (resource.service === ApiServiceNameElasticContainer) {
        const cfnParams = { ParamZipPath: s3Key };
        amplify_cli_core_1.stateManager.setResourceParametersJson(undefined, category, resourceName, cfnParams);
    }
    else {
        const { cfnTemplate } = (0, amplify_cli_core_1.readCFNTemplate)(cfnFilePath);
        cfnTemplate.Parameters.deploymentBucketName = paramType;
        cfnTemplate.Parameters.s3Key = paramType;
        const deploymentBucketNameRef = 'deploymentBucketName';
        const s3KeyRef = 's3Key';
        if (cfnTemplate.Resources.LambdaFunction.Type === 'AWS::Serverless::Function') {
            cfnTemplate.Resources.LambdaFunction.Properties.CodeUri = {
                Bucket: cloudform_types_1.Fn.Ref(deploymentBucketNameRef),
                Key: cloudform_types_1.Fn.Ref(s3KeyRef),
            };
        }
        else {
            cfnTemplate.Resources.LambdaFunction.Properties.Code = {
                S3Bucket: cloudform_types_1.Fn.Ref(deploymentBucketNameRef),
                S3Key: cloudform_types_1.Fn.Ref(s3KeyRef),
            };
        }
        storeS3BucketInfo(category, s3Bucket, envName, resourceName, s3Key);
        amplify_cli_core_1.JSONUtilities.writeJson(cfnFilePath, cfnTemplate);
    }
};
const storeS3BucketInfo = (category, deploymentBucketName, envName, resourceName, s3Key) => {
    const amplifyMeta = amplify_cli_core_1.stateManager.getMeta();
    (0, amplify_environment_parameters_1.getEnvParamManager)(envName).getResourceParamManager(category, resourceName).setParams({ deploymentBucketName, s3Key });
    lodash_1.default.setWith(amplifyMeta, [category, resourceName, 's3Bucket'], { deploymentBucketName, s3Key });
    amplify_cli_core_1.stateManager.setMeta(undefined, amplifyMeta);
};
const updateCloudFormationNestedStack = async (context, nestedStack, resourcesToBeCreated, resourcesToBeUpdated, eventMap) => {
    const rootStackFilePath = path.join(amplify_cli_core_1.pathManager.getRootStackBuildDirPath(amplify_cli_core_1.pathManager.findProjectRoot()), exports.rootStackFileName);
    await (0, initializer_1.storeRootStackTemplate)(context, nestedStack);
    const transformedStackPath = await (0, cfn_pre_processor_1.preProcessCFNTemplate)(rootStackFilePath);
    const cfnItem = await new aws_cfn_1.default(context, generateUserAgentAction(resourcesToBeCreated, resourcesToBeUpdated), {}, eventMap);
    await cfnItem.updateResourceStack(transformedStackPath);
};
const generateUserAgentAction = (resourcesToBeCreated, resourcesToBeUpdated) => {
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
const getAllUniqueCategories = (resources) => {
    const categories = new Set();
    resources.forEach((resource) => categories.add(resource.category));
    return [...categories];
};
const getCfnFiles = (category, resourceName, includeAllNestedStacks = false, options) => {
    const backEndDir = amplify_cli_core_1.pathManager.getBackendDirPath();
    const resourceDir = path.normalize(path.join(backEndDir, category, resourceName));
    const resourceBuildDir = path.join(resourceDir, optionalBuildDirectoryName);
    if (fs.existsSync(resourceBuildDir) && fs.lstatSync(resourceBuildDir).isDirectory()) {
        const cfnFiles = glob_1.default.sync(cfnTemplateGlobPattern, {
            cwd: resourceBuildDir,
            ignore: [parametersJson, upload_auth_trigger_template_1.AUTH_TRIGGER_TEMPLATE],
            ...options,
        });
        if (includeAllNestedStacks) {
            cfnFiles.push(...glob_1.default.sync(nestedStackTemplateGlobPattern, {
                cwd: resourceBuildDir,
                ignore: [parametersJson, upload_auth_trigger_template_1.AUTH_TRIGGER_TEMPLATE],
                ...options,
            }));
        }
        if (cfnFiles.length > 0) {
            return {
                resourceDir: resourceBuildDir,
                cfnFiles,
            };
        }
    }
    const cfnFiles = glob_1.default.sync(cfnTemplateGlobPattern, {
        cwd: resourceDir,
        ignore: [parametersJson, upload_auth_trigger_template_1.AUTH_TRIGGER_TEMPLATE],
        ...options,
    });
    return {
        resourceDir,
        cfnFiles,
    };
};
exports.getCfnFiles = getCfnFiles;
const updateS3Templates = async (context, resourcesToBeUpdated, amplifyMeta) => {
    var _a, _b, _c, _d, _e, _f;
    const promises = [];
    for (const { category, resourceName, service } of resourcesToBeUpdated) {
        const { resourceDir, cfnFiles } = (0, exports.getCfnFiles)(category, resourceName);
        for (const cfnFile of cfnFiles) {
            await (0, cfn_pre_processor_1.writeCustomPoliciesToCFNTemplate)(resourceName, service, cfnFile, category, { minify: (_a = context.input.options) === null || _a === void 0 ? void 0 : _a.minify });
            const transformedCFNPath = await (0, cfn_pre_processor_1.preProcessCFNTemplate)(path.join(resourceDir, cfnFile), { minify: (_b = context.input.options) === null || _b === void 0 ? void 0 : _b.minify });
            promises.push((0, exports.uploadTemplateToS3)(context, transformedCFNPath, category, resourceName, amplifyMeta));
        }
    }
    const { APIGatewayAuthURL } = (_f = (_e = (_d = (_c = context.amplify.getProjectDetails()) === null || _c === void 0 ? void 0 : _c.amplifyMeta) === null || _d === void 0 ? void 0 : _d.providers) === null || _e === void 0 ? void 0 : _e[constants_1.default.ProviderName]) !== null && _f !== void 0 ? _f : {};
    if (APIGatewayAuthURL) {
        const resourceDir = path.join(context.amplify.pathManager.getBackendDirPath(), 'api');
        promises.push((0, exports.uploadTemplateToS3)(context, path.join(resourceDir, `${consolidate_apigw_policies_1.APIGW_AUTH_STACK_LOGICAL_ID}.json`), 'api', '', null));
    }
    return Promise.all(promises);
};
const uploadTemplateToS3 = async (context, filePath, category, resourceName, amplifyMeta) => {
    var _a;
    const cfnFile = path.parse(filePath).base;
    if ((_a = context.input.options) === null || _a === void 0 ? void 0 : _a.minify) {
        (0, minify_json_1.minifyJSONFile)(filePath);
    }
    const s3 = await aws_s3_1.S3.getInstance(context);
    const s3Params = {
        Body: fs.createReadStream(filePath),
        Key: `amplify-cfn-templates/${category}/${cfnFile}`,
    };
    logger('uploadTemplateToS3.s3.uploadFile', [{ Key: s3Params.Key }])();
    const projectBucket = await s3.uploadFile(s3Params, false);
    if (amplifyMeta) {
        const templateURL = `https://s3.amazonaws.com/${projectBucket}/amplify-cfn-templates/${category}/${cfnFile}`;
        const providerMetadata = amplifyMeta[category][resourceName].providerMetadata || {};
        providerMetadata.s3TemplateURL = templateURL;
        providerMetadata.logicalId = category + resourceName;
        context.amplify.updateamplifyMetaAfterResourceUpdate(category, resourceName, 'providerMetadata', providerMetadata);
    }
};
exports.uploadTemplateToS3 = uploadTemplateToS3;
const createResourceObject = (resource, category) => ({
    category: `${category}-${resource}`,
    key: category + resource,
});
const getCategoryResources = (file, resourceDir) => {
    const cloudFormationJsonPath = path.join(resourceDir, file);
    const { cfnTemplate } = (0, amplify_cli_core_1.readCFNTemplate)(cloudFormationJsonPath);
    const categoryResources = cfnTemplate.Resources ? Object.keys(cfnTemplate.Resources) : [];
    return categoryResources;
};
const createEventMap = (context, resourcesToBeCreatedOrUpdated) => {
    let eventMap = {};
    const { envName } = context.amplify.getEnvInfo();
    const { projectName } = context.amplify.getProjectConfig();
    const meta = amplify_cli_core_1.stateManager.getMeta();
    const rootStackName = meta.providers.awscloudformation.StackName;
    eventMap.rootStackName = rootStackName;
    eventMap.envName = envName;
    eventMap.projectName = projectName;
    eventMap.rootResources = [];
    eventMap.eventToCategories = new Map();
    eventMap.categories = [];
    eventMap.logicalResourceNames = [];
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
const handleCfnFiles = (eventMap, category, resource, updatedResources) => {
    const { resourceDir, cfnFiles } = (0, exports.getCfnFiles)(category, resource, false);
    cfnFiles.forEach((file) => {
        const categoryResources = getCategoryResources(file, resourceDir);
        categoryResources.forEach((res) => {
            eventMap.eventToCategories.set(res, `${category}-${resource}`);
        });
        if (updatedResources.includes(category)) {
            eventMap.categories.push({ name: `${category}-${resource}`, size: categoryResources.length });
        }
    });
    const { cfnFiles: allCfnFiles } = (0, exports.getCfnFiles)(category, resource, true);
    allCfnFiles.forEach((file) => {
        const categoryResources = getCategoryResources(file, resourceDir);
        categoryResources.forEach((res) => eventMap.logicalResourceNames.push(res));
    });
};
const formNestedStack = async (context, projectDetails, categoryName, resourceName, serviceName, skipEnv, useExistingMeta) => {
    var _a;
    let rootStack;
    rootStack = await (0, override_manager_1.transformRootStack)(context);
    const metaToBeUpdated = {
        DeploymentBucketName: rootStack.Resources.DeploymentBucket.Properties.BucketName,
        AuthRoleName: rootStack.Resources.AuthRole.Properties.RoleName,
        UnauthRoleName: rootStack.Resources.UnauthRole.Properties.RoleName,
    };
    for (const key of Object.keys(metaToBeUpdated)) {
        if (typeof metaToBeUpdated[key] === 'object' && 'Ref' in metaToBeUpdated[key]) {
            delete metaToBeUpdated[key];
        }
    }
    const projectPath = amplify_cli_core_1.pathManager.findProjectRoot();
    const amplifyMeta = useExistingMeta ? projectDetails.amplifyMeta : amplify_cli_core_1.stateManager.getMeta(projectPath);
    if (Object.keys(metaToBeUpdated).length) {
        context.amplify.updateProviderAmplifyMeta(constants_1.ProviderName, metaToBeUpdated);
        const { envName } = context.amplify.getEnvInfo();
        const teamProviderInfo = amplify_cli_core_1.stateManager.getTeamProviderInfo(projectPath);
        const tpiResourceParams = lodash_1.default.get(teamProviderInfo, [envName, 'awscloudformation'], {});
        lodash_1.default.assign(tpiResourceParams, metaToBeUpdated);
        lodash_1.default.setWith(teamProviderInfo, [envName, 'awscloudformation'], tpiResourceParams);
        amplify_cli_core_1.stateManager.setTeamProviderInfo(projectPath, teamProviderInfo);
    }
    try {
        const appId = amplifyMeta.providers[constants_1.ProviderName].AmplifyAppId;
        if ((await (0, admin_helpers_1.isAmplifyAdminApp)(appId)).isAdminApp) {
            rootStack.Description = 'Root Stack for AWS Amplify Console';
        }
    }
    catch (err) {
    }
    let authResourceName;
    const { APIGatewayAuthURL, NetworkStackS3Url, AuthTriggerTemplateURL } = amplifyMeta.providers[constants_1.default.ProviderName];
    const { envName } = amplify_cli_core_1.stateManager.getLocalEnvInfo(projectPath);
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
        const apis = (_a = amplifyMeta === null || amplifyMeta === void 0 ? void 0 : amplifyMeta.api) !== null && _a !== void 0 ? _a : {};
        for (const [apiName, api] of Object.entries(apis)) {
            if (await (0, consolidate_apigw_policies_1.loadApiCliInputs)(context, apiName, api)) {
                stack.Properties.Parameters[apiName] = {
                    'Fn::GetAtt': [api.providerMetadata.logicalId, 'Outputs.ApiId'],
                };
            }
        }
        rootStack.Resources[consolidate_apigw_policies_1.APIGW_AUTH_STACK_LOGICAL_ID] = stack;
    }
    if (AuthTriggerTemplateURL) {
        const stack = {
            Type: 'AWS::CloudFormation::Stack',
            Properties: {
                TemplateURL: AuthTriggerTemplateURL,
                Parameters: {
                    env: envName,
                },
            },
            DependsOn: [],
        };
        const cognitoResource = amplify_cli_core_1.stateManager.getResourceFromMeta(amplifyMeta, 'auth', 'Cognito');
        const authRootStackResourceName = `auth${cognitoResource.resourceName}`;
        const authTriggerCfnParameters = await context.amplify.invokePluginMethod(context, amplify_cli_core_1.AmplifyCategories.AUTH, amplify_cli_core_1.AmplifySupportedService.COGNITO, 'getAuthTriggerStackCfnParameters', [stack, cognitoResource.resourceName]);
        stack.Properties.Parameters = { ...stack.Properties.Parameters, ...authTriggerCfnParameters };
        stack.DependsOn.push(authRootStackResourceName);
        const { dependsOn } = cognitoResource.resource;
        dependsOn.forEach((resource) => {
            const dependsOnStackName = `${resource.category}${resource.resourceName}`;
            if (isAuthTrigger(resource)) {
                const lambdaRoleKey = `function${resource.resourceName}LambdaExecutionRole`;
                const lambdaRoleValue = { 'Fn::GetAtt': [dependsOnStackName, `Outputs.LambdaExecutionRoleArn`] };
                stack.Properties.Parameters[lambdaRoleKey] = lambdaRoleValue;
            }
            stack.DependsOn.push(dependsOnStackName);
            const dependsOnAttributes = resource === null || resource === void 0 ? void 0 : resource.attributes;
            dependsOnAttributes.forEach((attribute) => {
                const parameterKey = `${resource.category}${resource.resourceName}${attribute}`;
                const parameterValue = { 'Fn::GetAtt': [dependsOnStackName, `Outputs.${attribute}`] };
                stack.Properties.Parameters[parameterKey] = parameterValue;
            });
        });
        rootStack.Resources[upload_auth_trigger_template_1.AUTH_TRIGGER_STACK] = stack;
    }
    if (NetworkStackS3Url) {
        rootStack.Resources[stack_1.NETWORK_STACK_LOGICAL_ID] = {
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
            var _a, _b;
            const resourceDetails = amplifyMeta[category][resource];
            if (category === 'auth' && resource !== 'userPoolGroups') {
                authResourceName = resource;
            }
            const resourceKey = category + resource;
            let templateURL;
            if (resourceDetails.providerPlugin) {
                const parameters = (0, resourceParams_1.loadResourceParameters)(context, category, resource);
                const { dependsOn } = resourceDetails;
                if (dependsOn) {
                    for (let i = 0; i < dependsOn.length; i += 1) {
                        for (const attribute of ((_a = dependsOn[i]) === null || _a === void 0 ? void 0 : _a.attributes) || []) {
                            let parameterValue;
                            const dependentResource = lodash_1.default.get(amplifyMeta, [dependsOn[i].category, dependsOn[i].resourceName], undefined);
                            if (!dependentResource && dependsOn[i].category) {
                                throw new amplify_cli_core_1.AmplifyError('PushResourcesError', {
                                    message: `Cannot get resource: ${dependsOn[i].resourceName} from '${dependsOn[i].category}' category.`,
                                });
                            }
                            if (dependentResource && dependentResource.serviceType === 'imported') {
                                const outputAttributeValue = lodash_1.default.get(dependentResource, ['output', attribute], undefined);
                                if (!outputAttributeValue) {
                                    throw new amplify_cli_core_1.AmplifyError('PushResourcesError', {
                                        message: `Cannot read the '${attribute}' dependent attribute value from the output section of resource: '${dependsOn[i].resourceName}'.`,
                                    });
                                }
                                parameterValue = outputAttributeValue;
                            }
                            else {
                                const dependsOnStackName = dependsOn[i].category + dependsOn[i].resourceName;
                                parameterValue = { 'Fn::GetAtt': [dependsOnStackName, `Outputs.${attribute}`] };
                            }
                            const parameterKey = `${dependsOn[i].category}${dependsOn[i].resourceName}${attribute}`;
                            const isResourceGqlWithAuthDep = (resourceDetails === null || resourceDetails === void 0 ? void 0 : resourceDetails.service) === 'AppSync' && ((_b = dependsOn[i]) === null || _b === void 0 ? void 0 : _b.category) === 'auth';
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
                if ((category === amplify_cli_core_1.AmplifyCategories.API || category === amplify_cli_core_1.AmplifyCategories.HOSTING) &&
                    resourceDetails.service === ApiServiceNameElasticContainer) {
                    parameters.deploymentBucketName = cloudform_types_1.Fn.Ref('DeploymentBucketName');
                    parameters.rootStackName = cloudform_types_1.Fn.Ref('AWS::StackName');
                }
                const currentEnv = context.amplify.getEnvInfo().envName;
                if (!skipEnv && resourceName) {
                    if (resource === resourceName && category === categoryName && amplifyMeta[category][resource].service === serviceName) {
                        Object.assign(parameters, { env: currentEnv });
                    }
                }
                else if (!skipEnv) {
                    Object.assign(parameters, { env: currentEnv });
                }
                const { imported, userPoolId, authRoleArn, authRoleName, unauthRoleArn, unauthRoleName } = context.amplify.getImportedAuthProperties(context);
                if (category !== amplify_cli_core_1.AmplifyCategories.AUTH && resourceDetails.service !== 'Cognito' && imported) {
                    if (parameters.AuthCognitoUserPoolId) {
                        parameters.AuthCognitoUserPoolId = userPoolId;
                    }
                    if (parameters.authRoleArn) {
                        parameters.authRoleArn = authRoleArn;
                    }
                    if (parameters.authRoleName) {
                        parameters.authRoleName = authRoleName || { Ref: 'AuthRoleName' };
                    }
                    if (parameters.unauthRoleArn) {
                        parameters.unauthRoleArn = unauthRoleArn;
                    }
                    if (parameters.unauthRoleName) {
                        parameters.unauthRoleName = unauthRoleName || { Ref: 'UnauthRoleName' };
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
        const importedAuth = lodash_1.default.get(amplifyMeta, [amplify_cli_core_1.AmplifyCategories.AUTH, authResourceName], undefined);
        if (importedAuth && importedAuth.serviceType !== 'imported') {
            const authParameters = (0, resourceParams_1.loadResourceParameters)(context, amplify_cli_core_1.AmplifyCategories.AUTH, authResourceName);
            if (authParameters.identityPoolName) {
                updateIdPRolesInNestedStack(rootStack, authResourceName);
            }
        }
    }
    return rootStack;
};
exports.formNestedStack = formNestedStack;
const updateIdPRolesInNestedStack = (nestedStack, authResourceName) => {
    const authLogicalResourceName = `auth${authResourceName}`;
    const idpUpdateRoleCfnFilePath = path.join(__dirname, '..', 'resources', 'update-idp-roles-cfn.json');
    const idpUpdateRoleCfn = amplify_cli_core_1.JSONUtilities.readJson(idpUpdateRoleCfnFilePath);
    idpUpdateRoleCfn.UpdateRolesWithIDPFunction.DependsOn.push(authLogicalResourceName);
    idpUpdateRoleCfn.UpdateRolesWithIDPFunctionOutputs.Properties.idpId['Fn::GetAtt'].unshift(authLogicalResourceName);
    Object.assign(nestedStack.Resources, idpUpdateRoleCfn);
};
const isAuthTrigger = (dependsOnResource) => amplify_cli_core_1.FeatureFlags.getBoolean('auth.breakCircularDependency') &&
    dependsOnResource.category === 'function' &&
    dependsOnResource.triggerProvider === 'Cognito';
const generateAndUploadRootStack = async (context, destinationPath, destinationS3Key) => {
    var _a;
    const projectDetails = context.amplify.getProjectDetails();
    const nestedStack = await (0, exports.formNestedStack)(context, projectDetails);
    await (0, initializer_1.storeRootStackTemplate)(context, nestedStack);
    const s3Client = await aws_s3_1.S3.getInstance(context);
    const s3Params = {
        Body: Buffer.from(amplify_cli_core_1.JSONUtilities.stringify(nestedStack, { minify: (_a = context.input.options) === null || _a === void 0 ? void 0 : _a.minify })),
        Key: destinationS3Key,
    };
    await s3Client.uploadFile(s3Params, false);
};
exports.generateAndUploadRootStack = generateAndUploadRootStack;
const rollbackLambdaLayers = (layerResources) => {
    if (layerResources.length > 0) {
        const projectRoot = amplify_cli_core_1.pathManager.findProjectRoot();
        const currentMeta = amplify_cli_core_1.stateManager.getCurrentMeta(projectRoot);
        const meta = amplify_cli_core_1.stateManager.getMeta(projectRoot);
        layerResources.forEach((r) => {
            const layerMetaPath = [amplify_cli_core_1.AmplifyCategories.FUNCTION, r.resourceName, 'latestPushedVersionHash'];
            const previousHash = lodash_1.default.get(currentMeta, layerMetaPath, undefined);
            lodash_1.default.setWith(meta, layerMetaPath, previousHash);
        });
        amplify_cli_core_1.stateManager.setMeta(projectRoot, meta);
    }
};
//# sourceMappingURL=push-resources.js.map