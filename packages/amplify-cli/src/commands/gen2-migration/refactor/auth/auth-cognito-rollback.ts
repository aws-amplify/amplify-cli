import { AmplifyError } from '@aws-amplify/amplify-cli-core';
import { CFNResource } from '../../_common/cfn-template';
import { AmplifyMigrationOperation } from '../../_common/operation';
import { checkRetainPolicies, RefactorBlueprint } from '../workflow/category-refactorer';
import { RollbackCategoryRefactorer } from '../workflow/rollback-category-refactorer';
import { extractStackNameFromId } from '../../_common/utils';
import {
  RESOURCE_TYPES,
  GEN1_NATIVE_APP_CLIENT,
  GEN1_WEB_CLIENT,
  GEN2_NATIVE_APP_CLIENT,
  GEN2_WEB_CLIENT,
  USER_POOL_CLIENT_TYPE,
  USER_POOL_TYPE,
  IDENTITY_POOL_TYPE,
  IDENTITY_POOL_ROLE_ATTACHMENT_TYPE,
  buildImportSpec,
  extractImportLogicalIds,
  extractSocialAuthLogicalIds,
  renderImportTable,
} from './auth-cognito-forward';

/**
 * Rollback refactorer for the auth:Cognito resource.
 *
 * Moves main auth resources from Gen2 back to Gen1.
 *
 * For social auth apps, the Gen2 imported UserPoolDomain and
 * UserPoolIdentityProvider resources are orphaned from Gen2 in move().
 * Gen2's original domain and IDPs are re-imported in afterMove().
 */
export class AuthCognitoRollbackRefactorer extends RollbackCategoryRefactorer {
  protected resourceTypes(): string[] {
    return RESOURCE_TYPES;
  }

  protected async fetchSourceStackId(): Promise<string | undefined> {
    return this.findNestedStack(this.gen2Branch, 'auth');
  }

  protected async fetchDestStackId(): Promise<string | undefined> {
    return this.findNestedStack(this.gen1Env, `auth${this.resource.resourceName}`);
  }

  /**
   * Moves resources from Gen2 back to Gen1
   *
   * For social auth:
   * Orphans the imported UserPoolDomain / UserPoolIdentityProvider from Gen2
   * (DeletionPolicy: Retain, set by forward's import, ensures the physical
   * Cognito resources survive)
   */
  protected override async move(blueprint: RefactorBlueprint): Promise<AmplifyMigrationOperation[]> {
    const baseOps = await super.move(blueprint);

    const gen2StackId = blueprint.sourceStackId;
    const template = await this.cfn.fetchTemplate(gen2StackId);
    const socialProvidersResourceIds = extractSocialAuthLogicalIds(template);

    if (socialProvidersResourceIds) {
      const gen2StackName = extractStackNameFromId(gen2StackId);
      baseOps.push({
        resource: this.resource,
        validate: () => ({
          description: `Deletion Protection: ${gen2StackName}`,
          run: async () => checkRetainPolicies(template, socialProvidersResourceIds),
        }),
        describe: async () => [
          `Orphan ${
            socialProvidersResourceIds.length
          } imported social auth resource(s) from '${gen2StackName}': ${socialProvidersResourceIds.join(', ')}`,
        ],
        execute: () =>
          this.cfn.orphan({
            stackName: gen2StackId,
            logicalIds: socialProvidersResourceIds,
            resource: this.resource,
          }),
      });
    }

    return baseOps;
  }

  /**
   * Restores holding-stack resources into Gen2
   *
   * For social auth:
   * Imports Gen2's original UserPoolDomain / UserPoolIdentityProvider back
   * under the Gen2 logical IDs. Runs after super.afterMove() so the UserPool
   * is back in Gen2 when the import references it.
   */
  protected override async afterMove(gen2StackId: string): Promise<AmplifyMigrationOperation[]> {
    const baseOps = await super.afterMove(gen2StackId);

    const template = await this.cfn.fetchTemplate(gen2StackId);
    const importTargets = extractImportLogicalIds(template);
    if (!importTargets) return baseOps;

    const { domainLogicalId, idpLogicalIds } = importTargets;
    const gen2StackName = extractStackNameFromId(gen2StackId);

    // The Gen2-original UserPool sits in the holding stack at plan time
    // (super.afterMove() restores it to Gen2 only at execute time), so we
    // read the pool ID from there.
    const holdingStackName = this.getHoldingStackName(gen2StackName);
    const holdingStack = await this.cfn.findStack(holdingStackName);
    if (!holdingStack) return baseOps;

    // The holding stack is a workflow artifact, not a nested stack under
    // gen2Branch's root — but StackFacade methods are stackId-parameterized,
    // so the call reads the pool inside holdingStackName directly.
    const socialAuthConfig = await this.gen2Branch.fetchSocialAuthConfig(holdingStackName);
    if (!socialAuthConfig) return baseOps;

    const { resourcesToImport, templateAdditions } = buildImportSpec(socialAuthConfig, domainLogicalId, idpLogicalIds);

    baseOps.push({
      resource: this.resource,
      validate: () => undefined,
      describe: async () => [renderImportTable(resourcesToImport, gen2StackName)],
      execute: () =>
        this.cfn.importResources({
          stackName: gen2StackId,
          templateAdditions,
          resourcesToImport,
          resource: this.resource,
        }),
    });

    return baseOps;
  }

  protected targetLogicalId(sourceId: string, sourceResource: CFNResource): string | undefined {
    switch (sourceResource.Type) {
      case USER_POOL_CLIENT_TYPE: {
        if (sourceId.includes(GEN2_NATIVE_APP_CLIENT)) {
          return GEN1_NATIVE_APP_CLIENT;
        }
        if (sourceId.includes(GEN2_WEB_CLIENT)) {
          return GEN1_WEB_CLIENT;
        }
        throw new AmplifyError('MigrationError', {
          message: `Unable to determine Gen1 logical ID for UserPoolClient '${sourceId}' — expected logical ID to contain '${GEN2_NATIVE_APP_CLIENT}' or '${GEN2_WEB_CLIENT}'`,
        });
      }
      case USER_POOL_TYPE:
        return 'UserPool';
      case IDENTITY_POOL_TYPE:
        return 'IdentityPool';
      case IDENTITY_POOL_ROLE_ATTACHMENT_TYPE:
        return 'IdentityPoolRoleMap';
      default:
        return undefined;
    }
  }
}
