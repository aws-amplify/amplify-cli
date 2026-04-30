import { ResourceToImport } from '@aws-sdk/client-cloudformation';
import {
  CognitoIdentityProviderClient,
  DescribeUserPoolCommand,
  ListIdentityProvidersCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { AmplifyError } from '@aws-amplify/amplify-cli-core';
import { ForwardCategoryRefactorer } from '../workflow/forward-category-refactorer';
import { RefactorBlueprint } from '../workflow/category-refactorer';
import { CFNResource } from '../../_infra/cfn-template';
import { AmplifyMigrationOperation } from '../../_infra/operation';
import { extractStackNameFromId } from '../utils';
import { StackFacade } from '../stack-facade';
import CLITable from 'cli-table3';

export const GEN1_NATIVE_APP_CLIENT = 'UserPoolClient';
export const GEN1_WEB_CLIENT = 'UserPoolClientWeb';

export const GEN2_NATIVE_APP_CLIENT = 'UserPoolNativeAppClient';
export const GEN2_WEB_CLIENT = 'UserPoolAppClient';

export const USER_POOL_CLIENT_TYPE = 'AWS::Cognito::UserPoolClient';
export const USER_POOL_TYPE = 'AWS::Cognito::UserPool';
export const IDENTITY_POOL_TYPE = 'AWS::Cognito::IdentityPool';
export const IDENTITY_POOL_ROLE_ATTACHMENT_TYPE = 'AWS::Cognito::IdentityPoolRoleAttachment';
export const USER_POOL_DOMAIN_TYPE = 'AWS::Cognito::UserPoolDomain';
export const USER_POOL_IDENTITY_PROVIDER_TYPE = 'AWS::Cognito::UserPoolIdentityProvider';

/**
 * Core Cognito resource types that move through the holding stack during the
 * standard refactor. UserPoolDomain and UserPoolIdentityProvider are intentionally
 * excluded — they carry Fn::GetAtt references to AmplifySecretFetcherResource
 * (which stays in Gen2), so they cannot go through the holding stack without
 * breaking references. They are handled separately via orphan + import.
 */
export const RESOURCE_TYPES = [USER_POOL_TYPE, USER_POOL_CLIENT_TYPE, IDENTITY_POOL_TYPE, IDENTITY_POOL_ROLE_ATTACHMENT_TYPE];

export interface IdpConfig {
  readonly providerName: string;
  readonly providerType: string;
}

export interface SocialAuthConfig {
  readonly userPoolId: string;
  readonly domain: string;
  readonly providers: IdpConfig[];
}

/**
 * Fetches the domain and IDP config directly from Cognito for a given UserPool.
 *
 * CFN Import only uses ResourceIdentifier (UserPoolId + ProviderName/Domain) to
 * adopt physical resources — template property values are metadata for future
 * updates. We therefore fetch only identity information (ProviderName, ProviderType,
 * Domain). Real client_id/client_secret/scopes/AttributeMapping are NOT needed;
 * buildImportSpec() uses dummy values. The next Gen2 deploy regenerates real
 * values from AmplifySecretFetcherResource.
 *
 * Returns undefined if the pool has no domain or no identity providers.
 *
 * Exported so that both forward and rollback can reuse the same logic. The same
 * Cognito client works for both directions because P1 and P2 live in the same
 * account/region.
 */
export async function fetchSocialAuthConfig(
  cognitoClient: CognitoIdentityProviderClient,
  userPoolId: string,
): Promise<SocialAuthConfig | undefined> {
  const poolResponse = await cognitoClient.send(new DescribeUserPoolCommand({ UserPoolId: userPoolId }));
  const domain = poolResponse?.UserPool?.Domain;
  if (!domain) {
    return undefined;
  }

  const listResponse = await cognitoClient.send(new ListIdentityProvidersCommand({ UserPoolId: userPoolId }));
  const providerSummaries = listResponse?.Providers ?? [];
  if (providerSummaries.length === 0) {
    return undefined;
  }

  const providers: IdpConfig[] = [];
  for (const summary of providerSummaries) {
    const providerName = summary.ProviderName;
    if (!providerName) continue;
    providers.push({
      providerName,
      providerType: summary.ProviderType ?? providerName,
    });
  }

  return { userPoolId, domain, providers };
}

/**
 * Discovers the UserPool physical ID from a Gen2 auth stack via DescribeStackResources.
 *
 * Gen2 auth nested stack does not expose a `UserPoolId` output with a stable name
 * (CDK generates hash-suffixed output names), so we rely on the resource type to
 * find the single UserPool. Returns undefined if none is found.
 *
 * Symmetric for both directions:
 *   - Forward move() after super.move(): finds P1 (just moved in from Gen1).
 *   - Rollback afterMove() after super.afterMove(): finds P2 (just restored from holding).
 */
export async function discoverUserPoolId(facade: StackFacade, gen2StackId: string): Promise<string | undefined> {
  const resources = await facade.fetchStackResources(gen2StackId);
  const userPools = resources.filter((r) => r.ResourceType === USER_POOL_TYPE);
  if (userPools.length > 1) {
    const stackName = extractStackNameFromId(gen2StackId);
    const physicalIds = userPools.map((p) => p.PhysicalResourceId ?? '<unknown>').join(', ');
    throw new AmplifyError('MigrationError', {
      message: `Expected exactly one UserPool in stack '${stackName}', found ${userPools.length}: ${physicalIds}`,
    });
  }
  return userPools[0]?.PhysicalResourceId;
}

/**
 * Builds the CFN import spec: template additions with DeletionPolicy: Retain
 * (so rollback can orphan them without deleting the physical resources) and
 * resource identifiers for the import change set.
 *
 * Uses dummy placeholder values for ProviderDetails and an empty
 * AttributeMapping. CFN import does not validate property match — only the
 * ResourceIdentifier (UserPoolId + ProviderName/Domain) is used to adopt the
 * physical resource. The next Gen2 deploy regenerates real values via
 * AmplifySecretFetcherResource.
 *
 * Exported so that both forward and rollback can reuse the same logic. Pure
 * function — no instance state or logging.
 */
export function buildImportSpec(
  config: SocialAuthConfig,
  domainLogicalId: string,
  idpLogicalIds: Map<string, string>,
): { resourcesToImport: ResourceToImport[]; templateAdditions: Record<string, CFNResource> } {
  const resourcesToImport: ResourceToImport[] = [];
  const templateAdditions: Record<string, CFNResource> = {};

  templateAdditions[domainLogicalId] = {
    Type: USER_POOL_DOMAIN_TYPE,
    DeletionPolicy: 'Retain',
    Properties: {
      Domain: config.domain,
      UserPoolId: config.userPoolId,
    },
  };
  resourcesToImport.push({
    ResourceType: USER_POOL_DOMAIN_TYPE,
    LogicalResourceId: domainLogicalId,
    ResourceIdentifier: {
      UserPoolId: config.userPoolId,
      Domain: config.domain,
    },
  });

  for (const provider of config.providers) {
    const logicalId = idpLogicalIds.get(provider.providerName);
    if (!logicalId) {
      throw new AmplifyError('MigrationError', {
        message:
          `Identity provider '${provider.providerName}' exists on the UserPool but has no matching ` +
          `UserPoolIdentityProvider resource in the Gen2 template. Add it to amplify/auth/resource.ts ` +
          `and regenerate before refactoring.`,
      });
    }

    templateAdditions[logicalId] = {
      Type: USER_POOL_IDENTITY_PROVIDER_TYPE,
      DeletionPolicy: 'Retain',
      Properties: {
        UserPoolId: config.userPoolId,
        ProviderName: provider.providerName,
        ProviderType: provider.providerType,
        // Dummy values — CFN import does not validate property match. The next
        // Gen2 deploy regenerates real values from AmplifySecretFetcherResource.
        ProviderDetails: {
          client_id: 'PLACEHOLDER',
          client_secret: 'PLACEHOLDER',
          authorize_scopes: 'PLACEHOLDER',
        },
        AttributeMapping: {},
      },
    };

    resourcesToImport.push({
      ResourceType: USER_POOL_IDENTITY_PROVIDER_TYPE,
      LogicalResourceId: logicalId,
      ResourceIdentifier: {
        UserPoolId: config.userPoolId,
        ProviderName: provider.providerName,
      },
    });
  }

  return { resourcesToImport, templateAdditions };
}

/**
 * Forward refactorer for the auth:Cognito resource.
 *
 * Moves main auth resources (UserPool, UserPoolClient, IdentityPool,
 * IdentityPoolRoleAttachment) from Gen1 to Gen2 via the holding stack.
 *
 * For social auth apps, the Gen2 UserPoolDomain and UserPoolIdentityProvider
 * resources are orphaned from Gen2 in beforeMove() (physical resources survive
 * via DeletionPolicy: Retain). After the core resources move in during move(),
 * Gen1's physical domain and IDPs are imported into Gen2 as native CFN resources
 * — the import operation is appended to the move() phase so that the pool is
 * already in Gen2 when the import runs.
 */
export class AuthCognitoForwardRefactorer extends ForwardCategoryRefactorer {
  /**
   * Returns only the core Cognito resource types. UserPoolDomain and
   * UserPoolIdentityProvider are handled via the orphan + import path
   * (beforeMove orphans them from Gen2, move imports Gen1's).
   */
  protected resourceTypes(): string[] {
    return RESOURCE_TYPES;
  }

  /**
   * Executes the standard beforeMove (moves 4 core Cognito resources to holding),
   * then appends two additional operations in order:
   *
   *   1. super.beforeMove() — moves the 4 core Cognito types (UserPool,
   *      UserPoolClient, IdentityPool, IdentityPoolRoleAttachment) to the
   *      holding stack.
   *   2. Retain-set — adds `DeletionPolicy: Retain` to Gen2's UserPoolDomain
   *      and UserPoolIdentityProvider resources if any lack it. Idempotent:
   *      skipped entirely when every target already has Retain. Needed because
   *      `lock` only sets Retain on Gen1 LambdaCallout resources — Gen2 IDP
   *      and domain resources are out of `lock`'s scope (lock has no
   *      reference to the Gen2 stack). Without Retain, orphaning would
   *      delete the physical resources.
   *   3. Orphan — validates Retain (defense in depth — the Retain-set op
   *      just ran), then removes the IDP and domain resources from the
   *      Gen2 template in a single CFN update. CloudFormation orphans
   *      them because of DeletionPolicy: Retain; the physical IDPs and
   *      domain on the pool survive.
   *
   * If the Gen2 stack has no IDP or domain resources (non-social-auth app),
   * both the Retain-set and orphan operations are skipped.
   */
  protected override async beforeMove(gen2StackId: string): Promise<AmplifyMigrationOperation[]> {
    const baseOps = await super.beforeMove(gen2StackId);

    const retainOp = await this.buildRetainSocialAuthOperation(gen2StackId);
    const orphanOp = await this.buildOrphanSocialAuthOperation(gen2StackId);

    const extraOps: AmplifyMigrationOperation[] = [];
    if (retainOp) extraOps.push(retainOp);
    if (orphanOp) extraOps.push(orphanOp);

    return [...baseOps, ...extraOps];
  }

  /**
   * Executes the standard move (moves core Gen1 resources into Gen2), then
   * appends an import operation that re-imports Gen1's physical UserPoolDomain
   * and UserPoolIdentityProvider resources into the Gen2 stack as native CFN
   * resources.
   *
   * The import must run AFTER super.move() completes — the core move transfers
   * the Gen1 UserPool into Gen2, and the UserPool must be in the Gen2 stack
   * before we can import resources that reference it by UserPoolId.
   */
  protected override async move(blueprint: RefactorBlueprint): Promise<AmplifyMigrationOperation[]> {
    const baseOps = await super.move(blueprint);

    const importOp = await this.buildImportSocialAuthOperation(blueprint.targetStackId);
    if (importOp) {
      return [...baseOps, importOp];
    }

    return baseOps;
  }

  /**
   * Builds an operation that sets `DeletionPolicy: Retain` on Gen2's
   * UserPoolDomain and UserPoolIdentityProvider resources. Returns undefined
   * if no such resources exist in the Gen2 template, or if every one of them
   * already has Retain.
   *
   * This is idempotent: if a future `lock` update sets Retain on Gen2
   * resources, this operation short-circuits and issues no CFN update. Also
   * re-fetches the template at execute-time (in case plan-time snapshot has
   * drifted) and skips the update if every target already has Retain.
   *
   * Pattern borrowed from `lock.ts` `buildHostedUiRetainOperation`. Uses
   * `this.cfn.update()` (which wraps UpdateStackCommand + wait + IAM
   * capability) for consistency with the rest of the refactor code. Stack
   * parameters are preserved via `UsePreviousValue: true` — we don't need
   * to know actual values (many are NoEcho).
   */
  private async buildRetainSocialAuthOperation(gen2StackId: string): Promise<AmplifyMigrationOperation | undefined> {
    const template = await this.cfn.fetchTemplate(gen2StackId);

    const logicalIdsNeedingRetain = Object.entries(template.Resources)
      .filter(
        ([, r]) =>
          (r.Type === USER_POOL_DOMAIN_TYPE || r.Type === USER_POOL_IDENTITY_PROVIDER_TYPE) && r.DeletionPolicy !== 'Retain',
      )
      .map(([id]) => id);

    if (logicalIdsNeedingRetain.length === 0) {
      return undefined;
    }

    const gen2StackName = extractStackNameFromId(gen2StackId);

    return {
      resource: this.resource,
      validate: () => undefined,
      describe: async () => [
        `Set DeletionPolicy: Retain on ${logicalIdsNeedingRetain.length} social auth resource(s) in '${gen2StackName}': ${logicalIdsNeedingRetain.join(
          ', ',
        )}`,
      ],
      execute: async () => {
        // Re-fetch the template at execute time in case it has drifted since plan.
        const currentTemplate = await this.cfn.fetchTemplate(gen2StackId);

        const appliedIds: string[] = [];
        let retainAdded = false;
        for (const id of logicalIdsNeedingRetain) {
          const resource = currentTemplate.Resources[id];
          if (!resource) continue;
          if (resource.DeletionPolicy !== 'Retain') {
            resource.DeletionPolicy = 'Retain';
            retainAdded = true;
            appliedIds.push(id);
          }
        }

        if (!retainAdded) {
          this.info(`All social auth resources already have DeletionPolicy: Retain in '${gen2StackName}'`);
          return;
        }

        const stack = await this.cfn.describeStack(gen2StackId);
        const parameters = (stack.Parameters ?? []).map((p) => ({
          ParameterKey: p.ParameterKey,
          UsePreviousValue: true,
        }));

        await this.cfn.update({
          stackName: gen2StackId,
          templateBody: currentTemplate,
          parameters,
          resource: this.resource,
        });

        this.info(`Set DeletionPolicy: Retain on social auth resources in '${gen2StackName}': ${appliedIds.join(', ')}`);
      },
    };
  }

  /**
   * Builds an operation that orphans Gen2's UserPoolDomain and
   * UserPoolIdentityProvider resources from the Gen2 stack. Returns undefined
   * if the Gen2 template has no such resources (non-social-auth app).
   *
   * Validates at execute-time that every orphan target has DeletionPolicy:
   * Retain (established by the prior Retain-set op in this beforeMove), then
   * removes the resources from the template in a single CFN update. Retain
   * guarantees the physical IDPs and domain survive the template update.
   */
  private async buildOrphanSocialAuthOperation(gen2StackId: string): Promise<AmplifyMigrationOperation | undefined> {
    const template = await this.cfn.fetchTemplate(gen2StackId);

    const logicalIdsToOrphan = Object.entries(template.Resources)
      .filter(([, r]) => r.Type === USER_POOL_DOMAIN_TYPE || r.Type === USER_POOL_IDENTITY_PROVIDER_TYPE)
      .map(([id]) => id);

    if (logicalIdsToOrphan.length === 0) {
      return undefined;
    }

    const gen2StackName = extractStackNameFromId(gen2StackId);

    return {
      resource: this.resource,
      // Retain is established by the preceding Retain-set op. We verify at execute time, not plan-validation
      // time, because plan.validate() runs ALL operation validate() callbacks before ANY execute(). Checking
      // here during plan-validation would see the pre-Retain-set state and fail on every first run. At execute
      // time the Retain-set op has already durably set Retain on the targets. If the invariant is somehow
      // violated (e.g. manual template edits between plan and execute), we abort before any destructive
      // template mutation — missing Retain would cause the subsequent cfn.update to delete the physical
      // resource.
      validate: () => undefined,
      describe: async () => [
        `Orphan ${logicalIdsToOrphan.length} social auth resource(s) from '${gen2StackName}': ${logicalIdsToOrphan.join(', ')}`,
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
              `Cannot orphan social auth resources from '${gen2StackName}': the following resources are missing ` +
              `DeletionPolicy: Retain and would be physically deleted: ${missingRetain.join(', ')}.`,
            resolution: 'Ensure the preceding Retain-set operation succeeded, then re-run the refactor.',
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
   * Builds an operation that imports physical UserPoolDomain and
   * UserPoolIdentityProvider resources into the Gen2 stack under the Gen2
   * original logical IDs. Returns undefined if the app doesn't use social auth
   * (no domain or no IDP resources in the Gen2 template).
   *
   * Plan-time work:
   *   - Read the Gen2 template and capture `{providerName → logicalId}` and the
   *     domain logical ID into the operation closure. These are the Gen2 original
   *     logical IDs, which we reuse for the import so subsequent Gen2 deploys see
   *     the same IDs.
   *
   * Execute-time work:
   *   - Discover the UserPool physical ID from the Gen2 stack (P1 after
   *     super.move() has transferred Gen1's pool in).
   *   - Fetch the live domain and IDP list from Cognito.
   *   - Build the import spec and execute the import changeset.
   */
  private async buildImportSocialAuthOperation(gen2StackId: string): Promise<AmplifyMigrationOperation | undefined> {
    // Plan-time: capture logical IDs from the Gen2 template before any orphan
    // operation runs at execute-time.
    const gen2Template = await this.cfn.fetchTemplate(gen2StackId);
    const gen2IdpLogicalIds = new Map<string, string>();
    let gen2DomainLogicalId: string | undefined;

    // Find the Gen2 logical IDs we'll import the physical Gen1 resources into
    // We require providerName + logicalId to disambiguate between multiple providers
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
      this.debug('No Gen2 UserPoolDomain resource found — skipping import');
      return undefined;
    }

    if (gen2IdpLogicalIds.size === 0) {
      this.debug('No Gen2 UserPoolIdentityProvider resources found — skipping import');
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
        // Execute-time: discover the UserPool in Gen2 (P1 after super.move()).
        const userPoolId = await discoverUserPoolId(this.gen2Branch, gen2StackId);
        if (!userPoolId) {
          throw new AmplifyError('MigrationError', {
            message: `Unable to discover UserPool in Gen2 stack '${gen2StackName}' for social auth import`,
          });
        }

        const cognitoClient = this.gen1App.clients.cognitoIdentityProvider;
        const socialAuthConfig = await fetchSocialAuthConfig(cognitoClient, userPoolId);
        if (!socialAuthConfig) {
          this.debug(`UserPool ${userPoolId} has no domain or no identity providers — skipping import`);
          return;
        }

        // Fetch the current (post-orphan) template. Import re-adds the resources.
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

  protected override match(sourceId: string, sourceResource: CFNResource, targetId: string, targetResource: CFNResource): boolean {
    if (sourceResource.Type !== targetResource.Type) {
      return false;
    }
    switch (sourceResource.Type) {
      case USER_POOL_CLIENT_TYPE: {
        switch (sourceId) {
          case GEN1_WEB_CLIENT:
            return targetId.includes(GEN2_WEB_CLIENT);
          case GEN1_NATIVE_APP_CLIENT:
            return targetId.includes(GEN2_NATIVE_APP_CLIENT);
          default:
            throw new AmplifyError('MigrationError', {
              message: `Unexpected source logical id ${sourceId} for resource of type ${USER_POOL_CLIENT_TYPE}`,
            });
        }
      }
      default:
        return true;
    }
  }

  protected async fetchSourceStackId(): Promise<string | undefined> {
    return this.findNestedStack(this.gen1Env, `auth${this.resource.resourceName}`);
  }

  protected async fetchDestStackId(): Promise<string | undefined> {
    // in gen2 all auth resources are in a single auth nested stack
    return this.findNestedStack(this.gen2Branch, 'auth');
  }
}
