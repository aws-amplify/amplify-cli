import {
  CloudFormationClient,
  DescribeStackResourcesCommand,
  DescribeStacksCommand,
  GetTemplateCommand,
  Parameter,
} from '@aws-sdk/client-cloudformation';
import assert from 'node:assert';
import CategoryTemplateGenerator, { HOSTED_PROVIDER_META_PARAMETER_NAME } from './category-template-generator';
import fs from 'node:fs/promises';
import {
  CATEGORY,
  NON_CUSTOM_RESOURCE_CATEGORY,
  CFN_AUTH_TYPE,
  CFN_CATEGORY_TYPE,
  CFN_RESOURCE_TYPES,
  CFN_S3_TYPE,
  CFNResource,
  CFNStackStatus,
  CFNTemplate,
  ResourceMapping,
} from '../types';
import MigrationReadmeGenerator from './migration-readme-generator';
import { pollStackForCompletionState, tryUpdateStack } from '../cfn-stack-updater';
import { SSMClient } from '@aws-sdk/client-ssm';
import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
import { tryRefactorStack } from '../cfn-stack-refactor-updater';
import CfnOutputResolver from '../resolvers/cfn-output-resolver';
import CfnDependencyResolver from '../resolvers/cfn-dependency-resolver';
import CfnParameterResolver from '../resolvers/cfn-parameter-resolver';
import ora from 'ora';

const CFN_RESOURCE_STACK_TYPE = 'AWS::CloudFormation::Stack';
const GEN2_AMPLIFY_AUTH_LOGICAL_ID_PREFIX = 'amplifyAuth';

const CATEGORIES: CATEGORY[] = ['auth', 'storage'];
const TEMPLATES_DIR = '.amplify/migration/templates';
const SEPARATOR = ' to ';

const GEN1 = 'Gen 1';
const GEN2 = 'Gen 2';
const AUTH_RESOURCES_TO_REFACTOR = [
  CFN_AUTH_TYPE.UserPool,
  CFN_AUTH_TYPE.UserPoolClient,
  CFN_AUTH_TYPE.IdentityPool,
  CFN_AUTH_TYPE.IdentityPoolRoleAttachment,
  CFN_AUTH_TYPE.UserPoolDomain,
];
const AUTH_USER_POOL_GROUP_RESOURCES_TO_REFACTOR = [CFN_AUTH_TYPE.UserPoolGroup];
const STORAGE_RESOURCES_TO_REFACTOR = [CFN_S3_TYPE.Bucket];
const GEN1_RESOURCE_TYPE_TO_LOGICAL_RESOURCE_IDS_MAP = new Map<string, string>([
  [CFN_AUTH_TYPE.UserPool.valueOf(), 'UserPool'],
  [CFN_AUTH_TYPE.UserPoolClient.valueOf(), 'UserPoolClientWeb'],
  [CFN_AUTH_TYPE.IdentityPool.valueOf(), 'IdentityPool'],
  [CFN_AUTH_TYPE.IdentityPoolRoleAttachment.valueOf(), 'IdentityPoolRoleMap'],
  [CFN_AUTH_TYPE.UserPoolDomain.valueOf(), 'UserPoolDomain'],
  [CFN_S3_TYPE.Bucket.valueOf(), 'S3Bucket'],
]);
const LOGICAL_IDS_TO_REMOVE_FOR_REVERT_MAP = new Map<CATEGORY, CFN_RESOURCE_TYPES[]>([
  ['auth', AUTH_RESOURCES_TO_REFACTOR],
  ['auth-user-pool-group', AUTH_USER_POOL_GROUP_RESOURCES_TO_REFACTOR],
  ['storage', [CFN_S3_TYPE.Bucket]],
]);
const GEN2_NATIVE_APP_CLIENT = 'UserPoolNativeAppClient';
const GEN1_USER_POOL_GROUPS_STACK_TYPE_DESCRIPTION = 'auth-Cognito-UserPool-Groups';
const GEN1_AUTH_STACK_TYPE_DESCRIPTION = 'auth-Cognito';
const NO_RESOURCES_TO_MOVE_ERROR = 'No resources to move';
const NO_RESOURCES_TO_REMOVE_ERROR = 'No resources to remove';

class TemplateGenerator {
  private _categoryStackMap: Map<CATEGORY, [string, string]>;
  private readonly categoryTemplateGenerators: [CATEGORY, string, string, CategoryTemplateGenerator<CFN_CATEGORY_TYPE>][];
  private region: string | undefined;
  private readonly _cfnClient: CloudFormationClient;
  private readonly categoryGeneratorConfig = {
    auth: {
      resourcesToRefactor: AUTH_RESOURCES_TO_REFACTOR,
    },
    'auth-user-pool-group': {
      resourcesToRefactor: AUTH_USER_POOL_GROUP_RESOURCES_TO_REFACTOR,
    },
    storage: {
      resourcesToRefactor: STORAGE_RESOURCES_TO_REFACTOR,
    },
  } as const;

  constructor(
    private readonly fromStack: string,
    private readonly toStack: string,
    private readonly accountId: string,
    cfnClient: CloudFormationClient,
    private readonly ssmClient: SSMClient,
    private readonly cognitoIdpClient: CognitoIdentityProviderClient,
    private readonly appId: string,
    private readonly environmentName: string,
  ) {
    this._categoryStackMap = new Map<CATEGORY, [string, string]>();
    this.categoryTemplateGenerators = [];
    this._cfnClient = cfnClient;
  }

  // Public getter for categoryStackMap
  public get categoryStackMap() {
    return this._categoryStackMap;
  }

  private set categoryStackMap(value: Map<CATEGORY, [string, string]>) {
    this._categoryStackMap = value;
  }

  // Public getter for cfnClient
  public get cfnClient() {
    return this._cfnClient;
  }

  private async setRegion() {
    this.region = await this._cfnClient.config.region();
  }

  // Initialize for assessment - parse category stacks without generating templates
  public async initializeForAssessment(): Promise<void> {
    await this.setRegion();
    await this.parseCategoryStacks();
  }

  // Get stack template for a given stack ID
  public async getStackTemplate(stackId: string): Promise<CFNTemplate | undefined> {
    try {
      const { TemplateBody } = await this.cfnClient.send(
        new GetTemplateCommand({
          StackName: stackId,
        }),
      );
      if (!TemplateBody) return undefined;
      return JSON.parse(TemplateBody);
    } catch (error) {
      return undefined;
    }
  }

  // Get resources to migrate for a given category
  public getResourcesToMigrate(template: CFNTemplate, category: string): string[] {
    if (!template.Resources) return [];

    const config = this.categoryGeneratorConfig[category as keyof typeof this.categoryGeneratorConfig];
    if (!config) return [];

    const resourcesToRefactor = config.resourcesToRefactor;
    return Object.entries(template.Resources)
      .filter(([, resource]) => resourcesToRefactor.some((type) => type.valueOf() === resource.Type))
      .map(([logicalId]) => logicalId);
  }

  // Generate templates for selected categories only
  public async generateSelectedCategories(selectedCategories: string[], customResourceMap?: ResourceMapping[]): Promise<boolean> {
    await fs.mkdir(TEMPLATES_DIR, { recursive: true });

    // Filter categoryStackMap to only include selected categories
    const filteredCategoryStackMap = new Map<CATEGORY, [string, string]>();
    for (const [category, stacks] of this._categoryStackMap.entries()) {
      if (selectedCategories.includes(category)) {
        filteredCategoryStackMap.set(category, stacks);
      }
    }

    // Temporarily replace categoryStackMap with filtered version
    const originalCategoryStackMap = this._categoryStackMap;
    this._categoryStackMap = filteredCategoryStackMap;

    try {
      const result = await this.generateCategoryTemplates(false, customResourceMap);
      return result;
    } finally {
      // Restore original categoryStackMap
      this._categoryStackMap = originalCategoryStackMap;
    }
  }

  public async generate(customResourceMap?: ResourceMapping[]) {
    await fs.mkdir(TEMPLATES_DIR, { recursive: true });
    await this.setRegion();
    await this.parseCategoryStacks();
    if (customResourceMap) {
      for (const { Source, Destination } of customResourceMap) {
        this.updateCategoryStackMap(Source.LogicalResourceId, Source.StackName, Destination.StackName, false, false);
      }
    }
    return await this.generateCategoryTemplates(false, customResourceMap);
  }

  public async revert() {
    await this.setRegion();
    await this.parseCategoryStacks(true);
    return await this.generateCategoryTemplates(true);
  }

  private async parseCategoryStacks(isRevert = false): Promise<void> {
    const sourceStackResourcesResponse = await this.cfnClient.send(
      new DescribeStackResourcesCommand({
        StackName: this.fromStack,
      }),
    );
    const destStackResourcesResponse = await this.cfnClient.send(
      new DescribeStackResourcesCommand({
        StackName: this.toStack,
      }),
    );
    const sourceStackResources = sourceStackResourcesResponse.StackResources;
    const destStackResources = destStackResourcesResponse.StackResources;
    assert(sourceStackResources, 'No source stack resources found');
    assert(destStackResources, 'No destination stack resources found');
    const sourceCategoryStacks = sourceStackResources?.filter((stackResource) => stackResource.ResourceType === CFN_RESOURCE_STACK_TYPE);
    const destinationCategoryStacks = destStackResources?.filter((stackResource) => stackResource.ResourceType === CFN_RESOURCE_STACK_TYPE);
    assert(sourceCategoryStacks && sourceCategoryStacks?.length > 0, 'No source category stack found');
    assert(destinationCategoryStacks && destinationCategoryStacks?.length > 0, 'No destination category stack found');
    for (const { LogicalResourceId: sourceLogicalResourceId, PhysicalResourceId: sourcePhysicalResourceId } of sourceCategoryStacks) {
      const category = CATEGORIES.find((category) => sourceLogicalResourceId?.startsWith(category));
      if (!category) continue;
      assert(sourcePhysicalResourceId);
      let destinationPhysicalResourceId: string | undefined;
      let userPoolGroupDestinationPhysicalResourceId: string | undefined;

      const correspondingCategoryStackInDestination = destinationCategoryStacks.find(
        ({ LogicalResourceId: destinationLogicalResourceId }) => destinationLogicalResourceId?.startsWith(category),
      );
      if (!correspondingCategoryStackInDestination) {
        throw new Error(`No corresponding category found in destination stack for ${category} category`);
      }
      destinationPhysicalResourceId = correspondingCategoryStackInDestination.PhysicalResourceId;

      let isUserPoolGroupStack = false;
      if (!isRevert && category === 'auth') {
        const gen1AuthTypeStack = await this.getGen1AuthTypeStack(sourcePhysicalResourceId);
        isUserPoolGroupStack = gen1AuthTypeStack === 'auth-user-pool-group';
      } else if (isRevert && category === 'auth') {
        for (const {
          LogicalResourceId: destinationLogicalResourceId,
          PhysicalResourceId: _destinationPhysicalResourceId,
        } of destinationCategoryStacks) {
          assert(_destinationPhysicalResourceId);
          const destinationIsAuthCategory = destinationLogicalResourceId?.startsWith('auth');
          if (!destinationIsAuthCategory) continue;
          const gen1AuthTypeStack = await this.getGen1AuthTypeStack(_destinationPhysicalResourceId);
          isUserPoolGroupStack = gen1AuthTypeStack === 'auth-user-pool-group';
          if (isUserPoolGroupStack) {
            userPoolGroupDestinationPhysicalResourceId = _destinationPhysicalResourceId;
          } else if (gen1AuthTypeStack === 'auth') {
            destinationPhysicalResourceId = _destinationPhysicalResourceId;
          }
        }
      }

      assert(destinationPhysicalResourceId);

      this.updateCategoryStackMap(
        category,
        sourcePhysicalResourceId,
        destinationPhysicalResourceId,
        isUserPoolGroupStack,
        isRevert,
        userPoolGroupDestinationPhysicalResourceId,
      );
    }
  }

  private updateCategoryStackMap(
    category: CATEGORY | string,
    sourcePhysicalResourceId: string,
    destinationPhysicalResourceId: string,
    isUserPoolGroupStack: boolean,
    isRevert: boolean,
    userPoolGroupDestinationPhysicalResourceId?: string,
  ): void {
    // User pool groups and the auth resources are part of the same stack in Gen2, but different in Gen1
    // Hence, we need to also add auth category stack mapping in case of revert (moving back to Gen1).
    if (!isUserPoolGroupStack || isRevert) {
      this.categoryStackMap.set(category, [sourcePhysicalResourceId, destinationPhysicalResourceId]);
    }
    if (isUserPoolGroupStack) {
      const destinationId =
        isRevert && userPoolGroupDestinationPhysicalResourceId ? userPoolGroupDestinationPhysicalResourceId : destinationPhysicalResourceId;

      this.categoryStackMap.set('auth-user-pool-group', [sourcePhysicalResourceId, destinationId]);
    }
  }

  private getGen1AuthTypeStack = async (stackName: string): Promise<CATEGORY | null> => {
    const describeStacksResponse = await this.cfnClient.send(
      new DescribeStacksCommand({
        StackName: stackName,
      }),
    );
    const stackDescription = describeStacksResponse?.Stacks?.[0]?.Description;
    assert(stackDescription);
    try {
      const parsedStackDescription = JSON.parse(stackDescription);
      if (typeof parsedStackDescription === 'object' && 'stackType' in parsedStackDescription) {
        switch (parsedStackDescription.stackType) {
          case GEN1_USER_POOL_GROUPS_STACK_TYPE_DESCRIPTION:
            return 'auth-user-pool-group';
          case GEN1_AUTH_STACK_TYPE_DESCRIPTION:
            return 'auth';
        }
      }
    } catch (e) {
      // unable to parse description. Fail silently.
    }
    return null;
  };

  private isNoResourcesError(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'message' in error &&
      typeof error.message === 'string' &&
      (error.message.includes(NO_RESOURCES_TO_MOVE_ERROR) || error.message.includes(NO_RESOURCES_TO_REMOVE_ERROR))
    );
  }

  private getStackCategoryName(category: string) {
    return !this.isCustomResource(category) ? category : 'custom';
  }

  private async processGen1Stack(
    category: string,
    categoryTemplateGenerator: CategoryTemplateGenerator<CFN_CATEGORY_TYPE>,
    sourceCategoryStackId: string,
  ): Promise<[CFNTemplate, Parameter[]] | undefined> {
    let updatingGen1CategoryStack;
    try {
      const { newTemplate, parameters: gen1StackParameters } = await categoryTemplateGenerator.generateGen1PreProcessTemplate();
      assert(gen1StackParameters);
      updatingGen1CategoryStack = ora(`Updating Gen 1 ${this.getStackCategoryName(category)} stack...`).start();

      const gen1StackUpdateStatus = await tryUpdateStack(this.cfnClient, sourceCategoryStackId, gen1StackParameters, newTemplate);

      assert(gen1StackUpdateStatus === CFNStackStatus.UPDATE_COMPLETE, `Gen 1 stack is in an invalid state: ${gen1StackUpdateStatus}`);
      updatingGen1CategoryStack.succeed(`Updated Gen 1 ${this.getStackCategoryName(category)} stack successfully`);

      return [newTemplate, gen1StackParameters];
    } catch (e) {
      if (this.isNoResourcesError(e)) {
        updatingGen1CategoryStack?.succeed(
          `No resources found to move in Gen 1 ${this.getStackCategoryName(category)} stack. Skipping update.`,
        );
        return undefined;
      }
      throw e;
    }
  }

  private async processGen2Stack(
    category: string,
    categoryTemplateGenerator: CategoryTemplateGenerator<CFN_CATEGORY_TYPE>,
    destinationCategoryStackId: string,
  ): Promise<{
    newTemplate: CFNTemplate;
    oldTemplate: CFNTemplate;
    parameters?: Parameter[];
  }> {
    try {
      const { newTemplate, oldTemplate, parameters } = await categoryTemplateGenerator.generateGen2ResourceRemovalTemplate();

      const updatingGen2CategoryStack = ora(`Updating Gen 2 ${this.getStackCategoryName(category)} stack...`).start();

      const gen2StackUpdateStatus = await tryUpdateStack(this.cfnClient, destinationCategoryStackId, parameters ?? [], newTemplate);

      assert(gen2StackUpdateStatus === CFNStackStatus.UPDATE_COMPLETE, `Gen 2 stack is in an invalid state: ${gen2StackUpdateStatus}`);
      updatingGen2CategoryStack.succeed(`Updated Gen 2 ${this.getStackCategoryName(category)} stack successfully`);

      return { newTemplate, oldTemplate, parameters };
    } catch (e) {
      if (this.isNoResourcesError(e)) {
        const currentTemplate = categoryTemplateGenerator.gen2Template;
        assert(currentTemplate);
        const parameters = categoryTemplateGenerator.gen2StackParameters;
        return { newTemplate: currentTemplate, oldTemplate: currentTemplate, parameters };
      }
      throw e;
    }
  }

  private initializeCategoryGenerators(customResourceMap?: ResourceMapping[]) {
    assert(this.region);

    for (const [category, [sourceStackId, destinationStackId]] of this.categoryStackMap.entries()) {
      const config = this.categoryGeneratorConfig[category as keyof typeof this.categoryGeneratorConfig];

      if (config) {
        this.categoryTemplateGenerators.push([
          category,
          sourceStackId,
          destinationStackId,
          this.createCategoryTemplateGenerator(sourceStackId, destinationStackId, config.resourcesToRefactor),
        ]);
      } else if (customResourceMap && this.isCustomResource(category)) {
        this.categoryTemplateGenerators.push([
          category,
          sourceStackId,
          destinationStackId,
          this.createCategoryTemplateGenerator(sourceStackId, destinationStackId, [], customResourceMap),
        ]);
      }
    }
  }

  private createCategoryTemplateGenerator(
    sourceStackId: string,
    destinationStackId: string,
    resourcesToRefactor: CFN_CATEGORY_TYPE[],
    customResourceMap?: ResourceMapping[],
  ): CategoryTemplateGenerator<CFN_CATEGORY_TYPE> {
    assert(this.region);
    return new CategoryTemplateGenerator(
      sourceStackId,
      destinationStackId,
      this.region,
      this.accountId,
      this.cfnClient,
      this.ssmClient,
      this.cognitoIdpClient,
      this.appId,
      this.environmentName,
      resourcesToRefactor,
      customResourceMap
        ? (_resourcesToMove: CFN_CATEGORY_TYPE[], cfnResource: [string, CFNResource]) => {
            const [logicalId] = cfnResource;

            // Check if customResourceMap contains the logical ID
            return (
              customResourceMap?.some(
                (resourceMapping) =>
                  resourceMapping.Source.LogicalResourceId === logicalId || resourceMapping.Destination.LogicalResourceId === logicalId,
              ) ?? false
            );
          }
        : undefined,
    );
  }

  private isCustomResource(category: string) {
    return !Object.values(NON_CUSTOM_RESOURCE_CATEGORY)
      .map((nonCustomCategory) => nonCustomCategory.valueOf())
      .includes(category);
  }

  private async generateCategoryTemplates(isRevert = false, customResourceMap?: ResourceMapping[]) {
    this.initializeCategoryGenerators(customResourceMap);
    let hasOAuthEnabled = false;
    for (const [category, sourceCategoryStackId, destinationCategoryStackId, categoryTemplateGenerator] of this
      .categoryTemplateGenerators) {
      let newSourceTemplate: CFNTemplate | undefined;
      let newDestinationTemplate: CFNTemplate | undefined;
      let oldDestinationTemplate: CFNTemplate | undefined;
      let sourceStackParameters: Parameter[] | undefined;
      let destinationStackParameters: Parameter[] | undefined;
      let sourceTemplateForRefactor: CFNTemplate | undefined;
      let destinationTemplateForRefactor: CFNTemplate | undefined;
      let logicalIdMappingForRefactor: Map<string, string> | undefined;

      if (customResourceMap && this.isCustomResource(category)) {
        const processGen1StackResponse = await this.processGen1Stack(category, categoryTemplateGenerator, sourceCategoryStackId);
        if (!processGen1StackResponse) continue;
        const [newGen1Template] = processGen1StackResponse;
        newSourceTemplate = newGen1Template;

        const { newTemplate } = await this.processGen2Stack(category, categoryTemplateGenerator, destinationCategoryStackId);
        newDestinationTemplate = newTemplate;

        const sourceToDestinationMap = new Map<string, string>();

        for (const resourceMapping of customResourceMap) {
          const sourceLogicalId = resourceMapping.Source.LogicalResourceId;
          const destinationLogicalId = resourceMapping.Destination.LogicalResourceId;

          if (sourceLogicalId && destinationLogicalId) {
            sourceToDestinationMap.set(sourceLogicalId, destinationLogicalId);
          }
        }

        const { sourceTemplate, destinationTemplate, logicalIdMapping } = categoryTemplateGenerator.generateRefactorTemplates(
          categoryTemplateGenerator.gen1ResourcesToMove,
          categoryTemplateGenerator.gen2ResourcesToRemove,
          newSourceTemplate,
          newDestinationTemplate,
          sourceToDestinationMap,
        );

        sourceTemplateForRefactor = sourceTemplate;
        destinationTemplateForRefactor = destinationTemplate;
        logicalIdMappingForRefactor = logicalIdMapping;
      } else if (!isRevert) {
        const processGen1StackResponse = await this.processGen1Stack(category, categoryTemplateGenerator, sourceCategoryStackId);
        if (!processGen1StackResponse) continue;
        const [newGen1Template, gen1StackParameters] = processGen1StackResponse;
        sourceStackParameters = gen1StackParameters;
        newSourceTemplate = newGen1Template;
        if (category === 'auth' && sourceStackParameters?.find((param) => param.ParameterKey === HOSTED_PROVIDER_META_PARAMETER_NAME)) {
          hasOAuthEnabled = true;
        }
        const { newTemplate, oldTemplate, parameters } = await this.processGen2Stack(
          category,
          categoryTemplateGenerator,
          destinationCategoryStackId,
        );
        newDestinationTemplate = newTemplate;
        oldDestinationTemplate = oldTemplate;
        destinationStackParameters = parameters;
        const { sourceTemplate, destinationTemplate, logicalIdMapping } = categoryTemplateGenerator.generateStackRefactorTemplates(
          newSourceTemplate,
          newDestinationTemplate,
        );
        sourceTemplateForRefactor = sourceTemplate;
        destinationTemplateForRefactor = destinationTemplate;
        logicalIdMappingForRefactor = logicalIdMapping;
      }
      // revert scenario
      else {
        const sourceCategoryTemplate = await categoryTemplateGenerator.readTemplate(sourceCategoryStackId);
        const destinationCategoryTemplate = await categoryTemplateGenerator.readTemplate(destinationCategoryStackId);
        newSourceTemplate = sourceCategoryTemplate;
        newDestinationTemplate = destinationCategoryTemplate;
        try {
          const { sourceTemplate, destinationTemplate, logicalIdMapping } = await this.generateRefactorTemplatesForRevert(
            newSourceTemplate,
            newDestinationTemplate,
            categoryTemplateGenerator,
            sourceCategoryStackId,
            category,
          );
          sourceTemplateForRefactor = sourceTemplate;
          destinationTemplateForRefactor = destinationTemplate;
          logicalIdMappingForRefactor = logicalIdMapping;
        } catch (e) {
          if (typeof e === 'object' && 'message' in e && e.message.includes(NO_RESOURCES_TO_MOVE_ERROR)) {
            continue;
          }
          throw e;
        }
      }

      const refactorResources = ora(
        `Moving ${this.getStackCategoryName(category)} resources from ${this.getSourceToDestinationMessage(isRevert)} stack...`,
      ).start();
      const { success, failedRefactorMetadata } = await this.refactorResources(
        logicalIdMappingForRefactor,
        sourceCategoryStackId,
        destinationCategoryStackId,
        category,
        isRevert,
        sourceTemplateForRefactor,
        destinationTemplateForRefactor,
      );
      if (!success) {
        refactorResources.fail(
          `Moving ${this.getStackCategoryName(category)} resources from ${this.getSourceToDestinationMessage(
            isRevert,
          )} stack failed. Reason: ${failedRefactorMetadata?.reason}. Status: ${failedRefactorMetadata?.status}. RefactorId: ${
            failedRefactorMetadata?.stackRefactorId
          }.`,
        );
        await pollStackForCompletionState(this.cfnClient, destinationCategoryStackId, 30);
        if (!isRevert && oldDestinationTemplate) {
          await this.rollbackGen2Stack(category, destinationCategoryStackId, destinationStackParameters, oldDestinationTemplate);
        }
        return false;
      } else {
        refactorResources.succeed(
          `Moved ${this.getStackCategoryName(category)} resources from ${this.getSourceToDestinationMessage(isRevert)} stack successfully`,
        );
      }
    }
    if (!isRevert) {
      const migrationReadMeGenerator = new MigrationReadmeGenerator({
        path: `${TEMPLATES_DIR}`,
        categories: [...this.categoryStackMap.keys()],
        hasOAuthEnabled,
      });
      await migrationReadMeGenerator.initialize();
      await migrationReadMeGenerator.renderStep1();
    }
    return true;
  }

  private async refactorResources(
    logicalIdMappingForRefactor: Map<string, string>,
    sourceCategoryStackId: string,
    destinationCategoryStackId: string,
    category: 'auth' | 'storage' | 'auth-user-pool-group' | string,
    isRevert: boolean,
    sourceTemplateForRefactor: CFNTemplate,
    destinationTemplateForRefactor: CFNTemplate,
  ) {
    const resourceMappings: ResourceMapping[] = [];
    for (const [sourceLogicalId, destinationLogicalId] of logicalIdMappingForRefactor) {
      resourceMappings.push({
        Source: {
          StackName: sourceCategoryStackId,
          LogicalResourceId: sourceLogicalId,
        },
        Destination: {
          StackName: destinationCategoryStackId,
          LogicalResourceId: destinationLogicalId,
        },
      });
    }
    const [success, failedRefactorMetadata] = await tryRefactorStack(this.cfnClient, {
      StackDefinitions: [
        {
          TemplateBody: JSON.stringify(sourceTemplateForRefactor),
          StackName: sourceCategoryStackId,
        },
        {
          TemplateBody: JSON.stringify(destinationTemplateForRefactor),
          StackName: destinationCategoryStackId,
        },
      ],
      ResourceMappings: resourceMappings,
    });
    return { success, failedRefactorMetadata };
  }

  private async rollbackGen2Stack(
    category: CATEGORY,
    gen2CategoryStackId: string,
    gen2StackParameters: Parameter[] | undefined,
    oldGen2Template: CFNTemplate,
  ) {
    const rollingBackGen2Stack = ora(`Rolling back Gen 2 ${this.getStackCategoryName(category)} stack...`).start();
    const gen2StackUpdateStatus = await tryUpdateStack(this.cfnClient, gen2CategoryStackId, gen2StackParameters ?? [], oldGen2Template);
    assert(gen2StackUpdateStatus === CFNStackStatus.UPDATE_COMPLETE, `Gen 2 Stack is in a failed state: ${gen2StackUpdateStatus}.`);
    rollingBackGen2Stack.succeed(`Rolled back Gen 2 ${this.getStackCategoryName(category)} stack successfully`);
  }

  private async generateRefactorTemplatesForRevert(
    newSourceTemplate: CFNTemplate,
    newDestinationTemplate: CFNTemplate,
    categoryTemplateGenerator: CategoryTemplateGenerator<CFN_CATEGORY_TYPE>,
    sourceCategoryStackId: string,
    category: CATEGORY,
  ) {
    assert(newSourceTemplate.Resources);
    const sourceResourcesToRemove: Map<string, CFNResource> = new Map(
      Object.entries(newSourceTemplate.Resources).filter(([, value]) =>
        LOGICAL_IDS_TO_REMOVE_FOR_REVERT_MAP.get(category)?.some((resourceToMove) => resourceToMove.valueOf() === value.Type),
      ),
    );
    if (sourceResourcesToRemove.size === 0) {
      throw new Error(`${NO_RESOURCES_TO_MOVE_ERROR} in ${category} stack.`);
    }
    const describeStackResponseForSourceTemplate = await categoryTemplateGenerator.describeStack(sourceCategoryStackId);
    assert(describeStackResponseForSourceTemplate);
    const sourceLogicalIds = [...sourceResourcesToRemove.keys()];
    const { Outputs, Parameters } = describeStackResponseForSourceTemplate;
    assert(Outputs);
    assert(this.region);
    const { StackResources } = await this.cfnClient.send(
      new DescribeStackResourcesCommand({
        StackName: sourceCategoryStackId,
      }),
    );
    assert(StackResources);
    const newSourceTemplateWithParametersResolved = new CfnParameterResolver(newSourceTemplate).resolve(Parameters ?? []);
    const newSourceTemplateWithOutputsResolved = new CfnOutputResolver(
      newSourceTemplateWithParametersResolved,
      this.region,
      this.accountId,
    ).resolve(sourceLogicalIds, Outputs, StackResources);
    const newSourceTemplateWithDepsResolved = new CfnDependencyResolver(newSourceTemplateWithOutputsResolved).resolve(sourceLogicalIds);
    return categoryTemplateGenerator.generateRefactorTemplates(
      sourceResourcesToRemove,
      new Map<string, CFNResource>(),
      newSourceTemplateWithDepsResolved,
      newDestinationTemplate,
      this.buildSourceToDestinationMapForRevert(sourceResourcesToRemove),
    );
  }

  private getSourceToDestinationMessage(revert: boolean) {
    const SOURCE_TO_DESTINATION_STACKS = [GEN1, GEN2];
    return revert ? SOURCE_TO_DESTINATION_STACKS.reverse().join(SEPARATOR) : SOURCE_TO_DESTINATION_STACKS.join(SEPARATOR);
  }

  private buildSourceToDestinationMapForRevert(sourceResourcesToRemove: Map<string, CFNResource>): Map<string, string> {
    const sourceToDestinationLogicalIdsMap = new Map<string, string>();
    for (const [sourceLogicalId, resource] of sourceResourcesToRemove) {
      if (sourceLogicalId.includes(GEN2_NATIVE_APP_CLIENT)) {
        sourceToDestinationLogicalIdsMap.set(sourceLogicalId, 'UserPoolClient');
      } else if (resource.Type === CFN_AUTH_TYPE.UserPoolGroup) {
        const [, sourceLogicalIdSuffix] = sourceLogicalId.split(GEN2_AMPLIFY_AUTH_LOGICAL_ID_PREFIX);
        // last 8 digits are always a CDK HASH
        // amplifyAuth<destinationLogicalId>8digitCDKHASH
        const destinationLogicalId = sourceLogicalIdSuffix.slice(0, sourceLogicalIdSuffix.length - 8);
        sourceToDestinationLogicalIdsMap.set(sourceLogicalId, destinationLogicalId);
      } else {
        const destinationLogicalId = GEN1_RESOURCE_TYPE_TO_LOGICAL_RESOURCE_IDS_MAP.get(resource.Type);
        assert(destinationLogicalId);
        sourceToDestinationLogicalIdsMap.set(sourceLogicalId, destinationLogicalId);
      }
    }

    return sourceToDestinationLogicalIdsMap;
  }
}

export { TemplateGenerator };
