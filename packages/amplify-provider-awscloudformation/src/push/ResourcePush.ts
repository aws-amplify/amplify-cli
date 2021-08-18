import { $TSContext, FeatureFlags, pathManager, stateManager } from 'amplify-cli-core';
import {
  PackagedResourceDefinition,
  ResourceDefinition,
  ResourceDeployType,
  TransformedCfnResource,
  UploadedResourceDefinition,
} from './Types';
import { uploadAppSyncFiles } from '../upload-appsync-files';
import { Constants } from './constants';
import { ResourceDeployer } from './ResourceDeployer';
import * as path from 'path';
import * as fs from 'fs-extra';
import { S3 } from '../aws-utils/aws-s3';
import { getNetworkResourceCfn } from '../utils/env-level-constructs';
import _ from 'lodash';
import { Template } from 'cloudform-types';
import { postPushGraphQLCodegen, prePushGraphQLCodegen } from '../graphql-codegen';
import { DeploymentManager, DeploymentStateManager, runIterativeRollback } from '../iterative-deployment';

export class ResourcePush extends ResourceDeployer {
  constructor(context: $TSContext) {
    super(context, ResourceDeployType.Push);
  }
  // /**
  //  * inits deployment state manager
  //  */
  // async initDeploymentState(): Promise<void> {
  //   this.deploymentStateManager = await DeploymentStateManager.createDeploymentStateManager(this.context);
  // }

  // /**
  //  * checks for iterative rollback is taking place and return true or false
  //  * skips the check if --forcePush or iterativeRollback is false
  //  * @returns boolean
  //  */
  // async canDeploy(): Promise<boolean> {
  //   if (this.deploymentStateManager.isDeploymentInProgress() && !this.deploymentStateManager.isDeploymentFinished()) {
  //     if (this.context.exeInfo?.forcePush || this.context.exeInfo?.iterativeRollback) {
  //       await runIterativeRollback(this.context, this.amplifyMeta, this.deploymentStateManager);
  //       if (this.context.exeInfo?.iterativeRollback) {
  //         return false;
  //       }
  //     }
  //   }
  //   return true;
  // }
  /**
   * Uploads all non cloudformation resouces to the deployment bucket
   * @param packagedResources
   * @param allResources
   * @returns
   */
  async uploadResources(
    packagedResources: PackagedResourceDefinition[],
    allResources: ResourceDefinition[],
  ): Promise<UploadedResourceDefinition[]> {
    const { API_CATEGORY } = Constants;
    await uploadAppSyncFiles(this.context, packagedResources, allResources);

    const uploadedDefinition = await Promise.all(
      packagedResources.map(async packagedResource => {
        if (!packagedResource.build) {
          return packagedResource;
        }

        const { zipFilePath, zipFilename } = packagedResource.packagerParams;
        try {
          const s3Key = `${Constants.AMPLIFY_BUILDS}/${zipFilename}`;
          const s3Bucket = await this.uploadToS3(zipFilePath, s3Key);

          if (packagedResource.category === API_CATEGORY.NAME && packagedResource.service === API_CATEGORY.SERVICE.ELASTIC_CONTAINER) {
            const projectPath = pathManager.findProjectRoot();
            const parameters =
              stateManager.getResourceParametersJson(projectPath, packagedResource.category, packagedResource.resourceName, {
                throwIfNotExist: false,
              }) || {};

            stateManager.setResourceParametersJson(projectPath, packagedResource.category, packagedResource.resourceName, {
              ...parameters,
              ParamZipPath: s3Key,
            });
          } else {
            this.storeS3BucketInfo(packagedResource, s3Bucket);
          }

          return {
            ...packagedResource,
            uploaderParams: {
              s3Bucket,
              s3Key,
            },
          };
        } catch (error) {
          throw error;
        }
      }),
    );

    if (this.resourcesHasContainers(packagedResources)) {
      for await (const file of this.elasticContainerZipFiles) {
        const filePath = path.join(__dirname, '../..', 'resources', file);
        await this.uploadToS3(filePath, file);
      }
    }
    return uploadedDefinition;
  }

  private async uploadToS3(filePath: string, s3Key: string): Promise<string> {
    const s3 = await S3.getInstance(this.context);
    const s3Params = {
      Body: fs.createReadStream(filePath),
      Key: s3Key,
    };
    return await s3.uploadFile(s3Params, false);
  }

  private async uploadObjectToS3(template: object, s3Key: string): Promise<string> {
    const s3 = await S3.getInstance(this.context);
    const s3Params = {
      Body: JSON.stringify(template, null, 2),
      Key: s3Key,
    };
    return await s3.uploadFile(s3Params, false);
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
    for await (const resource of resources) {
      for (const cfnFile of resource.transformedCfnPaths) {
        const fileName = path.parse(cfnFile).base;
        const s3Key = `${AMPLIFY_CFN_TEMPLATES}/${resource.category}/${fileName}`;
        const bucket = await this.uploadToS3(cfnFile, s3Key);
        const templateURL = this.createTemplateUrl(bucket, resource.category, fileName);
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
      const networkDeploymentBucket = await this.uploadObjectToS3(template, key);
      _.set(
        this.amplifyMeta,
        [PROVIDER, PROVIDER_NAME, NETWORK_STACK_S3_URL],
        this.createTemplateUrl(networkDeploymentBucket, NETWORK_STACK_FILENAME),
      );

      const apiGWAuthFile = path.join(pathManager.getBackendDirPath(), API_CATEGORY.NAME, APIGW_AUTH_STACK_FILE_NAME);
      // don't check for the api gateway rest api just check for the consolidated file
      if (fs.existsSync(apiGWAuthFile)) {
        await this.uploadToS3(apiGWAuthFile, `${AMPLIFY_CFN_TEMPLATES}/${API_CATEGORY.NAME}/${APIGW_AUTH_STACK_FILE_NAME}`);
        _.set(
          this.amplifyMeta,
          [PROVIDER, PROVIDER_NAME, API_GATEWAY_AUTH_URL],
          this.createTemplateUrl(networkDeploymentBucket, APIGW_AUTH_STACK_FILE_NAME, API_CATEGORY.NAME),
        );
      }
      const pathToTriggerFile = path.join(pathManager.getBackendDirPath(), AUTH_CATEGORY.NAME, AUTH_CATEGORY.SERVICE.COGNITO);
      if (FeatureFlags.getBoolean('auth.breakCircularDependency') && fs.existsSync(pathToTriggerFile)) {
        await this.uploadToS3(apiGWAuthFile, `${AMPLIFY_CFN_TEMPLATES}/${AUTH_CATEGORY.NAME}/${AUTH_TRIGGER_TEMPLATE_FILE}`);
        _.set(
          this.amplifyMeta,
          [PROVIDER, PROVIDER_NAME, AUTH_TRIGGER_TEMPLATE_URL],
          this.createTemplateUrl(networkDeploymentBucket, AUTH_TRIGGER_TEMPLATE_FILE, AUTH_CATEGORY.NAME),
        );
      }
    }
  }

  async prePush(createResources: ResourceDefinition[], updateResources: ResourceDefinition[]) {
    await prePushGraphQLCodegen(this.context, createResources, updateResources);
  }

  async push(template: Template) {}

  async postPush() {
    await postPushGraphQLCodegen(this.context);
  }
}
