import { ResourceMapping } from '@aws-sdk/client-cloudformation';
import { AmplifyError } from '@aws-amplify/amplify-cli-core';
import { CFNResource } from '../../_infra/cfn-template';
import { AmplifyMigrationOperation } from '../../_infra/operation';
import { RefactorBlueprint } from '../workflow/category-refactorer';
import { RollbackCategoryRefactorer } from '../workflow/rollback-category-refactorer';
import { extractStackNameFromId } from '../utils';
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
  buildImportSpec,
  discoverUserPoolId,
  fetchSocialAuthConfig,
} from './auth-cognito-forward';
import CLITable from 'cli-table3';

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
 * Moves main auth resources (UserPool, UserPoolClient, IdentityPool,
 * IdentityPoolRoleAttachment) from Gen2 back to Gen1 via holding-stack
 * restoration.
 *
 * For social auth apps:
 *   - move() orphans the Gen2 UserPoolDomain and UserPoolIdentityProvider
 *     resources (imported during forward move) after the core Gen2→Gen1 move.
 *     Physical resources survive via DeletionPolicy: Retain and remain on the
 *     (now Gen1) UserPool. Gen1's LambdaCallout custom resources
 *     (HostedUICustomResourceInputs, HostedUIProvidersCustomResourceInputs) will
 *     recreate/update them as needed on the next Gen1 deploy.
 *   - afterMove() (after super.afterMove() restores P2 core resources from the
 *     holding stack) re-imports Gen2's original IDPs + domain back into Gen2
 *     under the Gen2 original logical IDs. This mirrors forward's import step
 *     so rollback produces a Gen2 stack state equivalent to the pre-refactor
 *     state.
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
   * Excludes domain and IDP resources from the Gen2→Gen1 refactor mappings.
   * Even though RESOURCE_TYPES already excludes these types (so they are
   * filtered out by filterResourcesByType), this filter remains as a safety
   * net — if a future change adds them to RESOURCE_TYPES for the forward
   * direction, rollback would still correctly exclude them from the move.
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

    const orphanOp = await this.buildOrphanSocialAuthOperation(blueprint.sourceStackId);
    if (orphanOp) {
      return [...baseOps, orphanOp];
    }

    return baseOps;
  }

  /**
   * Executes the standard afterMove (restores P2 core resources from the
   * holding stack into Gen2), then re-imports Gen2's original domain and IDPs
   * back into Gen2.
   *
   * Plan-time: capture `{providerName → logicalId}` and the domain logical ID
   * from the Gen2 template. Plan-time reads see the Gen2 original logical IDs
   * because rollback's move() orphan runs at EXECUTE time; at plan time the
   * Gen2 template still contains the imported IDP/domain resources.
   *
   * Execute-time: after super.afterMove() restores P2 into Gen2, discover the
   * UserPool (P2), fetch domain/IDP list from Cognito, and run the import.
   */
  protected override async afterMove(gen2StackId: string): Promise<AmplifyMigrationOperation[]> {
    const baseOps = await super.afterMove(gen2StackId);

    const importOp = await this.buildImportSocialAuthOperation(gen2StackId);
    if (importOp) {
      return [...baseOps, importOp];
    }

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

  /**
   * Builds an operation that orphans imported social auth resources from the Gen2 stack.
   * Resources have DeletionPolicy: Retain (set during forward import), so removing
   * them from the template does not delete the physical resources.
   */
  private async buildOrphanSocialAuthOperation(gen2StackId: string): Promise<AmplifyMigrationOperation | undefined> {
    const template = await this.cfn.fetchTemplate(gen2StackId);

    const logicalIdsToOrphan = Object.entries(template.Resources)
      .filter(([, r]) => IMPORTED_RESOURCE_TYPES.includes(r.Type))
      .map(([id]) => id);

    if (logicalIdsToOrphan.length === 0) {
      return undefined;
    }

    const gen2StackName = extractStackNameFromId(gen2StackId);

    return {
      resource: this.resource,
      // Retain is established by the forward refactor's buildImportSpec (which sets DeletionPolicy: Retain on
      // every imported IDP/domain resource). We verify at execute time, not plan-validation time, because
      // plan.validate() runs ALL operation validate() callbacks before ANY execute(). Checking here during
      // plan-validation would see state that predates the earlier execute() side effects (in a fresh rollback
      // the invariant holds immediately, but keeping the check symmetric with forward avoids the anti-pattern
      // of cross-operation dependencies at plan-validation time). If the invariant is somehow violated (e.g.
      // manual template edits between plan and execute), we abort before any destructive template mutation
      // — missing Retain would cause the subsequent cfn.update to delete the physical resource.
      validate: () => undefined,
      describe: async () => [
        `Orphan ${logicalIdsToOrphan.length} imported social auth resource(s) from '${gen2StackName}': ${logicalIdsToOrphan.join(', ')}`,
      ],
      execute: async () => {
        const currentTemplate = await this.cfn.fetchTemplate(gen2StackId);

        // Execute-time Retain verification (defense-in-depth). See the comment on validate above for why
        // this runs here rather than in validate(). Orphaning without Retain would delete the physical
        // UserPoolDomain / UserPoolIdentityProvider.
        const missingRetain = logicalIdsToOrphan.filter(
          (id) => id in currentTemplate.Resources && currentTemplate.Resources[id].DeletionPolicy !== 'Retain',
        );
        if (missingRetain.length > 0) {
          throw new AmplifyError('MigrationError', {
            message:
              `Cannot orphan imported social auth resources from '${gen2StackName}': the following resources are missing ` +
              `DeletionPolicy: Retain and would be physically deleted: ${missingRetain.join(', ')}.`,
            resolution: 'Inspect the Gen2 template; the forward refactor should have set Retain on these resources during import.',
          });
        }

        const stack = await this.cfn.describeStack(gen2StackId);

        for (const id of logicalIdsToOrphan) {
          delete currentTemplate.Resources[id];
        }

        await this.cfn.update({
          stackName: gen2StackId,
          templateBody: currentTemplate,
          parameters: stack.Parameters ?? [],
          resource: this.resource,
        });

        this.info(`Orphaned social auth resources from '${gen2StackName}': ${logicalIdsToOrphan.join(', ')}`);
      },
    };
  }

  /**
   * Builds an operation that re-imports Gen2's original domain and IDPs into
   * the Gen2 stack under the Gen2 original logical IDs. Returns undefined if
   * the Gen2 template has no such resources.
   *
   * Plan-time work:
   *   - Read the Gen2 template and capture `{providerName → logicalId}` and
   *     the domain logical ID into the operation closure. These are the Gen2
   *     original logical IDs (preserved through forward's import under the
   *     same logical IDs).
   *
   * Execute-time work (after super.afterMove() restores P2 into Gen2):
   *   - Discover the UserPool (P2) from the Gen2 stack resources.
   *   - Fetch domain + IDP list from Cognito for P2.
   *   - Build the import spec and execute the import changeset.
   */
  private async buildImportSocialAuthOperation(gen2StackId: string): Promise<AmplifyMigrationOperation | undefined> {
    // Plan-time: capture logical IDs from the Gen2 template. At plan time the
    // Gen2 template still contains the IDP/domain resources (imported during
    // forward); rollback's move() orphan removes them at execute time, not
    // plan time.
    const gen2Template = await this.cfn.fetchTemplate(gen2StackId);
    const gen2IdpLogicalIds = new Map<string, string>();
    let gen2DomainLogicalId: string | undefined;
    for (const [logicalId, resource] of Object.entries(gen2Template.Resources)) {
      if (resource.Type === USER_POOL_DOMAIN_TYPE) {
        gen2DomainLogicalId = logicalId;
      } else if (resource.Type === USER_POOL_IDENTITY_PROVIDER_TYPE) {
        const providerName = resource.Properties.ProviderName as string;
        if (providerName) {
          gen2IdpLogicalIds.set(providerName, logicalId);
        }
      }
    }

    if (!gen2DomainLogicalId) {
      this.debug('No Gen2 UserPoolDomain resource found — skipping rollback import');
      return undefined;
    }

    if (gen2IdpLogicalIds.size === 0) {
      this.debug('No Gen2 UserPoolIdentityProvider resources found — skipping rollback import');
      return undefined;
    }

    const domainLogicalId = gen2DomainLogicalId;
    const gen2StackName = extractStackNameFromId(gen2StackId);

    return {
      resource: this.resource,
      validate: () => undefined,
      describe: async () => {
        const table = new CLITable({
          head: ['Provider', 'Target Logical ID'],
          style: { head: [] },
        });
        table.push(['(domain)', domainLogicalId]);
        for (const [providerName, logicalId] of gen2IdpLogicalIds) {
          table.push([providerName, logicalId]);
        }
        return [`Import social auth resources into '${gen2StackName}'\n\n${table.toString()}`];
      },
      execute: async () => {
        // Execute-time: after super.afterMove() has restored P2 into Gen2,
        // discover the UserPool and import Gen2's original IDPs + domain.
        const userPoolId = await discoverUserPoolId(this.gen2Branch, gen2StackId);
        if (!userPoolId) {
          throw new AmplifyError('MigrationError', {
            message: `Unable to discover UserPool in Gen2 stack '${gen2StackName}' for social auth re-import`,
          });
        }

        const cognitoClient = this.gen1App.clients.cognitoIdentityProvider;
        const socialAuthConfig = await fetchSocialAuthConfig(cognitoClient, userPoolId);
        if (!socialAuthConfig) {
          this.debug(`UserPool ${userPoolId} has no domain or no identity providers — skipping rollback import`);
          return;
        }

        const templateForImport = await this.cfn.fetchTemplate(gen2StackId);

        const { resourcesToImport, templateAdditions } = buildImportSpec(socialAuthConfig, domainLogicalId, gen2IdpLogicalIds);

        for (const [logicalId, resource] of Object.entries(templateAdditions)) {
          templateForImport.Resources[logicalId] = resource;
        }

        await this.cfn.importResources({
          stackName: gen2StackId,
          templateBody: templateForImport,
          resourcesToImport,
          resource: this.resource,
        });
      },
    };
  }
}
