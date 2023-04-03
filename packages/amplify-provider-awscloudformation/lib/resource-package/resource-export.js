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
exports.ResourceExport = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const cloudform_types_1 = require("cloudform-types");
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const types_1 = require("./types");
const constants_1 = require("./constants");
const resource_packager_1 = require("./resource-packager");
const env_level_constructs_1 = require("../utils/env-level-constructs");
const lodash_1 = __importDefault(require("lodash"));
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const upload_auth_trigger_template_1 = require("../utils/upload-auth-trigger-template");
const aws_s3_1 = require("../aws-utils/aws-s3");
const zip_util_1 = require("../zip-util");
const functions_1 = require("cloudform-types/types/functions");
const pre_push_cfn_modifier_1 = require("../pre-push-cfn-processor/pre-push-cfn-modifier");
const template_description_utils_1 = require("../template-description-utils");
const { API_CATEGORY, AUTH_CATEGORY, FUNCTION_CATEGORY, NOTIFICATIONS_CATEGORY, AMPLIFY_CFN_TEMPLATES, AMPLIFY_APPSYNC_FILES, PROVIDER_METADATA, NETWORK_STACK_S3_URL, AUTH_TRIGGER_TEMPLATE_FILE, AUTH_TRIGGER_TEMPLATE_URL, API_GATEWAY_AUTH_URL, APIGW_AUTH_STACK_FILE_NAME, APPSYNC_STACK_FOLDER, APPSYNC_BUILD_FOLDER, NETWORK_STACK_FILENAME, PROVIDER_NAME, PROVIDER, AMPLIFY_BUILDS, AUTH_ASSETS, AMPLIFY_AUXILIARY_LAMBDAS, AWS_CLOUDFORMATION_STACK_TYPE, AMPLIFY_AUTH_ASSETS, NETWORK_STACK_LOGICAL_ID, APIGW_AUTH_STACK_LOGICAL_ID, } = constants_1.Constants;
class ResourceExport extends resource_packager_1.ResourcePackager {
    constructor(context, exportDirectoryPath) {
        super(context, types_1.ResourceDeployType.Export);
        this.exportDirectoryPath = exportDirectoryPath;
    }
    async packageBuildWriteResources(deploymentResources) {
        this.warnForNonExportable(deploymentResources.allResources);
        const resources = await this.filterResourcesToBeDeployed(deploymentResources);
        const preBuiltResources = await this.preBuildResources(resources);
        const builtResources = await this.buildResources(preBuiltResources);
        const packagedResources = await this.packageResources(builtResources);
        const postPackageResources = await this.postPackageResource(packagedResources);
        return postPackageResources;
    }
    async generateAndTransformCfnResources(packagedResources) {
        await this.generateCategoryCloudFormation(packagedResources);
        const transformedCfnResources = await this.postGenerateCategoryCloudFormation(packagedResources);
        const stackParameters = await this.writeCategoryCloudFormation(transformedCfnResources);
        return { transformedResources: transformedCfnResources, stackParameters };
    }
    fixNestedStackParameters(transformedCfnResources, stackParameters) {
        const projectPath = amplify_cli_core_1.pathManager.findProjectRoot();
        const { StackName: rootstackName } = this.amplifyMeta[PROVIDER][PROVIDER_NAME];
        const nestedStack = stackParameters[rootstackName].nestedStacks;
        for (const resource of transformedCfnResources) {
            const fileParameters = amplify_cli_core_1.stateManager.getResourceParametersJson(projectPath, resource.category, resource.resourceName, {
                default: {},
                throwIfNotExist: false,
            });
            const nestedStackName = resource.category + resource.resourceName;
            const usedParameters = nestedStack[nestedStackName].parameters;
            Object.keys(usedParameters).forEach((paramKey) => {
                if (paramKey in fileParameters) {
                    usedParameters[paramKey] = fileParameters[paramKey];
                }
            });
        }
        return stackParameters;
    }
    async generateAndWriteRootStack(stackParameters) {
        const { StackName: stackName, AuthRoleName, UnauthRoleName, DeploymentBucketName } = this.amplifyMeta[PROVIDER][PROVIDER_NAME];
        const template = await this.generateRootStack();
        const parameters = this.extractParametersFromTemplateNestedStack(template);
        const modifiedTemplate = await this.modifyRootStack(template, true);
        this.writeRootStackToPath(modifiedTemplate);
        stackParameters[stackName].destination = path.join(this.exportDirectoryPath, 'root-stack-template.json');
        [...parameters.keys()].forEach((key) => {
            if (stackParameters[stackName].nestedStacks && stackParameters[stackName].nestedStacks[key]) {
                stackParameters[stackName].nestedStacks[key].parameters = parameters.get(key);
            }
        });
        stackParameters[stackName].parameters = {
            AuthRoleName,
            UnauthRoleName,
            DeploymentBucketName,
        };
        return stackParameters;
    }
    warnForNonExportable(resources) {
        const notificationsResources = this.filterResourceByCategoryService(resources, NOTIFICATIONS_CATEGORY.NAME);
        if (notificationsResources.length > 0) {
            amplify_prompts_1.printer.blankLine();
            amplify_prompts_1.printer.warn(`The ${NOTIFICATIONS_CATEGORY.NAME} resource '${notificationsResources
                .map((r) => r.resourceName)
                .join(', ')}' cannot be exported since it is managed using SDK`);
        }
    }
    async writeResourcesToDestination(resources) {
        for (const resource of resources) {
            if (resource.packagerParams && resource.packagerParams.newPackageCreated) {
                const destinationPath = path.join(this.exportDirectoryPath, resource.category, resource.resourceName, AMPLIFY_BUILDS, resource.packagerParams.zipFilename);
                await this.copyResource(resource.packagerParams.zipFilePath, destinationPath);
            }
            if (resource.category === FUNCTION_CATEGORY.NAME && resource.service === FUNCTION_CATEGORY.SERVICE.LAMBDA_LAYER) {
                await this.downloadLambdaLayerContent(resource);
            }
            if (resource.category === API_CATEGORY.NAME && resource.service === API_CATEGORY.SERVICE.APP_SYNC) {
                const backendFolder = amplify_cli_core_1.pathManager.getBackendDirPath();
                const foldersToCopy = ['functions', 'pipelineFunctions', 'resolvers', 'stacks', 'schema.graphql'];
                for (const folder of foldersToCopy) {
                    const sourceFolder = path.join(backendFolder, resource.category, resource.resourceName, APPSYNC_BUILD_FOLDER, folder);
                    const destinationFolder = path.join(this.exportDirectoryPath, resource.category, resource.resourceName, AMPLIFY_APPSYNC_FILES, folder);
                    await this.copyResource(sourceFolder, destinationFolder);
                }
            }
            if (resource.category === AUTH_CATEGORY.NAME && resource.service === AUTH_CATEGORY.SERVICE.COGNITO) {
                const authResourceBackend = path.join(amplify_cli_core_1.pathManager.getBackendDirPath(), resource.category, resource.resourceName);
                const authResourceAssets = path.join(authResourceBackend, AUTH_ASSETS);
                if (fs.existsSync(authResourceAssets)) {
                    const destinationPath = path.join(this.exportDirectoryPath, resource.category, resource.resourceName, AMPLIFY_AUTH_ASSETS);
                    await this.copyResource(authResourceAssets, destinationPath);
                }
            }
        }
        if (this.resourcesHasContainers(resources)) {
            for (const zipFile of this.elasticContainerZipFiles) {
                const destinationPath = path.join(this.exportDirectoryPath, AMPLIFY_AUXILIARY_LAMBDAS, zipFile);
                const sourceFile = path.join(__dirname, '../..', 'resources', zipFile);
                await this.copyResource(sourceFile, destinationPath);
            }
        }
    }
    async downloadLambdaLayerContent(resource) {
        const backendDir = amplify_cli_core_1.pathManager.getBackendDirPath();
        const cfnFilePath = path.join(backendDir, resource.category, resource.resourceName, `${resource.resourceName}-awscloudformation-template.json`);
        const template = amplify_cli_core_1.JSONUtilities.readJson(cfnFilePath);
        const layerVersions = Object.keys(template.Resources).reduce((array, resourceKey) => {
            const layerVersionResource = template.Resources[resourceKey];
            if (layerVersionResource.Type === 'AWS::Lambda::LayerVersion') {
                const path = lodash_1.default.get(layerVersionResource.Properties, ['Content', 'S3Key']);
                if (path && typeof path === 'string') {
                    array.push({
                        logicalName: resourceKey,
                        contentPath: path,
                    });
                }
            }
            return array;
        }, []);
        if (layerVersions.length > 0) {
            const s3instance = await aws_s3_1.S3.getInstance(this.context);
            for await (const lambdaLayer of layerVersions) {
                const exportPath = path.join(this.exportDirectoryPath, resource.category, resource.resourceName);
                await (0, zip_util_1.downloadZip)(s3instance, exportPath, lambdaLayer.contentPath, this.envInfo.envName);
            }
        }
    }
    async processAndWriteCfn(cfnFile, destinationPath, deleteParameters = true) {
        const { cfnTemplate, templateFormat } = (0, amplify_cli_core_1.readCFNTemplate)(cfnFile);
        return await this.processAndWriteCfnTemplate(cfnTemplate, destinationPath, templateFormat, deleteParameters);
    }
    async processAndWriteCfnTemplate(cfnTemplate, destinationPath, templateFormat, deleteParameters) {
        const parameters = this.extractParametersFromTemplateNestedStack(cfnTemplate);
        const template = await this.modifyRootStack(cfnTemplate, deleteParameters);
        await (0, amplify_cli_core_1.writeCFNTemplate)(template, destinationPath, { templateFormat });
        return parameters;
    }
    async copyResource(sourcePath, destinationPath) {
        let dir = destinationPath;
        if (!fs.existsSync(sourcePath)) {
            return;
        }
        if (path.extname(destinationPath)) {
            dir = path.dirname(destinationPath);
        }
        await fs.ensureDir(dir);
        await fs.copy(sourcePath, destinationPath, { overwrite: true, preserveTimestamps: true, recursive: true });
    }
    async writeCategoryCloudFormation(resources) {
        const { StackName: stackName } = this.amplifyMeta[PROVIDER][PROVIDER_NAME];
        const bucket = 'externalDeploymentBucketName';
        const stackParameters = {};
        stackParameters[stackName] = {
            destination: 'dummyPath',
            parameters: {},
            nestedStacks: {},
        };
        for await (const resource of resources) {
            const logicalId = resource.category + resource.resourceName;
            for (const cfnFile of resource.transformedCfnPaths) {
                const fileName = path.parse(cfnFile).base;
                const templateURL = this.createTemplateUrl(bucket, fileName, resource.category);
                const destination = path.join(this.exportDirectoryPath, resource.category, resource.resourceName, fileName);
                const nestedStack = {
                    destination,
                    nestedStacks: {},
                };
                if (resource.category === API_CATEGORY.NAME && resource.service === API_CATEGORY.SERVICE.APP_SYNC) {
                    const parameters = await this.processAndWriteCfn(cfnFile, destination, false);
                    [...parameters.keys()].forEach((key) => {
                        const nestedStackPath = path.join(this.exportDirectoryPath, resource.category, resource.resourceName, AMPLIFY_APPSYNC_FILES, APPSYNC_STACK_FOLDER, key === 'CustomResourcesjson' ? 'CustomResources.json' : `${key}.json`);
                        nestedStack.nestedStacks[key] = {
                            destination: nestedStackPath,
                            nestedStacks: {},
                        };
                    });
                }
                else if (resource.category === FUNCTION_CATEGORY.NAME && resource.service === FUNCTION_CATEGORY.SERVICE.LAMBDA_LAYER) {
                    const { cfnTemplate, templateFormat } = (0, amplify_cli_core_1.readCFNTemplate)(cfnFile);
                    Object.keys(cfnTemplate.Resources)
                        .filter((key) => cfnTemplate.Resources[key].Type === 'AWS::Lambda::LayerVersion')
                        .forEach((layerVersionResourceKey) => {
                        const layerVersionResource = cfnTemplate.Resources[layerVersionResourceKey];
                        const s3Key = lodash_1.default.get(layerVersionResource.Properties, ['Content', 'S3Key']);
                        layerVersionResource.Properties['Content']['S3Key'] = cloudform_types_1.Fn.Join('/', [
                            (0, functions_1.Ref)('s3Key'),
                            typeof s3Key === 'string' ? path.basename(s3Key) : resource.packagerParams.zipFilename,
                        ]);
                    });
                    await this.processAndWriteCfnTemplate(cfnTemplate, destination, templateFormat, false);
                }
                else {
                    await this.copyResource(cfnFile, destination);
                }
                stackParameters[stackName].nestedStacks[logicalId] = nestedStack;
                lodash_1.default.setWith(this.amplifyMeta, [resource.category, resource.resourceName, PROVIDER_METADATA], {
                    s3TemplateURL: templateURL,
                    logicalId,
                });
            }
        }
        if (this.resourcesHasContainers(resources)) {
            const template = (await (0, env_level_constructs_1.getNetworkResourceCfn)(this.context, stackName));
            const destinationPath = path.join(this.exportDirectoryPath, AMPLIFY_CFN_TEMPLATES, NETWORK_STACK_FILENAME);
            stackParameters[stackName].nestedStacks[NETWORK_STACK_LOGICAL_ID] = {
                destination: destinationPath,
            };
            amplify_cli_core_1.JSONUtilities.writeJson(destinationPath, template);
            lodash_1.default.setWith(this.amplifyMeta, [PROVIDER, PROVIDER_NAME, NETWORK_STACK_S3_URL], this.createTemplateUrl(bucket, NETWORK_STACK_FILENAME));
        }
        if (this.resourcesHasApiGatewaysButNotAdminQueries(resources)) {
            const apiGWAuthFile = path.join(amplify_cli_core_1.pathManager.getBackendDirPath(), API_CATEGORY.NAME, APIGW_AUTH_STACK_FILE_NAME);
            if (fs.existsSync(apiGWAuthFile)) {
                const destination = path.join(this.exportDirectoryPath, AUTH_CATEGORY.NAME, APIGW_AUTH_STACK_FILE_NAME);
                stackParameters[stackName].nestedStacks[APIGW_AUTH_STACK_LOGICAL_ID] = {
                    destination: destination,
                };
                await this.copyResource(apiGWAuthFile, destination);
                lodash_1.default.setWith(this.amplifyMeta, [PROVIDER, PROVIDER_NAME, API_GATEWAY_AUTH_URL], this.createTemplateUrl(bucket, APIGW_AUTH_STACK_FILE_NAME, API_CATEGORY.NAME));
            }
        }
        const authResource = this.getAuthCognitoResource(resources);
        if (amplify_cli_core_1.FeatureFlags.getBoolean('auth.breakCircularDependency') && authResource) {
            const pathToTriggerFile = path.join(amplify_cli_core_1.pathManager.getBackendDirPath(), AUTH_CATEGORY.NAME, authResource.resourceName, AUTH_TRIGGER_TEMPLATE_FILE);
            if (fs.existsSync(pathToTriggerFile)) {
                const destination = path.join(this.exportDirectoryPath, AUTH_CATEGORY.NAME, AUTH_TRIGGER_TEMPLATE_FILE);
                stackParameters[stackName].nestedStacks[upload_auth_trigger_template_1.AUTH_TRIGGER_STACK] = {
                    destination: destination,
                };
                await this.copyResource(pathToTriggerFile, destination);
                lodash_1.default.setWith(this.amplifyMeta, [PROVIDER, PROVIDER_NAME, AUTH_TRIGGER_TEMPLATE_URL], this.createTemplateUrl(bucket, AUTH_TRIGGER_TEMPLATE_FILE, AUTH_CATEGORY.NAME));
            }
        }
        return stackParameters;
    }
    extractParametersFromTemplateNestedStack(template) {
        const map = Object.keys(template.Resources).reduce((map, resourceKey) => {
            const resource = template.Resources[resourceKey];
            if (resource.Type === AWS_CLOUDFORMATION_STACK_TYPE) {
                const parameters = resource.Properties.Parameters || {};
                if (parameters) {
                    const otherParameters = this.extractParameters(parameters, true);
                    map.set(resourceKey, otherParameters);
                }
                else {
                    map.set(resourceKey, parameters);
                }
            }
            return map;
        }, new Map());
        return map;
    }
    extractParameters(parameters, excludeObjectType) {
        return Object.keys(parameters).reduce((obj, key) => {
            const addParameter = excludeObjectType ? !(parameters[key] instanceof Object) : parameters[key] instanceof Object;
            if (addParameter) {
                obj[key] = parameters[key];
            }
            return obj;
        }, {});
    }
    async modifyRootStack(template, deleteParameters) {
        Object.keys(template.Resources).map((resourceKey) => {
            const resource = template.Resources[resourceKey];
            if (resource.Type === AWS_CLOUDFORMATION_STACK_TYPE) {
                if (deleteParameters) {
                    const { Parameters, TemplateURL, ...others } = template.Resources[resourceKey].Properties;
                    if (Parameters) {
                        const params = this.extractParameters(Parameters, false);
                        resource.Properties = {
                            ...others,
                            Parameters: params,
                        };
                    }
                    else {
                        resource.Properties = others;
                    }
                }
                else {
                    const { TemplateURL, ...others } = template.Resources[resourceKey].Properties;
                    resource.Properties = others;
                }
            }
        });
        await (0, pre_push_cfn_modifier_1.prePushCfnTemplateModifier)(template);
        template.Description = (0, template_description_utils_1.getDefaultTemplateDescription)(this.context, 'root');
        return template;
    }
    getAuthCognitoResource(resources) {
        return resources.find((resource) => resource.category === AUTH_CATEGORY.NAME && resource.service === AUTH_CATEGORY.SERVICE.COGNITO);
    }
    writeRootStackToPath(template) {
        amplify_cli_core_1.JSONUtilities.writeJson(path.join(this.exportDirectoryPath, 'root-stack-template.json'), template);
    }
    createTemplateUrl(bucketName, fileName, categoryName) {
        const values = ['https://s3.amazonaws.com', cloudform_types_1.Fn.Ref(bucketName).toJSON(), AMPLIFY_CFN_TEMPLATES];
        if (categoryName) {
            values.push(categoryName);
        }
        values.push(fileName);
        return cloudform_types_1.Fn.Join('/', values).toJSON();
    }
}
exports.ResourceExport = ResourceExport;
//# sourceMappingURL=resource-export.js.map