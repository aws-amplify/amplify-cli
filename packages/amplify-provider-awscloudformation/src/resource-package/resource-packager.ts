import {
  $TSContext,
  $TSMeta,
  $TSObject,
  $TSTeamProviderInfo,
  pathManager,
  readCFNTemplate,
  stateManager,
  writeCFNTemplate,
  spinner,
  $TSAny,
  ApiCategoryFacade,
} from '@aws-amplify/amplify-cli-core';
import _ from 'lodash';
import { Fn, Template } from 'cloudform-types';
import * as path from 'path';
import { legacyLayerMigration, prePushLambdaLayerPrompt } from '../lambdaLayerInvocations';
// eslint-disable-next-line import/no-cycle
import { formNestedStack, getCfnFiles, updateStackForAPIMigration } from '../push-resources';
import { ensureValidFunctionModelDependencies } from '../utils/remove-dependent-function';
import { Constants } from './constants';
import { consolidateApiGatewayPolicies } from '../utils/consolidate-apigw-policies';
import { prePushAuthTransform } from '../auth-transform';
import { preProcessCFNTemplate, writeCustomPoliciesToCFNTemplate } from '../pre-push-cfn-processor/cfn-pre-processor';
import {
  DeploymentResources,
  ResourceDefinition,
  ResourceDeployType,
  BuiltResourceDefinition,
  PackagedResourceDefinition,
  PackagerParams,
  UploadedResourceDefinition,
  TransformedCfnResource,
} from './types';
// eslint-disable-next-line import/no-cycle
import { prePushTemplateDescriptionHandler } from '../template-description-utils';

/**
 * Abstract class that holds logic for building, packaging and cfn generation
 * The motive of this class is to be extended by any future workflows that would require this
 */
export abstract class ResourcePackager {
  protected elasticContainerZipFiles: string[];
  protected context: $TSContext;
  protected amplifyMeta: $TSMeta;
  private amplifyTeamProviderInfo: $TSTeamProviderInfo;
  protected envInfo: { envName: string };
  deployType: ResourceDeployType;
  private getResourcesToBeDeployed = ({
    allResources,
    resourcesToBeCreated,
    resourcesToBeUpdated,
  }: DeploymentResources): ResourceDefinition[] =>
    !!this.context?.exeInfo?.forcePush || this.deployType === ResourceDeployType.Export
      ? allResources.filter((resource) => resource.category !== 'providers' && resource.providerPlugin === 'awscloudformation')
      : resourcesToBeCreated.concat(resourcesToBeUpdated);

  constructor(context: $TSContext, deployType: ResourceDeployType) {
    this.context = context;
    this.elasticContainerZipFiles = ['custom-resource-pipeline-awaiter-18.zip', 'codepipeline-action-buildspec-generator-lambda.zip'];
    const projectPath = pathManager.findProjectRoot();
    this.amplifyMeta = stateManager.getMeta(projectPath);
    this.amplifyTeamProviderInfo = stateManager.getTeamProviderInfo(projectPath);
    this.envInfo = stateManager.getLocalEnvInfo(projectPath);
    this.deployType = deployType;
  }

  /**
   * Performs any filtering of resources that has to be deployed
   * 1. Filters dependent functions if @model{Table} is deleted
   * 2. Set the api resource 'lastPackageTimeStamp' as undefined
   */
  protected async filterResourcesToBeDeployed(deploymentResources: DeploymentResources): Promise<ResourceDefinition[]> {
    const resources = this.getResourcesToBeDeployed(deploymentResources);
    const { API_CATEGORY } = Constants;

    const apiResourceToBeUpdated = this.filterResourceByCategoryService(
      deploymentResources.resourcesToBeUpdated,
      API_CATEGORY.NAME,
      API_CATEGORY.SERVICE.APP_SYNC,
    );
    if (apiResourceToBeUpdated.length) {
      const functionResourceToBeUpdated = await ensureValidFunctionModelDependencies(
        this.context,
        apiResourceToBeUpdated,
        deploymentResources.allResources as $TSObject[],
      );
      if (functionResourceToBeUpdated !== undefined && functionResourceToBeUpdated.length > 0) {
        return _.uniqBy(resources.concat(functionResourceToBeUpdated.map((r) => r as ResourceDefinition)), 'resourceName');
      }
    }

    return resources;
  }

  /**
   * This function is the step before packaging the non cloudformation resources
   * any changes to be made to the code or final changes are made here
   */
  protected async preBuildResources(resources: ResourceDefinition[]): Promise<ResourceDefinition[]> {
    const { FUNCTION_CATEGORY } = Constants;
    for await (const lambdaLayerResource of this.filterResourceByCategoryService(
      resources,
      FUNCTION_CATEGORY.NAME,
      FUNCTION_CATEGORY.SERVICE.LAMBDA_LAYER,
    )) {
      await legacyLayerMigration(this.context, lambdaLayerResource.resourceName);
    }
    spinner.stop();
    await prePushLambdaLayerPrompt(this.context, resources);
    spinner.start();
    return resources;
  }

  /**
   * Builds resources and transforms the resources to include 'lastBuildTimeStamp'
   */
  protected async buildResources(resources: ResourceDefinition[]): Promise<BuiltResourceDefinition[]> {
    const { FUNCTION_CATEGORY, API_CATEGORY } = Constants;
    return Promise.all(
      resources.map(async (resource): Promise<BuiltResourceDefinition> => {
        if (!resource.build) {
          return resource;
        }
        if (resource.category === API_CATEGORY.NAME && resource.service === API_CATEGORY.SERVICE.ELASTIC_CONTAINER) {
          // eslint-disable-next-line no-param-reassign
          (resource as $TSAny).lastPackageTimeStamp = undefined;
        }

        const lastBuildTimeStamp: string | Date = await this.context.amplify.invokePluginMethod(
          this.context,
          FUNCTION_CATEGORY.NAME,
          resource.service,
          'buildResource',
          [this.context, resource],
        );
        return {
          ...resource,
          lastBuildTimeStamp,
        };
      }),
    );
  }

  /**
   * zips built project and saves it in dist
   * @param builtResources {BuiltResourceDefinition[]}
   * @returns resources with params for packaging {PackagedResourceDefinition[]}
   */
  protected async packageResources(builtResources: BuiltResourceDefinition[]): Promise<PackagedResourceDefinition[]> {
    const { FUNCTION_CATEGORY } = Constants;
    return Promise.all(
      builtResources.map(async (resource) => {
        if (!resource.build) {
          return resource;
        }
        const result: PackagerParams = await this.context.amplify.invokePluginMethod(
          this.context,
          FUNCTION_CATEGORY.NAME,
          resource.service,
          'packageResource',
          [this.context, resource, true],
        );
        return {
          ...resource,
          packagerParams: result,
        };
      }),
    );
  }

  /**
   * Changes that need to be made after packaging takes place
   */
  protected async postPackageResource(packagedResources: PackagedResourceDefinition[]): Promise<PackagedResourceDefinition[]> {
    const { options } = this.context.parameters;
    const { API_CATEGORY } = Constants;
    if (this.resourcesHasCategoryService(packagedResources, API_CATEGORY.NAME, API_CATEGORY.SERVICE.APP_SYNC)) {
      await ApiCategoryFacade.transformGraphQLSchema(this.context, {
        handleMigration: (opts) => updateStackForAPIMigration(this.context, 'api', undefined, opts),
        minify: options.minify,
      });
    }
    return packagedResources;
  }

  /**
   * Checks if the project has Containers API resource
   */
  protected resourcesHasContainers(packagedResources: PackagedResourceDefinition[]): boolean {
    const { API_CATEGORY, HOSTING_CATEGORY } = Constants;
    return (
      this.resourcesHasCategoryService(packagedResources, API_CATEGORY.NAME, API_CATEGORY.SERVICE.ELASTIC_CONTAINER) ||
      this.resourcesHasCategoryService(packagedResources, HOSTING_CATEGORY.NAME, HOSTING_CATEGORY.SERVICE.ELASTIC_CONTAINER)
    );
  }

  protected resourcesHasApiGatewaysButNotAdminQueries(packagedResources: PackagedResourceDefinition[]): boolean {
    const { API_CATEGORY } = Constants;
    const resources = packagedResources.filter((r) => r.resourceName !== 'AdminQueries');
    return this.resourcesHasCategoryService(resources, API_CATEGORY.NAME, API_CATEGORY.SERVICE.API_GATEWAY);
  }

  /**
   * Saves providerMetadata s3 information
   */
  protected storeS3BucketInfo(packagedResource: PackagedResourceDefinition, bucketName: string): void {
    if (!packagedResource.build) {
      return;
    }
    const s3Info = {
      deploymentBucketName: bucketName,
      s3Key: packagedResource.packagerParams.zipFilename,
    };
    const { CATEGORIES, S3_BUCKET } = Constants;
    _.setWith(
      this.amplifyTeamProviderInfo,
      [this.envInfo.envName, CATEGORIES, packagedResource.category, packagedResource.resourceName],
      s3Info,
    );
    _.setWith(packagedResource, ['s3Bucket'], s3Info);
    _.setWith(this.amplifyMeta, [packagedResource.category, packagedResource.resourceName, S3_BUCKET], s3Info);
  }

  /**
   * generates CloudFormation at the path
   */
  protected async generateCategoryCloudFormation(resources: UploadedResourceDefinition[] | PackagedResourceDefinition[]): Promise<void> {
    if (this.resourcesHasApiGatewaysButNotAdminQueries(resources)) {
      const { PROVIDER, PROVIDER_NAME } = Constants;
      const { StackName: stackName } = this.amplifyMeta[PROVIDER][PROVIDER_NAME];
      await consolidateApiGatewayPolicies(this.context, stackName);
    }
    await prePushAuthTransform(this.context, resources);
    for await (const resource of resources) {
      await this.generateByCategoryService(resource);
    }
  }

  /**
   *  generate Cfn for the resources
   * @param resource {}
   */
  private async generateByCategoryService(resource: UploadedResourceDefinition | PackagedResourceDefinition): Promise<void> {
    const { API_CATEGORY, HOSTING_CATEGORY, EXPOSED_CONTAINER } = Constants;
    switch (resource.category) {
      case API_CATEGORY.NAME:
        if (resource.service === API_CATEGORY.SERVICE.ELASTIC_CONTAINER) {
          const { exposedContainer }: $TSAny = await this.context.amplify.invokePluginMethod(
            this.context,
            'api',
            undefined,
            'generateContainersArtifacts',
            [this.context, resource],
          );
          _.setWith(this.amplifyMeta, [resource.category, resource.resourceName, EXPOSED_CONTAINER], exposedContainer);
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

  /**
   * Make modifications to the generated
   */
  protected async postGenerateCategoryCloudFormation(resources: PackagedResourceDefinition[]): Promise<TransformedCfnResource[]> {
    const { API_CATEGORY, FUNCTION_CATEGORY } = Constants;
    const transformedCfnResources: TransformedCfnResource[] = [];
    await prePushTemplateDescriptionHandler(this.context, resources);
    for await (const resource of resources) {
      const cfnFiles = this.getCfnTemplatePathsForResource(resource);
      const transformedCfnPaths: string[] = [];
      for await (const cfnFile of cfnFiles) {
        if (
          resource.build &&
          resource.service !== API_CATEGORY.SERVICE.ELASTIC_CONTAINER &&
          resource.service !== FUNCTION_CATEGORY.SERVICE.LAMBDA_LAYER
        ) {
          const { cfnTemplate, templateFormat } = readCFNTemplate(cfnFile);
          const paramType = { Type: 'String' };
          const deploymentBucketNameRef = 'deploymentBucketName';
          const s3KeyRef = 's3Key';

          cfnTemplate.Parameters.deploymentBucketName = paramType;
          cfnTemplate.Parameters.s3Key = paramType;
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
          await writeCFNTemplate(cfnTemplate, cfnFile, { templateFormat });
        }
        const transformedCFNPath = await preProcessCFNTemplate(cfnFile);

        await writeCustomPoliciesToCFNTemplate(resource.resourceName, resource.service, path.basename(cfnFile), resource.category);
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

  // eslint-disable-next-line class-methods-use-this
  private getCfnTemplatePathsForResource(resource: ResourceDefinition): string[] {
    const { cfnFiles } = getCfnFiles(resource.category, resource.resourceName, false, {
      absolute: true,
    });
    return cfnFiles;
  }

  protected async generateRootStack(): Promise<Template> {
    return formNestedStack(this.context, { amplifyMeta: this.amplifyMeta }, undefined, undefined, undefined, undefined, true);
  }

  private resourcesHasCategoryService = (resources: ResourceDefinition[], category: string, service?: string): boolean =>
    resources.some((resource) => resource.category === category && (service ? resource.service === service : true));

  protected filterResourceByCategoryService = (resources: ResourceDefinition[], category: string, service?: string): ResourceDefinition[] =>
    resources.filter((resource) => resource.category === category && (service ? resource.service === service : true));
}
