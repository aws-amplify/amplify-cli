import {
  $TSContext,
  $TSMeta,
  $TSObject,
  $TSTeamProviderInfo,
  IDeploymentStateManager,
  pathManager,
  readCFNTemplate,
  stateManager,
  writeCFNTemplate,
} from 'amplify-cli-core';
import * as _ from 'lodash';
import { legacyLayerMigration, prePushLambdaLayerPrompt } from '../lambdaLayerInvocations';
import { formNestedStack, updateStackForAPIMigration } from '../push-resources';
import { transformGraphQLSchema } from '../transform-graphql-schema';
import { ensureValidFunctionModelDependencies } from '../utils/remove-dependent-function';
import { Constants } from './constants';
import { consolidateApiGatewayPolicies } from '../utils/consolidate-apigw-policies';
import { prePushAuthTransform } from '../auth-transform';
import { printer } from 'amplify-prompts';
import glob from 'glob';
import { Fn, Template } from 'cloudform-types';
import { preProcessCFNTemplate } from '../pre-push-cfn-processor/cfn-pre-processor';
import {
  DeploymentResources,
  ResourceDefinition,
  ResourceDeployType,
  BuiltResourceDefinition,
  PackagedResourceDefinition,
  PackagerParams,
  UploadedResourceDefinition,
  TransformedCfnResource,
} from './index';

/**
 * Abstract class that holds logic for building, packaging
 */
export abstract class ResourceDeployer {
  deploymentStateManager: IDeploymentStateManager;
  elasticContainerZipFiles: string[];
  context: $TSContext;
  amplifyMeta: $TSMeta;
  amplifyTeamProviderInfo: $TSTeamProviderInfo;
  envInfo: { envName: string };
  private getResourcesToBeDeployed = ({
    allResources,
    resourcesToBeCreated,
    resourcesToBeUpdated,
  }: DeploymentResources): ResourceDefinition[] =>
    !!this.context?.exeInfo?.forcePush ? allResources : resourcesToBeCreated.concat(resourcesToBeUpdated);

  constructor(context: $TSContext, deployType: ResourceDeployType) {
    this.context = context;
    this.elasticContainerZipFiles = ['custom-resource-pipeline-awaiter.zip', 'codepipeline-action-buildspec-generator-lambda.zip'];
    const projectPath = pathManager.findProjectRoot();
    this.amplifyMeta = stateManager.getMeta(projectPath);
    this.amplifyTeamProviderInfo = stateManager.getTeamProviderInfo(projectPath);
    this.envInfo = stateManager.getLocalEnvInfo(projectPath);
  }

  /**
   * Performs any filtering of resources that has to be deployed
   * 1. Filters dependent functions if @model{Table} is deleted
   * 2. Set the api resource 'lastPackageTimeStamp' as undefined
   * @param deploymentResources of type {DeploymentResource}
   * @returns {ResourceDefinition}
   */
  async filterResourcesToBeDeployed(deploymentResources: DeploymentResources): Promise<ResourceDefinition[]> {
    const resources = this.getResourcesToBeDeployed(deploymentResources);
    const { API_CATEGORY } = Constants;

    const apiResourceTobeUpdated = this.filterResourceByCategoryService(
      deploymentResources.resourcesToBeUpdated,
      API_CATEGORY.NAME,
      API_CATEGORY.SERVICE.APP_SYNC,
    );
    if (apiResourceTobeUpdated.length) {
      const functionResourceToBeUpdated = await ensureValidFunctionModelDependencies(
        this.context,
        apiResourceTobeUpdated,
        deploymentResources.allResources as $TSObject[],
      );
      if (functionResourceToBeUpdated !== undefined && functionResourceToBeUpdated.length > 0) {
        return _.uniqBy(resources.concat(functionResourceToBeUpdated.map(r => r as ResourceDefinition)), `resourceName`);
      }
    }

    return resources;
  }

  /**
   * This function is the step before packaging the non cloudformation resources
   * any changes to be made to the code or final changes are made here
   * @param resources {ResourceDefinition[]}
   * @returns {ResourceDefinition[]}
   */
  async preBuildResources(resources: ResourceDefinition[]): Promise<ResourceDefinition[]> {
    const { FUNCTION_CATEGORY } = Constants;
    for await (const lambdaLayerResource of this.filterResourceByCategoryService(
      resources,
      FUNCTION_CATEGORY.NAME,
      FUNCTION_CATEGORY.SERVICE.LAMBDA_LAYER,
    )) {
      await legacyLayerMigration(this.context, lambdaLayerResource.resourceName);
    }
    await prePushLambdaLayerPrompt(this.context, resources);
    return resources;
  }

  /**
   * Builds all buildable resources and transforms the resources to include 'lastBuildTimeStamp'
   * @param resources {ResourceDefinition[]}
   * @returns {Promise<BuiltResourceDefinition[]>}
   */
  async buildResources(resources: ResourceDefinition[]): Promise<BuiltResourceDefinition[]> {
    const { FUNCTION_CATEGORY, API_CATEGORY } = Constants;
    return await Promise.all(
      resources.map(
        async (resource): Promise<BuiltResourceDefinition> => {
          if (!resource.build) {
            return resource;
          }
          if (resource.category === API_CATEGORY.NAME && resource.service === API_CATEGORY.SERVICE.ELASTIC_CONTAINER) {
            (resource as any).lastPackageTimeStamp = undefined;
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
        },
      ),
    );
  }

  /**
   * zips buildable project and saves it dist
   * @param builtResources {BuiltResourceDefinition[]}
   * @returns resources with params for packaging {PackagedResourceDefinition[]}
   */
  async packageResources(builtResources: BuiltResourceDefinition[]): Promise<PackagedResourceDefinition[]> {
    const { FUNCTION_CATEGORY } = Constants;
    return await Promise.all(
      builtResources.map(async resource => {
        if (!resource.build) {
          return resource;
        }
        const result: PackagerParams = await this.context.amplify.invokePluginMethod(
          this.context,
          FUNCTION_CATEGORY.NAME,
          resource.service,
          'packageResource',
          [this.context, resource],
        );
        return {
          ...resource,
          packagerParams: result,
        };
      }),
    );
  }

  async postPackageResource(pacakgedResources: PackagedResourceDefinition[]): Promise<PackagedResourceDefinition[]> {
    const { options } = this.context.parameters;
    const { API_CATEGORY } = Constants;
    if (this.resourcesHasCategoryService(pacakgedResources, API_CATEGORY.NAME, API_CATEGORY.SERVICE.APP_SYNC)) {
      await transformGraphQLSchema(this.context, {
        handleMigration: opts => updateStackForAPIMigration(this.context, 'api', undefined, opts),
        minify: options['minify'],
      });
    }
    return pacakgedResources;
  }

  protected resourcesHasContainers(packagedResources: PackagedResourceDefinition[]) {
    const { API_CATEGORY, HOSTING_CATEGORY } = Constants;
    return (
      this.resourcesHasCategoryService(packagedResources, API_CATEGORY.NAME, API_CATEGORY.SERVICE.ELASTIC_CONTAINER) ||
      this.resourcesHasCategoryService(packagedResources, HOSTING_CATEGORY.NAME, HOSTING_CATEGORY.SERVICE.ELASTIC_CONTAINER)
    );
  }

  protected storeS3BucketInfo(packagedResource: PackagedResourceDefinition, bucketName: string): void {
    const s3Info = {
      deploymentBucketName: bucketName,
      s3Key: packagedResource.packagerParams.zipFilename,
    };
    const { CATEGORIES, S3_BUCKET } = Constants;
    _.set(
      this.amplifyTeamProviderInfo,
      [this.envInfo.envName, CATEGORIES, packagedResource.category, packagedResource.resourceName],
      s3Info,
    );
    _.set(this.amplifyMeta, [packagedResource.category, packagedResource.resourceName, S3_BUCKET], s3Info);
  }

  /**
   * generates CloudFormation at the path
   * @param resources
   */
  async generateCategoryCloudFormation(resources: UploadedResourceDefinition[] | PackagedResourceDefinition[]) {
    if (this.resourcesHasContainers(resources)) {
      const { StackName: stackName } = this.amplifyMeta;
      consolidateApiGatewayPolicies(this.context, stackName);
    }
    await prePushAuthTransform(this.context, resources);
    for await (const resource of resources) {
      await this.generateByCategoryService(resource);
    }
  }

  private async generateByCategoryService(resource: UploadedResourceDefinition | PackagedResourceDefinition): Promise<void> {
    const { API_CATEGORY, HOSTING_CATEGORY, EXPOSED_CONTAINER } = Constants;
    switch (resource.category) {
      case API_CATEGORY.NAME:
        if (resource.service === API_CATEGORY.SERVICE.ELASTIC_CONTAINER) {
          const {
            exposedContainer,
            pipelineInfo: { consoleUrl },
          } = await this.context.amplify.invokePluginMethod(this.context, 'api', undefined, 'generateContainersArtifacts', [
            this.context,
            resource,
          ]);
          _.set(this.amplifyMeta, [resource.category, resource.resourceName, EXPOSED_CONTAINER], exposedContainer);
          printer.info(`\nIn a few moments, you can check image build status for ${resource.resourceName} at the following URL:`);

          printer.info(`${consoleUrl}\n`);

          printer.info(
            `It may take a few moments for this to appear. If you have trouble with first time deployments, please try refreshing this page after a few moments and watch the CodeBuild Details for debugging information.`,
          );
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
   *
   * @param resources
   */
  async postGenerateCategoryCloudFormation(resources: PackagedResourceDefinition[]): Promise<TransformedCfnResource[]> {
    const { API_CATEGORY, FUNCTION_CATEGORY } = Constants;
    const transformedCfnResources: TransformedCfnResource[] = [];
    for await (const resource of resources) {
      const cfnFiles = this.getCfnTemplatePathsForResource(resource);
      const transformedCfnPaths: string[] = [];
      for await (const cfnFile of cfnFiles) {
        if (
          resource.build &&
          resource.service !== API_CATEGORY.SERVICE.ELASTIC_CONTAINER &&
          resource.service !== FUNCTION_CATEGORY.SERVICE.LAMBDA_LAYER
        ) {
          const { cfnTemplate, templateFormat } = await readCFNTemplate(cfnFile);
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
        transformedCfnPaths.push(transformedCFNPath);
      }
      transformedCfnResources.push({
        ...resource,
        transformedCfnPaths,
      });
    }
    return transformedCfnResources;
  }

  getCfnTemplatePathsForResource(resource: ResourceDefinition): string[] {
    const { PARAMETERS_JSON_FILE, CFN_TEMPLATE_GLOB_PATTERN } = Constants;
    const projectRoot = pathManager.findProjectRoot();
    const resourceDir = pathManager.getResourceDirectoryPath(projectRoot, resource.category, resource.resourceName);
    const cfnFiles = glob.sync(CFN_TEMPLATE_GLOB_PATTERN, {
      cwd: resourceDir,
      ignore: [PARAMETERS_JSON_FILE],
    });
    return cfnFiles;
  }

  async generateRootStack(): Promise<Template> {
    return await formNestedStack(this.context, { ampliftyMeta: this.amplifyMeta });
  }

  private resourcesHasCategoryService = (resources: ResourceDefinition[], category: string, service?: string): boolean =>
    resources.some(resource => resource.category === category && (service ? resource.service === service : true));

  private filterResourceByCategoryService = (resources: ResourceDefinition[], category: string, service?: string) =>
    resources.filter(resource => resource.category === category && (service ? resource.service === service : true));

  protected createTemplateUrl(bucket: string, fileName: string, category?: string): string {
    if (category) {
      return `https://s3.amazonaws.com/${bucket}/${Constants.AMPLIFY_CFN_TEMPLATES}/${category}/${fileName}`;
    }
    return `https://s3.amazonaws.com/${bucket}/${Constants.AMPLIFY_CFN_TEMPLATES}/${fileName}`;
  }
}
