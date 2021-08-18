import { $TSContext, FeatureFlags, JSONUtilities, pathManager } from 'amplify-cli-core';
import { Template, StringParameter } from 'cloudform-types';
import * as fs from 'fs-extra';
import * as path from 'path';
import { DeploymentResources, PackagedResourceDefinition, ResourceDeployType, TransformedCfnResource } from './Types';
import { Constants } from './constants';
import { ResourceDeployer } from './ResourceDeployer';
import { getNetworkResourceCfn } from '../utils/env-level-constructs';
import _ from 'lodash';
import { preProcessCFNTemplate } from '../pre-push-cfn-processor/cfn-pre-processor';
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
    await this.writeResourcesToDestination(postPackageResources);
    return postPackageResources;
  }

  async generateAndTransformCfnResources(packagedResources: PackagedResourceDefinition[]): Promise<TransformedCfnResource[]> {
    await this.generateCategoryCloudFormation(packagedResources);
    const transformedCfnResources = await this.postGenerateCategoryCloudFormation(packagedResources);
    await this.writeCategoryCloudFormation(transformedCfnResources);
    return transformedCfnResources;
  }

  async generateAndWriteRootStack(): Promise<Map<string, { [key: string]: any }>> {
    const template = await this.generateRootStack();
    const parameters = this.extractParametersFromRootStack(template);
    const modifiedTemplate = this.modifyRootStack(template);
    this.writeRootStackToPath(modifiedTemplate);
    return parameters;
  }

  /**
   * writes packaged files to export directory path
   * For AppSync API it copies the non cloudformation assets
   *
   * @param resources {PackagedResourceDefinition[]}
   */
  private async writeResourcesToDestination(resources: PackagedResourceDefinition[]): Promise<void> {
    for (const resource of resources) {
      if (resource.packagerParams) {
        const destinationDir = path.join(
          this.exportDirectoryPath,
          resource.category,
          resource.resourceName,
          Constants.AMPLIFY_BUILDS,
          resource.packagerParams.zipFilename,
        );
        const destinationPath = path.join(destinationDir);
        await this.copyResource(resource.packagerParams.zipFilePath, destinationPath);
      }
      // copy build directory for appsync
      if (resource.category === Constants.API_CATEGORY.NAME && resource.service === Constants.API_CATEGORY.SERVICE.APP_SYNC) {
        const backendFolder = pathManager.getBackendDirPath();
        const foldersToCopy = ['functions', 'pipelineFunctions', 'resolvers', 'schema.graphql'];
        for (const folder of foldersToCopy) {
          const sourceFolder = path.join(backendFolder, resource.category, resource.resourceName, Constants.APPSYNC_BUILD_FOLDER, folder);
          const destinationFolder = path.join(
            this.exportDirectoryPath,
            resource.category,
            resource.resourceName,
            Constants.AMPLIFY_APPSYNC_FILES,
            folder,
          );
          await this.copyResource(sourceFolder, destinationFolder);
        }
      }

      if (resource.category === Constants.AUTH_CATEGORY.NAME && resource.service === Constants.AUTH_CATEGORY.SERVICE.COGNITO) {
        const authResourceBackend = path.join(pathManager.getBackendDirPath(), resource.category, resource.resourceName);
        const authResourceAssets = path.join(authResourceBackend, Constants.AUTH_ASSETS);
        if (fs.existsSync(authResourceAssets)) {
          const destinationPath = path.join(
            this.exportDirectoryPath,
            resource.category,
            resource.resourceName,
            Constants.AMPLIFY_AUTH_ASSETS,
          );
          await this.copyResource(authResourceAssets, destinationPath);
        }
      }
    }
    // write the pipeline awaiter and
    if (this.resourcesHasContainers(resources)) {
      for (const zipFile of this.elasticContainerZipFiles) {
        const destinationPath = path.join(this.exportDirectoryPath, Constants.AMPLIFY_AUXILIARY_LAMBDAS, zipFile);
        const sourceFile = path.join(__dirname, '../..', 'resources', zipFile);
        await this.copyResource(sourceFile, destinationPath);
      }
    }
  }

  private async copyResource(sourcePath: string, destinationPath: string) {
    let dir = destinationPath;
    // if there is an extension then get the dir path
    // extension points to the fact that
    if (path.extname(destinationPath)) {
      dir = path.dirname(destinationPath);
    }
    await fs.ensureDir(dir);

    await fs.copy(sourcePath, destinationPath, { overwrite: true, preserveTimestamps: true, recursive: true });
  }

  private async writeCategoryCloudFormation(resources: TransformedCfnResource[]) {
    const {
      API_CATEGORY,
      AUTH_CATEGORY,
      AMPLIFY_CFN_TEMPLATES,
      PROVIDER_METADATA,
      NETWORK_STACK_S3_URL,
      AUTH_TRIGGER_TEMPLATE_FILE,
      AUTH_TRIGGER_TEMPLATE_URL,
      API_GATEWAY_AUTH_URL,
      APIGW_AUTH_STACK_FILE_NAME,
      NETWORK_STACK_FILENAME,
      PROVIDER_NAME,
      PROVIDER,
      APPSYNC_STACK_FOLDER,
      APPSYNC_BUILD_FOLDER,
    } = Constants;
    const { StackName: stackName } = this.amplifyMeta[PROVIDER][PROVIDER_NAME];
    const bucket = 'dummys3DeploymnetBucket';

    for await (const resource of resources) {
      for (const cfnFile of resource.transformedCfnPaths) {
        const fileName = path.parse(cfnFile).base;
        const templateURL = this.createTemplateUrl(bucket, resource.category, fileName);
        let destination = path.join(this.exportDirectoryPath, resource.category, resource.resourceName, fileName);
        //if nested stack of a nested stack
        if (cfnFile.includes(`${APPSYNC_BUILD_FOLDER}/${APPSYNC_STACK_FOLDER}/`)) {
          destination = path.join(this.exportDirectoryPath, resource.category, resource.resourceName, APPSYNC_STACK_FOLDER, fileName);
        }
        this.copyResource(cfnFile, destination);
        _.set(this.amplifyMeta, [resource.category, resource.resourceName, PROVIDER_METADATA], {
          s3TemplateUrl: templateURL,
          logicalId: resource.category + resource.resourceName,
        });
      }
    }
    if (this.resourcesHasContainers(resources)) {
      // create network resouce
      const template = await getNetworkResourceCfn(this.context, stackName);
      const key = `${AMPLIFY_CFN_TEMPLATES}/${NETWORK_STACK_FILENAME}`;
      JSONUtilities.writeJson(path.join(this.exportDirectoryPath, AMPLIFY_CFN_TEMPLATES, NETWORK_STACK_FILENAME), template);
      _.set(this.amplifyMeta, [PROVIDER, PROVIDER_NAME, NETWORK_STACK_S3_URL], this.createTemplateUrl(bucket, NETWORK_STACK_FILENAME));

      const apiGWAuthFile = path.join(pathManager.getBackendDirPath(), API_CATEGORY.NAME, APIGW_AUTH_STACK_FILE_NAME);
      // don't check for the api gateway rest api just check for the consolidated file
      if (fs.existsSync(apiGWAuthFile)) {
        const destination = path.join(this.exportDirectoryPath, AUTH_CATEGORY.NAME, APIGW_AUTH_STACK_FILE_NAME);
        await this.copyResource(apiGWAuthFile, destination);
        _.set(
          this.amplifyMeta,
          [PROVIDER, PROVIDER_NAME, API_GATEWAY_AUTH_URL],
          this.createTemplateUrl(bucket, APIGW_AUTH_STACK_FILE_NAME, API_CATEGORY.NAME),
        );
      }
      const pathToTriggerFile = path.join(pathManager.getBackendDirPath(), AUTH_CATEGORY.NAME, AUTH_CATEGORY.SERVICE.COGNITO);
      if (FeatureFlags.getBoolean('auth.breakCircularDependency') && fs.existsSync(pathToTriggerFile)) {
        const destination = path.join(this.exportDirectoryPath, AUTH_CATEGORY.NAME, AUTH_TRIGGER_TEMPLATE_FILE);
        await this.copyResource(pathToTriggerFile, destination);
        _.set(
          this.amplifyMeta,
          [PROVIDER, PROVIDER_NAME, AUTH_TRIGGER_TEMPLATE_URL],
          this.createTemplateUrl(bucket, AUTH_TRIGGER_TEMPLATE_FILE, AUTH_CATEGORY.NAME),
        );
      }
    }
  }

  /**
   * Extracts stack parameters from root stack and return parameters
   * @param root stack template {Template}
   * @returns {Map<string, { [key: string]: any } | undefined>} by stackName and parameters
   */
  private extractParametersFromRootStack(template: Template): Map<string, { [key: string]: any } | undefined> {
    const map = Object.keys(template.Resources).reduce((map, resourceKey) => {
      const resource = template.Resources[resourceKey];
      if (resource.Type === Constants.AWS_CLOUDFORMATION_STACK_TYPE) {
        map.set(resourceKey, resource.Properties.Parameters);
      }
      return map;
    }, new Map<string, { [key: string]: any } | undefined>());
    return map;
  }

  /**
   * Modifies the template to modify the template URL to accept the  and delete the parameters
   * @param template {Template}
   * @returns {Template}
   */
  private modifyRootStack(template: Template): Template {
    const { PROVIDER, PROVIDER_NAME } = Constants;
    const { DeploymentBucketName } = this.amplifyMeta[PROVIDER][PROVIDER_NAME];
    Object.keys(template.Resources).map(resourceKey => {
      const resource = template.Resources[resourceKey];
      if (resource.Type === Constants.AWS_CLOUDFORMATION_STACK_TYPE) {
        // remove url parameters will set it in the construct
        const { Parameters, ...others } = template.Resources[resourceKey].Properties;
        resource.Properties = { ...others };
      }
    });
    template.Parameters['externalDeploymentBucketName'] = new StringParameter({
      Default: DeploymentBucketName,
      Description: 'Bucket used when export is called',
    });
    return template;
  }

  private writeRootStackToPath(template: Template) {
    JSONUtilities.writeJson(path.join(this.exportDirectoryPath, 'root-stack-template.json'), template);
  }
}
