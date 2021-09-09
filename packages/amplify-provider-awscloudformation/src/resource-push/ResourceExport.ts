import {
  $TSContext,
  CFNTemplateFormat,
  FeatureFlags,
  JSONUtilities,
  pathManager,
  readCFNTemplate,
  stateManager,
  writeCFNTemplate,
} from 'amplify-cli-core';
import { Template, Fn } from 'cloudform-types';
import * as fs from 'fs-extra';
import * as path from 'path';
import {
  DeploymentResources,
  PackagedResourceDefinition,
  ResourceDefinition,
  ResourceDeployType,
  StackParameters,
  TransformedCfnResource,
} from './Types';
import { Constants } from './constants';
import { ResourceDeployer } from './ResourceDeployer';
import { getNetworkResourceCfn } from '../utils/env-level-constructs';
import _ from 'lodash';
import { AUTH_TRIGGER_STACK } from '../utils/upload-auth-trigger-template';
import { S3 } from '../aws-utils/aws-s3';
import { downloadZip } from '../zip-util';
import { Ref } from 'cloudform-types/types/functions';
const {
  API_CATEGORY,
  AUTH_CATEGORY,
  FUNCTION_CATEGORY,
  AMPLIFY_CFN_TEMPLATES,
  AMPLIFY_APPSYNC_FILES,
  PROVIDER_METADATA,
  NETWORK_STACK_S3_URL,
  AUTH_TRIGGER_TEMPLATE_FILE,
  AUTH_TRIGGER_TEMPLATE_URL,
  API_GATEWAY_AUTH_URL,
  APIGW_AUTH_STACK_FILE_NAME,
  APPSYNC_STACK_FOLDER,
  APPSYNC_BUILD_FOLDER,
  NETWORK_STACK_FILENAME,
  PROVIDER_NAME,
  PROVIDER,
  AMPLIFY_BUILDS,
  AUTH_ASSETS,
  AMPLIFY_AUXILIARY_LAMBDAS,
  AWS_CLOUDFORMATION_STACK_TYPE,
  AMPLIFY_AUTH_ASSETS,
  NETWORK_STACK_LOGICAL_ID,
  APIGW_AUTH_STACK_LOGICAL_ID,
} = Constants;
export class ResourceExport extends ResourceDeployer {
  exportDirectoryPath: string;
  constructor(context: $TSContext, exportDirectoryPath: string) {
    super(context, ResourceDeployType.Export);
    this.exportDirectoryPath = exportDirectoryPath;
  }

  async packageBuildWriteResources(deploymentResources: DeploymentResources): Promise<PackagedResourceDefinition[]> {
    const resources = await this.filterResourcesToBeDeployed(deploymentResources);
    const preBuiltResources = await this.preBuildResources(resources);
    const builtResources = await this.buildResources(preBuiltResources);
    const packagedResources = await this.packageResources(builtResources);
    const postPackageResources = await this.postPackageResource(packagedResources);
    return postPackageResources;
  }

  async generateAndTransformCfnResources(
    packagedResources: PackagedResourceDefinition[],
  ): Promise<{ transformedResources: TransformedCfnResource[]; stackParameters: StackParameters }> {
    await this.generateCategoryCloudFormation(packagedResources);
    const transformedCfnResources = await this.postGenerateCategoryCloudFormation(packagedResources);
    const stackParameters = await this.writeCategoryCloudFormation(transformedCfnResources);
    return { transformedResources: transformedCfnResources, stackParameters };
  }

  /**
   * The parameters are going to need to be read from the parameters json since the types are fixed there
   * @param transformedCfnResources
   * @param stackParameters
   * @returns
   */
  fixNestedStackParameters(transformedCfnResources: TransformedCfnResource[], stackParameters: StackParameters): StackParameters {
    const projectPath = pathManager.findProjectRoot();
    const { StackName: rootstackName } = this.amplifyMeta[PROVIDER][PROVIDER_NAME];
    const nestedStack = stackParameters[rootstackName].nestedStacks;
    for (const resource of transformedCfnResources) {
      const fileParameters = stateManager.getResourceParametersJson(projectPath, resource.category, resource.resourceName, {
        default: {},
        throwIfNotExist: false,
      });
      const nestedStackName = resource.category + resource.resourceName;
      const usedParameters = nestedStack[nestedStackName].parameters;
      Object.keys(usedParameters).forEach(paramKey => {
        if (paramKey in fileParameters) {
          usedParameters[paramKey] = fileParameters[paramKey];
        }
      });
    }
    return stackParameters;
  }

  async generateAndWriteRootStack(stackParameters: StackParameters): Promise<StackParameters> {
    const { StackName: stackName, AuthRoleName, UnauthRoleName, DeploymentBucketName } = this.amplifyMeta[PROVIDER][PROVIDER_NAME];
    const template = await this.generateRootStack();
    const parameters = this.extractParametersFromTemplateNestedStack(template);
    const modifiedTemplate = this.modifyRootStack(template, true);
    this.writeRootStackToPath(modifiedTemplate);
    stackParameters[stackName].destination = path.join(this.exportDirectoryPath, 'root-stack-template.json');

    [...parameters.keys()].forEach((key: string) => {
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

  /**
   * writes packaged files to export directory path
   * For AppSync API it copies the non cloudformation assets
   *
   * @param resources {PackagedResourceDefinition[]}
   */
  async writeResourcesToDestination(resources: PackagedResourceDefinition[]): Promise<void> {
    for (const resource of resources) {
      if (resource.packagerParams && resource.packagerParams.newPackageCreated) {
        const destinationPath = path.join(
          this.exportDirectoryPath,
          resource.category,
          resource.resourceName,
          AMPLIFY_BUILDS,
          resource.packagerParams.zipFilename,
        );
        await this.copyResource(resource.packagerParams.zipFilePath, destinationPath);
      }
      if (resource.category === FUNCTION_CATEGORY.NAME && resource.service === FUNCTION_CATEGORY.SERVICE.LAMBDA_LAYER) {
        await this.downloadLambdaLayerContent(resource);
      }
      // copy build directory for appsync
      if (resource.category === API_CATEGORY.NAME && resource.service === API_CATEGORY.SERVICE.APP_SYNC) {
        const backendFolder = pathManager.getBackendDirPath();
        const foldersToCopy = ['functions', 'pipelineFunctions', 'resolvers', 'stacks', 'schema.graphql'];
        for (const folder of foldersToCopy) {
          const sourceFolder = path.join(backendFolder, resource.category, resource.resourceName, APPSYNC_BUILD_FOLDER, folder);
          const destinationFolder = path.join(
            this.exportDirectoryPath,
            resource.category,
            resource.resourceName,
            AMPLIFY_APPSYNC_FILES,
            folder,
          );
          await this.copyResource(sourceFolder, destinationFolder);
        }
      }

      if (resource.category === AUTH_CATEGORY.NAME && resource.service === AUTH_CATEGORY.SERVICE.COGNITO) {
        const authResourceBackend = path.join(pathManager.getBackendDirPath(), resource.category, resource.resourceName);
        const authResourceAssets = path.join(authResourceBackend, AUTH_ASSETS);
        if (fs.existsSync(authResourceAssets)) {
          const destinationPath = path.join(this.exportDirectoryPath, resource.category, resource.resourceName, AMPLIFY_AUTH_ASSETS);
          await this.copyResource(authResourceAssets, destinationPath);
        }
      }
    }
    // write the pipeline awaiter and
    if (this.resourcesHasContainers(resources)) {
      for (const zipFile of this.elasticContainerZipFiles) {
        const destinationPath = path.join(this.exportDirectoryPath, AMPLIFY_AUXILIARY_LAMBDAS, zipFile);
        const sourceFile = path.join(__dirname, '../..', 'resources', zipFile);
        await this.copyResource(sourceFile, destinationPath);
      }
    }
  }
  /**
   * Download content for past layer versions
   * @param resource
   */
  private async downloadLambdaLayerContent(resource: PackagedResourceDefinition) {
    const backendDir = pathManager.getBackendDirPath();
    const cfnFilePath = path.join(
      backendDir,
      resource.category,
      resource.resourceName,
      `${resource.resourceName}-awscloudformation-template.json`,
    );
    const template = JSONUtilities.readJson<Template>(cfnFilePath);
    const layerVersions = Object.keys(template.Resources).reduce((array, resourceKey) => {
      const layerVersionResource = template.Resources[resourceKey];
      if (layerVersionResource.Type === 'AWS::Lambda::LayerVersion') {
        const path = _.get(layerVersionResource.Properties, ['Content', 'S3Key']);
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
      const s3instance = await S3.getInstance(this.context);
      for await (const lambdaLayer of layerVersions) {
        const exportPath = path.join(this.exportDirectoryPath, resource.category, resource.resourceName);
        await downloadZip(s3instance, exportPath, lambdaLayer.contentPath, this.envInfo.envName);
        //await downloadZip(s3instance, exportPath, );
      }
    }
  }

  private async processAndWriteCfn(cfnFile: string, destinationPath: string, deleteParameters: boolean = true) {
    const { cfnTemplate, templateFormat } = await readCFNTemplate(cfnFile);
    return await this.processAndWriteCfnTemplate(cfnTemplate, destinationPath, templateFormat, deleteParameters);
  }

  private async processAndWriteCfnTemplate(
    cfnTemplate: Template,
    destinationPath: string,
    templateFormat: CFNTemplateFormat,
    deleteParameters: boolean,
  ) {
    const parameters = this.extractParametersFromTemplateNestedStack(cfnTemplate);
    const template = this.modifyRootStack(cfnTemplate, deleteParameters);
    await writeCFNTemplate(template, destinationPath, { templateFormat });
    return parameters;
  }

  private async copyResource(sourcePath: string, destinationPath: string) {
    let dir = destinationPath;
    // if there is an extension then get the dir path
    // extension points to the fact that it's a file
    if (path.extname(destinationPath)) {
      dir = path.dirname(destinationPath);
    }
    await fs.ensureDir(dir);

    await fs.copy(sourcePath, destinationPath, { overwrite: true, preserveTimestamps: true, recursive: true });
  }

  private async writeCategoryCloudFormation(resources: TransformedCfnResource[]): Promise<StackParameters> {
    const { StackName: stackName } = this.amplifyMeta[PROVIDER][PROVIDER_NAME];
    const bucket = 'externalDeploymentBucketName';
    const stackParameters: StackParameters = {};
    stackParameters[stackName] = {
      destination: 'dummyPath', // is going to be populated when root stack is being written,
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
        // only expose nested stack for GraphQL API
        if (resource.category === API_CATEGORY.NAME && resource.service === API_CATEGORY.SERVICE.APP_SYNC) {
          const parameters = await this.processAndWriteCfn(cfnFile, destination, false);

          [...parameters.keys()].forEach(key => {
            const nestedStackPath = path.join(
              this.exportDirectoryPath,
              resource.category,
              resource.resourceName,
              AMPLIFY_APPSYNC_FILES,
              APPSYNC_STACK_FOLDER,
              key === 'CustomResourcesjson' ? 'CustomResources.json' : `${key}.json`,
            );

            nestedStack.nestedStacks[key] = {
              destination: nestedStackPath,
              nestedStacks: {},
            };
          });
        } else if (resource.category === FUNCTION_CATEGORY.NAME && resource.service === FUNCTION_CATEGORY.SERVICE.LAMBDA_LAYER) {
          const { cfnTemplate, templateFormat } = await readCFNTemplate(cfnFile);
          Object.keys(cfnTemplate.Resources)
            .filter(key => cfnTemplate.Resources[key].Type === 'AWS::Lambda::LayerVersion')
            .forEach(layerVersionResourceKey => {
              const layerVersionResource = cfnTemplate.Resources[layerVersionResourceKey];
              const s3Key = _.get(layerVersionResource.Properties, ['Content', 'S3Key']);

              layerVersionResource.Properties['Content']['S3Key'] = Fn.Join('/', [
                Ref('s3Key'),
                typeof s3Key === 'string' ? path.basename(s3Key) : resource.packagerParams.zipFilename,
              ]);
            });
          await this.processAndWriteCfnTemplate(cfnTemplate, destination, templateFormat, false);
        } else {
          this.copyResource(cfnFile, destination);
        }
        stackParameters[stackName].nestedStacks[logicalId] = nestedStack;

        _.set(this.amplifyMeta, [resource.category, resource.resourceName, PROVIDER_METADATA], {
          s3TemplateURL: templateURL,
          logicalId,
        });
      }
    }

    if (this.resourcesHasContainers(resources)) {
      // create network resouce
      const template = (await getNetworkResourceCfn(this.context, stackName)) as Template;
      const destinationPath = path.join(this.exportDirectoryPath, AMPLIFY_CFN_TEMPLATES, NETWORK_STACK_FILENAME);
      stackParameters[stackName].nestedStacks[NETWORK_STACK_LOGICAL_ID] = {
        destination: destinationPath,
      };
      JSONUtilities.writeJson(destinationPath, template);
      _.set(this.amplifyMeta, [PROVIDER, PROVIDER_NAME, NETWORK_STACK_S3_URL], this.createTemplateUrl(bucket, NETWORK_STACK_FILENAME));

      const apiGWAuthFile = path.join(pathManager.getBackendDirPath(), API_CATEGORY.NAME, APIGW_AUTH_STACK_FILE_NAME);
      // don't check for the api gateway rest api just check for the consolidated file
      if (fs.existsSync(apiGWAuthFile)) {
        const destination = path.join(this.exportDirectoryPath, AUTH_CATEGORY.NAME, APIGW_AUTH_STACK_FILE_NAME);
        stackParameters[stackName].nestedStacks[APIGW_AUTH_STACK_LOGICAL_ID] = {
          destination: destination,
        };
        await this.copyResource(apiGWAuthFile, destination);
        _.set(
          this.amplifyMeta,
          [PROVIDER, PROVIDER_NAME, API_GATEWAY_AUTH_URL],
          this.createTemplateUrl(bucket, APIGW_AUTH_STACK_FILE_NAME, API_CATEGORY.NAME),
        );
      }
    }

    const authResource = this.getAuthCognitoResource(resources);
    if (FeatureFlags.getBoolean('auth.breakCircularDependency') && authResource) {
      const pathToTriggerFile = path.join(
        pathManager.getBackendDirPath(),
        AUTH_CATEGORY.NAME,
        authResource.resourceName,
        AUTH_TRIGGER_TEMPLATE_FILE,
      );
      if (fs.existsSync(pathToTriggerFile)) {
        const destination = path.join(this.exportDirectoryPath, AUTH_CATEGORY.NAME, AUTH_TRIGGER_TEMPLATE_FILE);
        stackParameters[stackName].nestedStacks[AUTH_TRIGGER_STACK] = {
          destination: destination,
        };
        await this.copyResource(pathToTriggerFile, destination);
        _.set(
          this.amplifyMeta,
          [PROVIDER, PROVIDER_NAME, AUTH_TRIGGER_TEMPLATE_URL],
          this.createTemplateUrl(bucket, AUTH_TRIGGER_TEMPLATE_FILE, AUTH_CATEGORY.NAME),
        );
      }
    }
    return stackParameters;
  }

  /**
   * Extracts stack parameters from root stack and return parameters
   * @param root stack template {Template}
   * @returns {Map<string, { [key: string]: any } | undefined>} by stackName and parameters
   */
  private extractParametersFromTemplateNestedStack(template: Template): Map<string, { [key: string]: any } | undefined> {
    const map = Object.keys(template.Resources).reduce((map, resourceKey) => {
      const resource = template.Resources[resourceKey];
      if (resource.Type === AWS_CLOUDFORMATION_STACK_TYPE) {
        const parameters = resource.Properties.Parameters || {};
        if (parameters) {
          const otherParameters = this.extractParameters(parameters, true);
          map.set(resourceKey, otherParameters);
        } else {
          map.set(resourceKey, parameters);
        }
      }
      return map;
    }, new Map<string, { [key: string]: any } | undefined>());
    return map;
  }

  private extractParameters(parameters: any, excludeObjectType: boolean) {
    return Object.keys(parameters).reduce((obj, key) => {
      const addParameter = excludeObjectType ? !(parameters[key] instanceof Object) : parameters[key] instanceof Object;
      if (addParameter) {
        obj[key] = parameters[key];
      }
      return obj;
    }, {});
  }

  /**
   * Modifies the template to remove some parameters and template url
   * @param template {Template}
   * @returns {Template}
   */
  private modifyRootStack(template: Template, deleteParameters: boolean): Template {
    Object.keys(template.Resources).map(resourceKey => {
      const resource = template.Resources[resourceKey];
      if (resource.Type === AWS_CLOUDFORMATION_STACK_TYPE) {
        // remove url parameters will set it in the construct
        // remove template URL the stack, CDK will update the URL
        if (deleteParameters) {
          const { Parameters, TemplateURL, ...others } = template.Resources[resourceKey].Properties;
          if (Parameters) {
            const params = this.extractParameters(Parameters, false);
            resource.Properties = {
              ...others,
              Parameters: params,
            };
          } else {
            resource.Properties = others;
          }
        } else {
          const { TemplateURL, ...others } = template.Resources[resourceKey].Properties;
          resource.Properties = others;
        }
      }
    });
    return template;
  }

  private getAuthCognitoResource(resources: ResourceDefinition[]): ResourceDefinition | undefined {
    return resources.find(resource => resource.category === AUTH_CATEGORY.NAME && resource.service === AUTH_CATEGORY.SERVICE.COGNITO);
  }

  private writeRootStackToPath(template: Template) {
    JSONUtilities.writeJson(path.join(this.exportDirectoryPath, 'root-stack-template.json'), template);
  }

  private createTemplateUrl(bucketName: string, fileName: string, categoryName?: string): { [x: string]: any } {
    const values = ['https://s3.amazonaws.com', Fn.Ref(bucketName).toJSON(), AMPLIFY_CFN_TEMPLATES];
    if (categoryName) {
      values.push(categoryName);
    }
    values.push(fileName);
    return Fn.Join('/', values).toJSON();
  }
}
