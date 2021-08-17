import { $TSContext, FeatureFlags, JSONUtilities, pathManager } from 'amplify-cli-core';
import { Template, StringParameter } from 'cloudform-types';
import * as fs from 'fs-extra';
import * as path from 'path';
import { Join, Ref } from 'cloudform-types/types/functions';
import { PackagedResourceDefinition, ResourceDeployType, TransformedCfnResource } from '.';
import { Constants } from './constants';
import { ResourceDeployer } from './ResourceDeployer';
import { getNetworkResourceCfn } from '../utils/env-level-constructs';
import _ from 'lodash';
import { CfnBucket } from '@aws-cdk/aws-s3';
export class ResourceExport extends ResourceDeployer {
  exportDirectoryPath: string;
  constructor(context: $TSContext, exportDirectoryPath: string) {
    super(context, ResourceDeployType.Export);
    this.exportDirectoryPath = exportDirectoryPath;
  }
  /**
   * writes packaged files to export directory path
   * For AppSync API it copies the non cloudformation assets
   *
   * @param resources {PackagedResourceDefinition[]}
   */
  async writeResourcesToDestination(resources: PackagedResourceDefinition[]): Promise<void> {
    for (const resource of resources) {
      if (resource.packagerParams) {
        const destinationPath = path.join(
          this.exportDirectoryPath,
          resource.category,
          resource.resourceName,
          Constants.AMPLIFY_BUILDS,
          resource.packagerParams.zipFilename,
        );
        await fs.copyFile(resource.packagerParams.zipFilename, destinationPath);
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
          await fs.copyFile(sourceFolder, destinationFolder);
        }
      }
    }
    // write the pipeline awaiter and
    if (this.resourcesHasContainers(resources)) {
      for (const zipFile of this.elasticContainerZipFiles) {
        const destinationPath = path.join(this.exportDirectoryPath, Constants.AMPLIFY_AUXILIARY_LAMBDAS, zipFile);
        const sourceFile = path.join(__dirname, '../..', 'resources', zipFile);
        fs.copyFile(destinationPath, sourceFile);
      }
    }
  }

  async uploadCloudFormationToS3(resources: TransformedCfnResource[]) {
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
    } = Constants;
    const { StackName: stackName } = this.amplifyMeta;
    const bucket = 'dummys3DeploymnetBucket';

    for await (const resource of resources) {
      for (const cfnFile of resource.transformedCfnPaths) {
        const fileName = path.parse(cfnFile).base;
        const templateURL = this.createTemplateUrl(bucket, resource.category, fileName);
        const destination = path.join(this.exportDirectoryPath, resource.category, resource.resourceName, fileName);
        await fs.copyFile(cfnFile, destination);
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
        await fs.copyFile(apiGWAuthFile, destination);
        _.set(
          this.amplifyMeta,
          [PROVIDER, PROVIDER_NAME, API_GATEWAY_AUTH_URL],
          this.createTemplateUrl(bucket, APIGW_AUTH_STACK_FILE_NAME, API_CATEGORY.NAME),
        );
      }
      const pathToTriggerFile = path.join(pathManager.getBackendDirPath(), AUTH_CATEGORY.NAME, AUTH_CATEGORY.SERVICE.COGNITO);
      if (FeatureFlags.getBoolean('auth.breakCircularDependency') && fs.existsSync(pathToTriggerFile)) {
        const destination = path.join(this.exportDirectoryPath, AUTH_CATEGORY.NAME, AUTH_TRIGGER_TEMPLATE_FILE);
        await fs.copyFile(pathToTriggerFile, destination);
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
  extractParametersFromRootStack(template: Template): Map<string, { [key: string]: any } | undefined> {
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
   * Modifies the template to modify the template URL to accept the remove bucketName and delete the parameters
   * @param template {Template}
   * @returns {Template}
   */
  modifyRootStack(template: Template): Template {
    const { DeploymentBucketName } = this.amplifyMeta[Constants.PROVIDER_NAME];
    Object.keys(template.Resources).map(resourceKey => {
      const resource = template.Resources[resourceKey];
      if (resource.Type === Constants.AWS_CLOUDFORMATION_STACK_TYPE) {
        // remove template url parameters will set it in the construct
        const { TemplateURL, Parameters, ...others } = template.Resources[resourceKey].Properties;
        resource.Properties = { ...others };
      }
    });
    template.Parameters['externalDeploymentBucketName'] = new StringParameter({
      Default: DeploymentBucketName,
      Description: 'Bucket used when export is called',
    });
    return template;
  }

  async writeRootStackToPath(template: Template) {
    await fs.writeFile(path.join(this.exportDirectoryPath, 'root-stack-template.json'), template);
  }
}
