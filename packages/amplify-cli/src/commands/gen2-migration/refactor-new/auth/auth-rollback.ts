import { AmplifyError } from '@aws-amplify/amplify-cli-core';
import { CFNResource } from '../cfn-template';
import { RefactorOperation } from '../refactorer';
import { ResolvedStack } from '../workflow/category-refactorer';
import { RollbackCategoryRefactorer } from '../workflow/rollback-category-refactorer';
import { discoverGen1AuthStacks } from './auth-utils';

const MAIN_AUTH_RESOURCE_TYPES = [
  'AWS::Cognito::UserPool',
  'AWS::Cognito::UserPoolClient',
  'AWS::Cognito::IdentityPool',
  'AWS::Cognito::IdentityPoolRoleAttachment',
  'AWS::Cognito::UserPoolDomain',
];

const USER_POOL_GROUP_RESOURCE_TYPE = 'AWS::Cognito::UserPoolGroup';

const ALL_AUTH_RESOURCE_TYPES = [...MAIN_AUTH_RESOURCE_TYPES, USER_POOL_GROUP_RESOURCE_TYPE, 'AWS::IAM::Role'];

const GEN2_NATIVE_APP_CLIENT = 'UserPoolNativeAppClient';
const GEN2_AMPLIFY_AUTH_LOGICAL_ID_PREFIX = 'amplifyAuth';

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
 * Handles one Gen2 source → two Gen1 destinations (main auth + UserPoolGroups).
 * Overrides plan() to handle one source stack mapping to multiple destinations.
 */
export class AuthRollbackRefactorer extends RollbackCategoryRefactorer {
  protected resourceTypes(): string[] {
    return ALL_AUTH_RESOURCE_TYPES;
  }

  public override async plan(): Promise<RefactorOperation[]> {
    const gen2StackId = await this.findNestedStack(this.gen2Branch, 'auth');
    const { mainAuthStackId, userPoolGroupStackId } = await discoverGen1AuthStacks(this.gen1Env);

    if (!gen2StackId && !mainAuthStackId) return [];
    if (!gen2StackId || !mainAuthStackId) {
      throw new AmplifyError('InvalidStackError', {
        message: `Auth category exists in ${gen2StackId ? 'source' : 'destination'} but not ${
          gen2StackId ? 'destination' : 'source'
        } stack`,
      });
    }

    const source = await this.resolveSource(gen2StackId);

    // Split source resources into main auth and UserPoolGroup
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

    const mainAuthTarget = await this.resolveTarget(mainAuthStackId);
    const userPoolGroupTarget = userPoolGroupStackId ? await this.resolveTarget(userPoolGroupStackId) : undefined;

    // First move: main auth resources from Gen2 → Gen1 main auth
    const mainAuthSource: ResolvedStack = { ...source, resourcesToMove: mainAuthResources };
    const mainAuthIdMap = this.buildMainAuthRollbackMappings(mainAuthResources);
    const { finalSource: gen2AfterMainAuth, finalTarget: finalMainAuthDest } = this.buildRefactorTemplates(
      mainAuthSource,
      mainAuthTarget.resolvedTemplate,
      mainAuthIdMap,
    );
    const mainAuthMoveOps = this.buildMoveOperations(gen2StackId, mainAuthStackId, gen2AfterMainAuth, finalMainAuthDest, mainAuthIdMap);

    // Second move: UserPoolGroup resources — uses gen2AfterMainAuth as starting point
    let finalGen2 = gen2AfterMainAuth;
    const userPoolGroupOps: RefactorOperation[] = [];
    if (userPoolGroupStackId && userPoolGroupTarget && userPoolGroupResources.size > 0) {
      const userPoolGroupSource: ResolvedStack = {
        ...source,
        resolvedTemplate: gen2AfterMainAuth, // Post-first-move Gen2 template
        resourcesToMove: userPoolGroupResources,
      };
      const userPoolGroupIdMap = this.buildUserPoolGroupRollbackMappings(userPoolGroupResources);
      const { finalSource: gen2AfterBoth, finalTarget: finalUserPoolGroupDest } = this.buildRefactorTemplates(
        userPoolGroupSource,
        userPoolGroupTarget.resolvedTemplate,
        userPoolGroupIdMap,
      );
      finalGen2 = gen2AfterBoth;
      userPoolGroupOps.push(
        ...this.buildMoveOperations(gen2StackId, userPoolGroupStackId, gen2AfterBoth, finalUserPoolGroupDest, userPoolGroupIdMap),
      );
    }

    // Assemble — no updateSource/updateTarget for rollback
    const ops: RefactorOperation[] = [];
    ops.push(...mainAuthMoveOps);
    ops.push(...userPoolGroupOps);
    ops.push(...this.afterMovePlan({ source, target: mainAuthTarget, finalSource: finalGen2, finalTarget: finalMainAuthDest }).operations);
    return ops;
  }

  // Required by abstract base but not used (plan() is overridden)
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

  /**
   * Main auth rollback: NativeAppClient → 'UserPoolClient', others → known Gen1 logical ID.
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
   * UserPoolGroup rollback: strip amplifyAuth prefix and 8-char CDK hash suffix.
   * Gen2 format: amplifyAuth<Gen1LogicalId><8-char hash>
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
      mapping.set(sourceId, suffix.slice(0, suffix.length - 8));
    }
    return mapping;
  }
}
