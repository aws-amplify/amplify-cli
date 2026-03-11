import { AmplifyError } from '@aws-amplify/amplify-cli-core';
import { CFNResource, CFNTemplate } from '../cfn-template';
import { RefactorOperation } from '../refactorer';
import { ResolvedStack } from '../workflow/category-refactorer';
import { RollbackCategoryRefactorer } from '../workflow/rollback-category-refactorer';

/**
 * Main auth resource types (excluding UserPoolGroup — those go to a separate Gen1 stack).
 */
const MAIN_AUTH_RESOURCE_TYPES = [
  'AWS::Cognito::UserPool',
  'AWS::Cognito::UserPoolClient',
  'AWS::Cognito::IdentityPool',
  'AWS::Cognito::IdentityPoolRoleAttachment',
  'AWS::Cognito::UserPoolDomain',
];

const USER_POOL_GROUP_RESOURCE_TYPE = 'AWS::Cognito::UserPoolGroup';

/**
 * All auth resource types (used for resolveSource filtering).
 */
const ALL_AUTH_RESOURCE_TYPES = [...MAIN_AUTH_RESOURCE_TYPES, USER_POOL_GROUP_RESOURCE_TYPE, 'AWS::IAM::Role'];

const GEN2_NATIVE_APP_CLIENT = 'UserPoolNativeAppClient';
const GEN2_AMPLIFY_AUTH_LOGICAL_ID_PREFIX = 'amplifyAuth';
const GEN1_AUTH_STACK_TYPE_DESCRIPTION = 'auth-Cognito';
const GEN1_USER_POOL_GROUPS_STACK_TYPE_DESCRIPTION = 'auth-Cognito-UserPool-Groups';

/**
 * Known Gen1 logical resource IDs for main auth resource types.
 */
const GEN1_AUTH_LOGICAL_IDS = new Map<string, string>([
  ['AWS::Cognito::UserPool', 'UserPool'],
  ['AWS::Cognito::UserPoolClient', 'UserPoolClientWeb'],
  ['AWS::Cognito::IdentityPool', 'IdentityPool'],
  ['AWS::Cognito::IdentityPoolRoleAttachment', 'IdentityPoolRoleMap'],
  ['AWS::Cognito::UserPoolDomain', 'UserPoolDomain'],
]);

/**
 * Rollback refactorer for the auth category.
 *
 * Handles the reverse of the two-source-stack case: Gen2 (one stack) → Gen1 (two stacks).
 * Main auth resources go to Gen1 main auth stack. UserPoolGroup resources go to Gen1
 * UserPoolGroups stack (if it exists).
 *
 * Overrides plan() to handle one source stack mapping to multiple destinations.
 */
export class AuthRollbackRefactorer extends RollbackCategoryRefactorer {
  protected resourceTypes(): string[] {
    return ALL_AUTH_RESOURCE_TYPES;
  }

  /**
   * Overrides plan() to handle one Gen2 source → two Gen1 destinations.
   */
  public override async plan(): Promise<RefactorOperation[]> {
    // 1. Discover stacks
    const gen2StackId = await this.findNestedStack(this.gen2Branch, 'auth');
    const { mainAuthStackId, userPoolGroupStackId } = await this.discoverGen1AuthStacks();

    if (!gen2StackId && !mainAuthStackId) return [];
    if (!gen2StackId || !mainAuthStackId) {
      throw new AmplifyError('InvalidStackError', {
        message: `Auth category exists in ${gen2StackId ? 'source' : 'destination'} but not ${
          gen2StackId ? 'destination' : 'source'
        } stack`,
      });
    }

    // 2. Resolve Gen2 source (all auth resources)
    const source = await this.resolveSource(gen2StackId);

    // 3. Split source resources into main auth and UserPoolGroup
    const mainAuthResources = new Map<string, CFNResource>();
    const userPoolGroupResources = new Map<string, CFNResource>();
    for (const [id, resource] of source.resourcesToMove) {
      if (resource.Type === USER_POOL_GROUP_RESOURCE_TYPE) {
        userPoolGroupResources.set(id, resource);
      } else {
        mainAuthResources.set(id, resource);
      }
    }

    if (mainAuthResources.size === 0) {
      throw new AmplifyError('InvalidStackError', {
        message: `No main auth resources to move in Gen2 stack '${gen2StackId}'`,
      });
    }

    // 4. Resolve Gen1 destinations
    const mainAuthTarget = await this.resolveTarget(mainAuthStackId);
    const userPoolGroupTarget = userPoolGroupStackId ? await this.resolveTarget(userPoolGroupStackId) : undefined;

    // 5. Build rollback mappings
    const mainAuthSource: ResolvedStack = { ...source, resourcesToMove: mainAuthResources };
    const mainAuthIdMap = this.buildMainAuthRollbackMappings(mainAuthResources);

    // 6. Chain buildRefactorTemplates: second move uses Gen2 template from first
    const { finalSource: gen2AfterMainAuth, finalTarget: finalMainAuthDest } = this.buildRefactorTemplates(
      mainAuthSource,
      mainAuthTarget.resolvedTemplate,
      mainAuthIdMap,
    );

    const mainAuthMoveOps = this.buildMoveOperations(gen2StackId, mainAuthStackId, gen2AfterMainAuth, finalMainAuthDest, mainAuthIdMap);

    // 7. UserPoolGroup move (if exists) — chains from gen2AfterMainAuth
    const userPoolGroupOps: RefactorOperation[] = [];
    if (userPoolGroupStackId && userPoolGroupTarget && userPoolGroupResources.size > 0) {
      const userPoolGroupSource: ResolvedStack = { ...source, resourcesToMove: userPoolGroupResources };
      const userPoolGroupIdMap = this.buildUserPoolGroupRollbackMappings(userPoolGroupResources);

      const { finalSource: gen2AfterBoth, finalTarget: finalUserPoolGroupDest } = this.buildRefactorTemplates(
        userPoolGroupSource,
        userPoolGroupTarget.resolvedTemplate,
        userPoolGroupIdMap,
      );

      // Use gen2AfterBoth as the Gen2 source template (resources from both moves removed)
      userPoolGroupOps.push(
        ...this.buildMoveOperations(gen2StackId, userPoolGroupStackId, gen2AfterBoth, finalUserPoolGroupDest, userPoolGroupIdMap),
      );
    }

    // 8. Assemble operations — no updateSource/updateTarget for rollback
    const ops: RefactorOperation[] = [];
    ops.push(...mainAuthMoveOps);
    ops.push(...userPoolGroupOps);
    ops.push(
      ...this.afterMovePlan({ source, target: mainAuthTarget, finalSource: gen2AfterMainAuth, finalTarget: finalMainAuthDest }).operations,
    );
    return ops;
  }

  // -- These are not used (plan() is overridden) but must be implemented --

  protected async fetchSourceStackId(): Promise<string | undefined> {
    return this.findNestedStack(this.gen2Branch, 'auth');
  }

  protected async fetchDestStackId(): Promise<string | undefined> {
    return this.findNestedStack(this.gen1Env, 'auth');
  }

  protected buildResourceMappings(
    sourceResources: Map<string, CFNResource>,
    _targetResources: Map<string, CFNResource>,
  ): Map<string, string> {
    return this.buildMainAuthRollbackMappings(sourceResources);
  }

  // -- Private helpers --

  /**
   * Builds rollback mappings for main auth resources.
   *
   * UserPoolClient with NativeAppClient in the name → Gen1 'UserPoolClient'.
   * Other types → known Gen1 logical ID from GEN1_AUTH_LOGICAL_IDS.
   */
  private buildMainAuthRollbackMappings(resources: Map<string, CFNResource>): Map<string, string> {
    const mapping = new Map<string, string>();
    for (const [sourceId, resource] of resources) {
      if (sourceId.includes(GEN2_NATIVE_APP_CLIENT)) {
        mapping.set(sourceId, 'UserPoolClient');
      } else {
        const gen1Id = GEN1_AUTH_LOGICAL_IDS.get(resource.Type);
        if (!gen1Id) {
          throw new AmplifyError('InvalidStackError', {
            message: `No known Gen1 logical ID for auth resource type '${resource.Type}' (source: '${sourceId}')`,
          });
        }
        mapping.set(sourceId, gen1Id);
      }
    }
    return mapping;
  }

  /**
   * Builds rollback mappings for UserPoolGroup resources.
   *
   * Gen2 logical ID format: amplifyAuth<Gen1LogicalId><8-char CDK hash>
   * Strip the prefix and hash to get the Gen1 logical ID.
   */
  private buildUserPoolGroupRollbackMappings(resources: Map<string, CFNResource>): Map<string, string> {
    const mapping = new Map<string, string>();
    for (const [sourceId] of resources) {
      const [, suffix] = sourceId.split(GEN2_AMPLIFY_AUTH_LOGICAL_ID_PREFIX);
      if (!suffix || suffix.length <= 8) {
        throw new AmplifyError('InvalidStackError', {
          message: `Cannot extract Gen1 logical ID from UserPoolGroup resource '${sourceId}' — unexpected format`,
        });
      }
      // Strip 8-char CDK hash suffix
      const gen1Id = suffix.slice(0, suffix.length - 8);
      mapping.set(sourceId, gen1Id);
    }
    return mapping;
  }

  /**
   * Discovers Gen1 auth stacks by parsing stack Description JSON.
   */
  private async discoverGen1AuthStacks(): Promise<{ mainAuthStackId?: string; userPoolGroupStackId?: string }> {
    const nestedStacks = await this.gen1Env.fetchNestedStacks();
    const authStacks = nestedStacks.filter((s) => s.LogicalResourceId?.startsWith('auth'));

    let mainAuthStackId: string | undefined;
    let userPoolGroupStackId: string | undefined;

    for (const stack of authStacks) {
      if (!stack.PhysicalResourceId) continue;
      const authType = await this.classifyGen1AuthStack(stack.PhysicalResourceId);
      if (authType === 'auth') {
        mainAuthStackId = stack.PhysicalResourceId;
      } else if (authType === 'auth-user-pool-group') {
        userPoolGroupStackId = stack.PhysicalResourceId;
      }
    }

    return { mainAuthStackId, userPoolGroupStackId };
  }

  /**
   * Classifies a Gen1 auth stack by parsing its Description JSON metadata.
   */
  private async classifyGen1AuthStack(stackId: string): Promise<'auth' | 'auth-user-pool-group' | null> {
    const description = await this.gen1Env.fetchStackDescription(stackId);
    const stackDescription = description.Description;
    if (!stackDescription) return null;

    try {
      const parsed = JSON.parse(stackDescription);
      if (typeof parsed === 'object' && 'stackType' in parsed) {
        if (parsed.stackType === GEN1_AUTH_STACK_TYPE_DESCRIPTION) return 'auth';
        if (parsed.stackType === GEN1_USER_POOL_GROUPS_STACK_TYPE_DESCRIPTION) return 'auth-user-pool-group';
      }
    } catch {
      // Description might not be valid JSON
    }
    return null;
  }
}
