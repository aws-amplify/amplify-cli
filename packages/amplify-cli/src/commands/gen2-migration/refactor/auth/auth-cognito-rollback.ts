import { ResourceMapping } from '@aws-sdk/client-cloudformation';
import { AmplifyError } from '@aws-amplify/amplify-cli-core';
import { CFNResource } from '../../_common/cfn-template';
import { AmplifyMigrationOperation } from '../../_common/operation';
import { RefactorBlueprint } from '../workflow/category-refactorer';
import { RollbackCategoryRefactorer } from '../workflow/rollback-category-refactorer';
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
  USER_POOL_DOMAIN_TYPE,
  USER_POOL_IDENTITY_PROVIDER_TYPE,
  SocialAuthOperationContext,
  buildImportSocialAuthOperation,
  buildOrphanSocialAuthOperation,
} from './auth-cognito-forward';

/**
 * Resource types that were imported into Gen2 by the forward step and must be
 * orphaned from Gen2 during rollback. These types are NOT in RESOURCE_TYPES
 * (the core refactor types), so the standard Gen2→Gen1 move does not attempt
 * to move them. Instead, they are orphaned from Gen2's template after the
 * core resources return to Gen1. Physical resources survive via
 * DeletionPolicy: Retain (set during the forward import).
 */
const IMPORTED_RESOURCE_TYPES = [USER_POOL_DOMAIN_TYPE, USER_POOL_IDENTITY_PROVIDER_TYPE];

/**
 * Rollback refactorer for the auth:Cognito resource.
 *
 * Moves core auth resources from Gen2 back to Gen1. For social auth apps,
 * move() orphans the imported domain/IDPs from Gen2 (Retain keeps physical
 * resources alive), then afterMove() re-imports Gen2's originals back.
 * See ADR-005 Addendum for the full orphan+import design.
 */
export class AuthCognitoRollbackRefactorer extends RollbackCategoryRefactorer {
  /**
   * Returns the core Cognito resource types. UserPoolDomain and
   * UserPoolIdentityProvider are intentionally excluded from the refactor move
   * — they are orphaned from Gen2 separately in move() (inverse of the
   * forward import step).
   */
  protected resourceTypes(): string[] {
    return RESOURCE_TYPES;
  }

  /**
   * Safety net: exclude domain/IDP from refactor mappings even though
   * resourceTypes() already filters them out.
   */
  protected async buildResourceMappings(
    sourceResources: Map<string, CFNResource>,
    targetResources: Map<string, CFNResource>,
    sourceStackId: string,
    targetStackId: string,
  ): Promise<ResourceMapping[]> {
    const filtered = new Map([...sourceResources].filter(([, r]) => !IMPORTED_RESOURCE_TYPES.includes(r.Type)));
    return super.buildResourceMappings(filtered, targetResources, sourceStackId, targetStackId);
  }

  protected async fetchSourceStackId(): Promise<string | undefined> {
    return this.findNestedStack(this.gen2Branch, 'auth');
  }

  protected async fetchDestStackId(): Promise<string | undefined> {
    return this.findNestedStack(this.gen1Env, `auth${this.resource.resourceName}`);
  }

  /**
   * Executes the standard Gen2→Gen1 resource rollback, then orphans any
   * imported social auth resources (domain + IDPs) from the Gen2 stack.
   */
  protected override async move(blueprint: RefactorBlueprint): Promise<AmplifyMigrationOperation[]> {
    const baseOps = await super.move(blueprint);

    const orphanOp = await buildOrphanSocialAuthOperation(this.operationContext(), blueprint.sourceStackId, 'forward-import');
    if (orphanOp) {
      return [...baseOps, orphanOp];
    }

    return baseOps;
  }

  /**
   * Restores P2 core resources from holding, then re-imports Gen2's
   * domain/IDPs. Plan-time template still has them (move's orphan runs at
   * execute). Execute-time discovers P2 UserPool and runs the import.
   */
  protected override async afterMove(gen2StackId: string): Promise<AmplifyMigrationOperation[]> {
    const baseOps = await super.afterMove(gen2StackId);

    const importOp = await buildImportSocialAuthOperation(this.operationContext(), gen2StackId);
    if (importOp) {
      return [...baseOps, importOp];
    }

    return baseOps;
  }

  /**
   * Packages the protected dependencies the shared social-auth operation
   * builders need into a SocialAuthOperationContext.
   */
  private operationContext(): SocialAuthOperationContext {
    return {
      cfn: this.cfn,
      gen1App: this.gen1App,
      gen2Branch: this.gen2Branch,
      resource: this.resource,
      info: (message) => this.info(message),
      debug: (message) => this.debug(message),
    };
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
        // UserPoolDomain is handled via orphan + import, not the refactor move.
        return undefined;
    }
  }
}
