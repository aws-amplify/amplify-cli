import { CloudFormationClient, DescribeStackResourcesCommand } from '@aws-sdk/client-cloudformation';
import assert from 'node:assert';
import CategoryTemplateGenerator from './category-template-generator';
import fs from 'node:fs/promises';
import { CATEGORY, CFN_AUTH_TYPE, CFN_CATEGORY_TYPE, CFN_S3_TYPE, CFNResource, CFNStackStatus } from './types';
import MigrationReadmeGenerator from './migration-readme-generator';
import { pollStackForCompletionState, tryUpdateStack } from './cfn-stack-updater';
import { SSMClient } from '@aws-sdk/client-ssm';
import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
import { tryRefactorStack } from './cfn-stack-refactor-updater';

const CFN_RESOURCE_STACK_TYPE = 'AWS::CloudFormation::Stack';

const CATEGORIES: CATEGORY[] = ['auth', 'storage'];
const TEMPLATES_DIR = '.amplify/migration/templates';

class TemplateGenerator {
  private readonly categoryStackMap: Map<CATEGORY, [string, string]>;
  private readonly categoryTemplateGenerators: [CATEGORY, string, string, CategoryTemplateGenerator<CFN_CATEGORY_TYPE>][];
  private region: string | undefined;
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

  public async generate() {
    await fs.mkdir(TEMPLATES_DIR, { recursive: true });
    this.region = await this.cfnClient.config.region();
    await this.parseCategoryStacks();
    return await this.generateCategoryTemplates();
  }

  private async parseCategoryStacks(): Promise<void> {
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
    assert(sourceStackResources, 'Invalid source stack resources');
    assert(destStackResources, 'Invalid dest stack resources');
    const gen1CategoryStacks = sourceStackResources?.filter((stackResource) => stackResource.ResourceType === CFN_RESOURCE_STACK_TYPE);
    const gen2CategoryStacks = destStackResources?.filter((stackResource) => stackResource.ResourceType === CFN_RESOURCE_STACK_TYPE);
    assert(gen1CategoryStacks && gen1CategoryStacks?.length > 0, 'No gen1 category stack found');
    assert(gen2CategoryStacks && gen2CategoryStacks?.length > 0, 'No gen2 category stack found');
    for (const { LogicalResourceId: Gen1LogicalResourceId, PhysicalResourceId: Gen1PhysicalResourceId } of gen1CategoryStacks) {
      const category = CATEGORIES.find((category) => Gen1LogicalResourceId?.startsWith(category));
      if (!category) continue;
      assert(Gen1PhysicalResourceId);
      if (category === 'auth') {
        const { StackResources: AuthStackResources } = await this.cfnClient.send(
          new DescribeStackResourcesCommand({
            StackName: Gen1PhysicalResourceId,
          }),
        );
        assert(AuthStackResources);
        if (AuthStackResources.some((authResource) => authResource.ResourceType === CFN_AUTH_TYPE.UserPoolGroups)) {
          console.log('Skipping moving of user pool groups.');
          continue;
        }
      }

      const correspondingCategoryStackInGen2 = gen2CategoryStacks.find(({ LogicalResourceId: Gen2LogicalResourceId }) =>
        Gen2LogicalResourceId?.startsWith(category),
      );
      if (!correspondingCategoryStackInGen2) {
        throw new Error(`No corresponding category found in Gen2 for ${category} category`);
      }
      const Gen2PhysicalResourceId = correspondingCategoryStackInGen2.PhysicalResourceId;
      assert(Gen2PhysicalResourceId);
      this.categoryStackMap.set(category, [Gen1PhysicalResourceId, Gen2PhysicalResourceId]);
    }
  }

  private async generateCategoryTemplates() {
    assert(this.region);
    for (const [category, [gen1CategoryStackId, gen2CategoryStackId]] of this.categoryStackMap.entries()) {
      switch (category) {
        case 'auth': {
          // We have 2 user pool clients in Gen1, but only 1 in Gen2. We are defaulting to moving Web client from Gen1.
          // The native user pool will be code-genned as a CDK override.
          const resourcesToMovePredicate = (resourcesToMove: CFN_CATEGORY_TYPE[], [logicalResourceId, value]: [string, CFNResource]) =>
            (value.Type === CFN_AUTH_TYPE.UserPoolClient && logicalResourceId.endsWith('Web')) ||
            (value.Type !== CFN_AUTH_TYPE.UserPoolClient &&
              resourcesToMove.some((resourceToMove) => resourceToMove.valueOf() === value.Type));
          this.categoryTemplateGenerators.push([
            category,
            gen1CategoryStackId,
            gen2CategoryStackId,
            new CategoryTemplateGenerator(
              gen1CategoryStackId,
              gen2CategoryStackId,
              this.region,
              this.accountId,
              this.cfnClient,
              this.ssmClient,
              this.cognitoIdpClient,
              this.appId,
              this.environmentName,
              [
                CFN_AUTH_TYPE.UserPool,
                CFN_AUTH_TYPE.UserPoolClient,
                CFN_AUTH_TYPE.IdentityPool,
                CFN_AUTH_TYPE.IdentityPoolRoleAttachment,
                CFN_AUTH_TYPE.UserPoolDomain,
                CFN_AUTH_TYPE.UserPoolGroups,
              ],
              resourcesToMovePredicate,
            ),
          ]);
          break;
        }
        case 'storage': {
          this.categoryTemplateGenerators.push([
            category,
            gen1CategoryStackId,
            gen2CategoryStackId,
            new CategoryTemplateGenerator(
              gen1CategoryStackId,
              gen2CategoryStackId,
              this.region,
              this.accountId,
              this.cfnClient,
              this.ssmClient,
              this.cognitoIdpClient,
              this.appId,
              this.environmentName,
              [CFN_S3_TYPE.Bucket],
            ),
          ]);
          break;
        }
      }
    }

    for (const [category, gen1CategoryStackId, gen2CategoryStackId, categoryTemplateGenerator] of this.categoryTemplateGenerators) {
      const categoryDir = `${TEMPLATES_DIR}/${category}`;
      await fs.mkdir(categoryDir, { recursive: true });
      const migrationReadMeGenerator = new MigrationReadmeGenerator({
        path: categoryDir,
        category,
        gen1CategoryStackId,
        gen2CategoryStackId,
      });
      await migrationReadMeGenerator.initialize();

      const { newTemplate: newGen1Template, parameters: gen1StackParameters } =
        await categoryTemplateGenerator.generateGen1PreProcessTemplate();
      assert(gen1StackParameters);
      console.log(`Updating Gen1 ${category} stack...`);
      const gen1StackUpdateStatus = await tryUpdateStack(this.cfnClient, gen1CategoryStackId, gen1StackParameters, newGen1Template);
      assert(gen1StackUpdateStatus === CFNStackStatus.UPDATE_COMPLETE);
      console.log(`Updated Gen1 ${category} stack successfully`);

      const {
        newTemplate: newGen2Template,
        oldTemplate: oldGen2Template,
        parameters: gen2StackParameters,
      } = await categoryTemplateGenerator.generateGen2ResourceRemovalTemplate();
      console.log(`Updating Gen2 ${category} stack...`);
      const gen2StackUpdateStatus = await tryUpdateStack(this.cfnClient, gen2CategoryStackId, gen2StackParameters ?? [], newGen2Template);
      assert(gen2StackUpdateStatus === CFNStackStatus.UPDATE_COMPLETE);
      console.log(`Updated Gen2 ${category} stack successfully`);

      const { sourceTemplate, destinationTemplate, logicalIdMapping } = categoryTemplateGenerator.generateStackRefactorTemplates(
        newGen1Template,
        newGen2Template,
      );
      const resourceMappings = [];
      for (const [gen1LogicalId, gen2LogicalId] of logicalIdMapping) {
        resourceMappings.push({
          Source: {
            StackName: gen1CategoryStackId,
            LogicalResourceId: gen1LogicalId,
          },
          Destination: {
            StackName: gen2CategoryStackId,
            LogicalResourceId: gen2LogicalId,
          },
        });
      }
      console.log(`Moving ${category} resources from Gen1 to Gen2 stack...`);
      const [success, failedRefactorMetadata] = await tryRefactorStack(this.cfnClient, {
        StackDefinitions: [
          {
            TemplateBody: JSON.stringify(sourceTemplate),
            StackName: gen1CategoryStackId,
          },
          {
            TemplateBody: JSON.stringify(destinationTemplate),
            StackName: gen2CategoryStackId,
          },
        ],
        ResourceMappings: resourceMappings,
      });
      if (!success) {
        console.log(
          `Moving ${category} resources from Gen1 to Gen2 stack failed. Reason: ${failedRefactorMetadata?.reason}. Status: ${failedRefactorMetadata?.status}. RefactorId: ${failedRefactorMetadata?.stackRefactorId}.`,
        );
        await pollStackForCompletionState(this.cfnClient, gen2CategoryStackId, 30);
        console.log(`Rolling back Gen2 ${category} stack...`);
        const gen2StackUpdateStatus = await tryUpdateStack(this.cfnClient, gen2CategoryStackId, gen2StackParameters ?? [], oldGen2Template);
        assert(gen2StackUpdateStatus === CFNStackStatus.UPDATE_COMPLETE);
        console.log(`Rolled back Gen2 ${category} stack successfully`);
        return false;
      } else {
        console.log(`Moved ${category} resources from Gen1 to Gen2 stack successfully`);
        await migrationReadMeGenerator.renderStep2();
      }
    }
    return true;
  }
}

export { TemplateGenerator };
