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
exports.ResourcePackager = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const lodash_1 = __importDefault(require("lodash"));
const cloudform_types_1 = require("cloudform-types");
const path = __importStar(require("path"));
const lambdaLayerInvocations_1 = require("../lambdaLayerInvocations");
const push_resources_1 = require("../push-resources");
const remove_dependent_function_1 = require("../utils/remove-dependent-function");
const constants_1 = require("./constants");
const consolidate_apigw_policies_1 = require("../utils/consolidate-apigw-policies");
const auth_transform_1 = require("../auth-transform");
const cfn_pre_processor_1 = require("../pre-push-cfn-processor/cfn-pre-processor");
const types_1 = require("./types");
const template_description_utils_1 = require("../template-description-utils");
class ResourcePackager {
    constructor(context, deployType) {
        this.getResourcesToBeDeployed = ({ allResources, resourcesToBeCreated, resourcesToBeUpdated, }) => {
            var _a, _b;
            return !!((_b = (_a = this.context) === null || _a === void 0 ? void 0 : _a.exeInfo) === null || _b === void 0 ? void 0 : _b.forcePush) || this.deployType === types_1.ResourceDeployType.Export
                ? allResources.filter((resource) => resource.category !== 'providers' && resource.providerPlugin === 'awscloudformation')
                : resourcesToBeCreated.concat(resourcesToBeUpdated);
        };
        this.resourcesHasCategoryService = (resources, category, service) => resources.some((resource) => resource.category === category && (service ? resource.service === service : true));
        this.filterResourceByCategoryService = (resources, category, service) => resources.filter((resource) => resource.category === category && (service ? resource.service === service : true));
        this.context = context;
        this.elasticContainerZipFiles = ['custom-resource-pipeline-awaiter.zip', 'codepipeline-action-buildspec-generator-lambda.zip'];
        const projectPath = amplify_cli_core_1.pathManager.findProjectRoot();
        this.amplifyMeta = amplify_cli_core_1.stateManager.getMeta(projectPath);
        this.amplifyTeamProviderInfo = amplify_cli_core_1.stateManager.getTeamProviderInfo(projectPath);
        this.envInfo = amplify_cli_core_1.stateManager.getLocalEnvInfo(projectPath);
        this.deployType = deployType;
    }
    async filterResourcesToBeDeployed(deploymentResources) {
        const resources = this.getResourcesToBeDeployed(deploymentResources);
        const { API_CATEGORY } = constants_1.Constants;
        const apiResourceToBeUpdated = this.filterResourceByCategoryService(deploymentResources.resourcesToBeUpdated, API_CATEGORY.NAME, API_CATEGORY.SERVICE.APP_SYNC);
        if (apiResourceToBeUpdated.length) {
            const functionResourceToBeUpdated = await (0, remove_dependent_function_1.ensureValidFunctionModelDependencies)(this.context, apiResourceToBeUpdated, deploymentResources.allResources);
            if (functionResourceToBeUpdated !== undefined && functionResourceToBeUpdated.length > 0) {
                return lodash_1.default.uniqBy(resources.concat(functionResourceToBeUpdated.map((r) => r)), 'resourceName');
            }
        }
        return resources;
    }
    async preBuildResources(resources) {
        const { FUNCTION_CATEGORY } = constants_1.Constants;
        for await (const lambdaLayerResource of this.filterResourceByCategoryService(resources, FUNCTION_CATEGORY.NAME, FUNCTION_CATEGORY.SERVICE.LAMBDA_LAYER)) {
            await (0, lambdaLayerInvocations_1.legacyLayerMigration)(this.context, lambdaLayerResource.resourceName);
        }
        amplify_cli_core_1.spinner.stop();
        await (0, lambdaLayerInvocations_1.prePushLambdaLayerPrompt)(this.context, resources);
        amplify_cli_core_1.spinner.start();
        return resources;
    }
    async buildResources(resources) {
        const { FUNCTION_CATEGORY, API_CATEGORY } = constants_1.Constants;
        return Promise.all(resources.map(async (resource) => {
            if (!resource.build) {
                return resource;
            }
            if (resource.category === API_CATEGORY.NAME && resource.service === API_CATEGORY.SERVICE.ELASTIC_CONTAINER) {
                resource.lastPackageTimeStamp = undefined;
            }
            const lastBuildTimeStamp = await this.context.amplify.invokePluginMethod(this.context, FUNCTION_CATEGORY.NAME, resource.service, 'buildResource', [this.context, resource]);
            return {
                ...resource,
                lastBuildTimeStamp,
            };
        }));
    }
    async packageResources(builtResources) {
        const { FUNCTION_CATEGORY } = constants_1.Constants;
        return Promise.all(builtResources.map(async (resource) => {
            if (!resource.build) {
                return resource;
            }
            const result = await this.context.amplify.invokePluginMethod(this.context, FUNCTION_CATEGORY.NAME, resource.service, 'packageResource', [this.context, resource, true]);
            return {
                ...resource,
                packagerParams: result,
            };
        }));
    }
    async postPackageResource(packagedResources) {
        const { options } = this.context.parameters;
        const { API_CATEGORY } = constants_1.Constants;
        if (this.resourcesHasCategoryService(packagedResources, API_CATEGORY.NAME, API_CATEGORY.SERVICE.APP_SYNC)) {
            await amplify_cli_core_1.ApiCategoryFacade.transformGraphQLSchema(this.context, {
                handleMigration: (opts) => (0, push_resources_1.updateStackForAPIMigration)(this.context, 'api', undefined, opts),
                minify: options.minify,
            });
        }
        return packagedResources;
    }
    resourcesHasContainers(packagedResources) {
        const { API_CATEGORY, HOSTING_CATEGORY } = constants_1.Constants;
        return (this.resourcesHasCategoryService(packagedResources, API_CATEGORY.NAME, API_CATEGORY.SERVICE.ELASTIC_CONTAINER) ||
            this.resourcesHasCategoryService(packagedResources, HOSTING_CATEGORY.NAME, HOSTING_CATEGORY.SERVICE.ELASTIC_CONTAINER));
    }
    resourcesHasApiGatewaysButNotAdminQueries(packagedResources) {
        const { API_CATEGORY } = constants_1.Constants;
        const resources = packagedResources.filter((r) => r.resourceName !== 'AdminQueries');
        return this.resourcesHasCategoryService(resources, API_CATEGORY.NAME, API_CATEGORY.SERVICE.API_GATEWAY);
    }
    storeS3BucketInfo(packagedResource, bucketName) {
        if (!packagedResource.build) {
            return;
        }
        const s3Info = {
            deploymentBucketName: bucketName,
            s3Key: packagedResource.packagerParams.zipFilename,
        };
        const { CATEGORIES, S3_BUCKET } = constants_1.Constants;
        lodash_1.default.setWith(this.amplifyTeamProviderInfo, [this.envInfo.envName, CATEGORIES, packagedResource.category, packagedResource.resourceName], s3Info);
        lodash_1.default.setWith(packagedResource, ['s3Bucket'], s3Info);
        lodash_1.default.setWith(this.amplifyMeta, [packagedResource.category, packagedResource.resourceName, S3_BUCKET], s3Info);
    }
    async generateCategoryCloudFormation(resources) {
        if (this.resourcesHasApiGatewaysButNotAdminQueries(resources)) {
            const { PROVIDER, PROVIDER_NAME } = constants_1.Constants;
            const { StackName: stackName } = this.amplifyMeta[PROVIDER][PROVIDER_NAME];
            await (0, consolidate_apigw_policies_1.consolidateApiGatewayPolicies)(this.context, stackName);
        }
        await (0, auth_transform_1.prePushAuthTransform)(this.context, resources);
        for await (const resource of resources) {
            await this.generateByCategoryService(resource);
        }
    }
    async generateByCategoryService(resource) {
        const { API_CATEGORY, HOSTING_CATEGORY, EXPOSED_CONTAINER } = constants_1.Constants;
        switch (resource.category) {
            case API_CATEGORY.NAME:
                if (resource.service === API_CATEGORY.SERVICE.ELASTIC_CONTAINER) {
                    const { exposedContainer } = await this.context.amplify.invokePluginMethod(this.context, 'api', undefined, 'generateContainersArtifacts', [this.context, resource]);
                    lodash_1.default.setWith(this.amplifyMeta, [resource.category, resource.resourceName, EXPOSED_CONTAINER], exposedContainer);
                }
                break;
            case HOSTING_CATEGORY.NAME:
                if (resource.service === HOSTING_CATEGORY.SERVICE.ELASTIC_CONTAINER) {
                    await this.context.amplify.invokePluginMethod(this.context, 'hosting', 'ElasticContainer', 'generateHostingResources', [
                        this.context,
                        resource,
                    ]);
                }
                break;
            default:
                break;
        }
    }
    async postGenerateCategoryCloudFormation(resources) {
        const { API_CATEGORY, FUNCTION_CATEGORY } = constants_1.Constants;
        const transformedCfnResources = [];
        await (0, template_description_utils_1.prePushTemplateDescriptionHandler)(this.context, resources);
        for await (const resource of resources) {
            const cfnFiles = this.getCfnTemplatePathsForResource(resource);
            const transformedCfnPaths = [];
            for await (const cfnFile of cfnFiles) {
                if (resource.build &&
                    resource.service !== API_CATEGORY.SERVICE.ELASTIC_CONTAINER &&
                    resource.service !== FUNCTION_CATEGORY.SERVICE.LAMBDA_LAYER) {
                    const { cfnTemplate, templateFormat } = (0, amplify_cli_core_1.readCFNTemplate)(cfnFile);
                    const paramType = { Type: 'String' };
                    const deploymentBucketNameRef = 'deploymentBucketName';
                    const s3KeyRef = 's3Key';
                    cfnTemplate.Parameters.deploymentBucketName = paramType;
                    cfnTemplate.Parameters.s3Key = paramType;
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
                    await (0, amplify_cli_core_1.writeCFNTemplate)(cfnTemplate, cfnFile, { templateFormat });
                }
                const transformedCFNPath = await (0, cfn_pre_processor_1.preProcessCFNTemplate)(cfnFile);
                await (0, cfn_pre_processor_1.writeCustomPoliciesToCFNTemplate)(resource.resourceName, resource.service, path.basename(cfnFile), resource.category);
                transformedCfnPaths.push(transformedCFNPath);
            }
            this.storeS3BucketInfo(resource, 'deploymentBucketRef');
            transformedCfnResources.push({
                ...resource,
                transformedCfnPaths,
            });
        }
        return transformedCfnResources;
    }
    getCfnTemplatePathsForResource(resource) {
        const { cfnFiles } = (0, push_resources_1.getCfnFiles)(resource.category, resource.resourceName, false, {
            absolute: true,
        });
        return cfnFiles;
    }
    async generateRootStack() {
        return (0, push_resources_1.formNestedStack)(this.context, { amplifyMeta: this.amplifyMeta }, undefined, undefined, undefined, undefined, true);
    }
}
exports.ResourcePackager = ResourcePackager;
//# sourceMappingURL=resource-packager.js.map