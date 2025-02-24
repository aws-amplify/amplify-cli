import {
  CloudFormationClient,
  DescribeStackResourcesCommand,
  DescribeStacksCommand,
  Parameter,
  StackResource,
} from '@aws-sdk/client-cloudformation';
import assert from 'node:assert';
import CategoryTemplateGenerator from './category-template-generator';
import fs from 'node:fs/promises';
import {
  CATEGORY,
  CFN_AUTH_TYPE,
  CFN_CATEGORY_TYPE,
  CFN_IAM_TYPE,
  CFN_RESOURCE_TYPES,
  CFN_S3_TYPE,
  CFNResource,
  CFNStackStatus,
  CFNTemplate,
  GEN2_AUTH_LOGICAL_RESOURCE_ID,
} from './types';
import MigrationReadmeGenerator from './migration-readme-generator';
import { pollStackForCompletionState, tryUpdateStack } from './cfn-stack-updater';
import { SSMClient } from '@aws-sdk/client-ssm';
import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
import { tryRefactorStack } from './cfn-stack-refactor-updater';
import CfnOutputResolver from './resolvers/cfn-output-resolver';
import CfnDependencyResolver from './resolvers/cfn-dependency-resolver';

const CFN_RESOURCE_STACK_TYPE = 'AWS::CloudFormation::Stack';
const GEN2_AMPLIFY_AUTH_LOGICAL_ID_PREFIX = 'amplifyAuth';

const CATEGORIES: CATEGORY[] = ['auth', 'storage'];
const TEMPLATES_DIR = '.amplify/migration/templates';
const SEPARATOR = ' to ';

const SOURCE_TO_DESTINATION_STACKS = [`Gen1`, `Gen2`];
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
const UNAUTH_ROLE_NAME = 'unauthenticated';
const AUTH_ROLE_NAME = 'authenticated';
const CFN_FN_GET_ATTTRIBUTE = 'Fn::GetAtt';
const GEN1_USER_POOL_GROUPS_STACK_TYPE_DESCRIPTION = 'auth-Cognito-UserPool-Groups';
const GEN1_AUTH_STACK_TYPE_DESCRIPTION = 'auth-Cognito';
const NO_RESOURCES_TO_MOVE_ERROR = 'No resources to move';

class TemplateGenerator {
  private readonly categoryStackMap: Map<CATEGORY, [string, string]>;
  private readonly categoryTemplateGenerators: [CATEGORY, string, string, CategoryTemplateGenerator<CFN_CATEGORY_TYPE>][];
  private region: string | undefined;
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
    private readonly cfnClient: CloudFormationClient,
    private readonly ssmClient: SSMClient,
    private readonly cognitoIdpClient: CognitoIdentityProviderClient,
    private readonly appId: string,
    private readonly environmentName: string,
  ) {
    this.categoryStackMap = new Map<CATEGORY, [string, string]>();
    this.categoryTemplateGenerators = [];
  }

  private async setRegion() {
    this.region = await this.cfnClient.config.region();
  }

  public async generate() {
    await fs.mkdir(TEMPLATES_DIR, { recursive: true });
    await this.setRegion();
    await this.parseCategoryStacks();
    return await this.generateCategoryTemplates();
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
    category: CATEGORY,
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
      (error as { message: string }).message.includes(NO_RESOURCES_TO_MOVE_ERROR)
    );
  }

  private async processGen1Stack(
    category: string,
    categoryTemplateGenerator: CategoryTemplateGenerator<CFN_CATEGORY_TYPE>,
    sourceCategoryStackId: string,
  ): Promise<CFNTemplate | undefined> {
    try {
      const { newTemplate, parameters: gen1StackParameters } = await categoryTemplateGenerator.generateGen1PreProcessTemplate();

      assert(gen1StackParameters);
      console.log(`Updating Gen1 ${category} stack...`);

      const gen1StackUpdateStatus = await tryUpdateStack(this.cfnClient, sourceCategoryStackId, gen1StackParameters, newTemplate);

      assert(gen1StackUpdateStatus === CFNStackStatus.UPDATE_COMPLETE);
      console.log(`Updated Gen1 ${category} stack successfully`);

      return newTemplate;
    } catch (e) {
      if (this.isNoResourcesError(e)) {
        console.log(e.message);
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
    const { newTemplate, oldTemplate, parameters } = await categoryTemplateGenerator.generateGen2ResourceRemovalTemplate();

    console.log(`Updating Gen2 ${category} stack...`);

    const gen2StackUpdateStatus = await tryUpdateStack(this.cfnClient, destinationCategoryStackId, parameters ?? [], newTemplate);

    assert(gen2StackUpdateStatus === CFNStackStatus.UPDATE_COMPLETE);
    console.log(`Updated Gen2 ${category} stack successfully`);

    return { newTemplate, oldTemplate, parameters };
  }

  private initializeCategoryGenerators() {
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
      }
    }
  }

  private createCategoryTemplateGenerator(
    sourceStackId: string,
    destinationStackId: string,
    resourcesToRefactor: CFN_CATEGORY_TYPE[],
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
    );
  }

  private async generateCategoryTemplates(isRevert = false) {
    this.initializeCategoryGenerators();
    for (const [category, sourceCategoryStackId, destinationCategoryStackId, categoryTemplateGenerator] of this
      .categoryTemplateGenerators) {
      let newSourceTemplate: CFNTemplate | undefined;
      let newDestinationTemplate: CFNTemplate | undefined;
      let oldDestinationTemplate: CFNTemplate | undefined;
      let destinationStackParameters: Parameter[] | undefined;
      let sourceTemplateForRefactor: CFNTemplate | undefined;
      let destinationTemplateForRefactor: CFNTemplate | undefined;
      let logicalIdMappingForRefactor: Map<string, string> | undefined;

      if (!isRevert) {
        newSourceTemplate = await this.processGen1Stack(category, categoryTemplateGenerator, sourceCategoryStackId);
        if (!newSourceTemplate) continue;
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
      } else {
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
            console.log(e.message);
            continue;
          }
          throw e;
        }
      }

      assert(newSourceTemplate);
      assert(newDestinationTemplate);
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
        console.log(
          `Moving ${category} resources from ${this.getSourceToDestinationMessage(isRevert)} stack failed. Reason: ${
            failedRefactorMetadata?.reason
          }. Status: ${failedRefactorMetadata?.status}. RefactorId: ${failedRefactorMetadata?.stackRefactorId}.`,
        );
        await pollStackForCompletionState(this.cfnClient, destinationCategoryStackId, 30);
        if (!isRevert && oldDestinationTemplate) {
          await this.rollbackGen2Stack(category, destinationCategoryStackId, destinationStackParameters, oldDestinationTemplate);
        }
        return false;
      } else {
        console.log(`Moved ${category} resources from ${this.getSourceToDestinationMessage(isRevert)} stack successfully`);
      }
    }
    if (!isRevert) {
      const migrationReadMeGenerator = new MigrationReadmeGenerator({
        path: `${TEMPLATES_DIR}`,
        categories: [...this.categoryStackMap.keys()],
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
    category: 'auth' | 'storage' | 'auth-user-pool-group',
    isRevert: boolean,
    sourceTemplateForRefactor: CFNTemplate,
    destinationTemplateForRefactor: CFNTemplate,
  ) {
    const resourceMappings = [];
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
    console.log(`Moving ${category} resources from ${this.getSourceToDestinationMessage(isRevert)} stack...`);
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
    console.log(`Rolling back Gen2 ${category} stack...`);
    const gen2StackUpdateStatus = await tryUpdateStack(this.cfnClient, gen2CategoryStackId, gen2StackParameters ?? [], oldGen2Template);
    assert(gen2StackUpdateStatus === CFNStackStatus.UPDATE_COMPLETE, `Gen2 Stack in a failed state: ${gen2StackUpdateStatus}.`);
    console.log(`Rolled back Gen2 ${category} stack successfully`);
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
    const { Outputs } = describeStackResponseForSourceTemplate;
    assert(Outputs);
    assert(this.region);
    const newSourceTemplateWithOutputsResolved = new CfnOutputResolver(newSourceTemplate, this.region, this.accountId).resolve(
      sourceLogicalIds,
      Outputs,
    );
    const newSourceTemplateWithDepsResolved = new CfnDependencyResolver(newSourceTemplateWithOutputsResolved).resolve(sourceLogicalIds);
    if (category === 'auth' || category === 'auth-user-pool-group') {
      const { StackResources: AuthStackResources } = await this.cfnClient.send(
        new DescribeStackResourcesCommand({
          StackName: sourceCategoryStackId,
        }),
      );
      assert(AuthStackResources);
      const roleResources = AuthStackResources.filter((resource) => resource.ResourceType === CFN_IAM_TYPE.Role);
      assert(roleResources.length > 0);
      if (category === 'auth') {
        const identityPoolRoleMapLogicalId = sourceLogicalIds.find((sourceLogicalId) =>
          sourceLogicalId.includes(GEN2_AUTH_LOGICAL_RESOURCE_ID.IDENTITY_POOL_ROLE_ATTACHMENT),
        );
        assert(identityPoolRoleMapLogicalId);
        const roles = newSourceTemplateWithDepsResolved.Resources[identityPoolRoleMapLogicalId].Properties.Roles;
        assert(typeof roles === 'object' && UNAUTH_ROLE_NAME in roles && AUTH_ROLE_NAME in roles);
        const unAuthRoleArn = roles[UNAUTH_ROLE_NAME];
        const authRoleArn = roles[AUTH_ROLE_NAME];
        const physicalUnAuthRoleArn = this.resolveFnGetAttRoleArn(roleResources, unAuthRoleArn);
        assert(physicalUnAuthRoleArn);
        roles[UNAUTH_ROLE_NAME] = this.constructRoleArn(physicalUnAuthRoleArn);
        const physicalAuthRoleArn = this.resolveFnGetAttRoleArn(roleResources, authRoleArn);
        assert(physicalAuthRoleArn);
        roles[AUTH_ROLE_NAME] = this.constructRoleArn(physicalAuthRoleArn);
      } else if (category === 'auth-user-pool-group') {
        for (const sourceLogicalId of sourceLogicalIds) {
          const groupRoleArn = newSourceTemplateWithDepsResolved.Resources[sourceLogicalId].Properties.RoleArn;
          const physicalGroupRoleArn = this.resolveFnGetAttRoleArn(roleResources, groupRoleArn);
          assert(physicalGroupRoleArn);
          newSourceTemplateWithDepsResolved.Resources[sourceLogicalId].Properties.RoleArn = this.constructRoleArn(physicalGroupRoleArn);
        }
      }
    }
    return categoryTemplateGenerator.generateRefactorTemplates(
      sourceResourcesToRemove,
      new Map<string, CFNResource>(),
      newSourceTemplateWithDepsResolved,
      newDestinationTemplate,
      this.buildSourceToDestinationMapForRevert(sourceResourcesToRemove),
    );
  }

  private resolveFnGetAttRoleArn(roleResources: StackResource[], roleArn: unknown) {
    if (
      roleArn &&
      typeof roleArn === 'object' &&
      CFN_FN_GET_ATTTRIBUTE in roleArn &&
      Array.isArray(roleArn[CFN_FN_GET_ATTTRIBUTE]) &&
      roleArn[CFN_FN_GET_ATTTRIBUTE].length > 0 &&
      roleArn[CFN_FN_GET_ATTTRIBUTE][1] === 'Arn'
    ) {
      const roleLogicalId = roleArn[CFN_FN_GET_ATTTRIBUTE][0];
      const role = roleResources.find((resource) => resource.LogicalResourceId === roleLogicalId);
      return role?.PhysicalResourceId;
    }
    return undefined;
  }

  private getSourceToDestinationMessage(revert: boolean) {
    return revert ? [...SOURCE_TO_DESTINATION_STACKS].reverse().join(SEPARATOR) : SOURCE_TO_DESTINATION_STACKS.join(SEPARATOR);
  }

  private constructRoleArn(roleName: string) {
    return `arn:aws:iam::${this.accountId}:role/${roleName}`;
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
