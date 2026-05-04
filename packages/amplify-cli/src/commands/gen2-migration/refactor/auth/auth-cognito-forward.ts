import { ResourceToImport } from '@aws-sdk/client-cloudformation';
import {
  CognitoIdentityProviderClient,
  DescribeUserPoolCommand,
  ListIdentityProvidersCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { AmplifyError } from '@aws-amplify/amplify-cli-core';
import { ForwardCategoryRefactorer } from '../workflow/forward-category-refactorer';
import { RefactorBlueprint } from '../workflow/category-refactorer';
import { CFNResource } from '../../_common/cfn-template';
import { AmplifyMigrationOperation } from '../../_common/operation';
import { extractStackNameFromId } from '../../_common/utils';
import { Cfn } from '../../_common/cfn';
import { DiscoveredResource, Gen1App } from '../../_common/gen1-app';
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
    UpdateReplacePolicy: 'Retain',
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
      UpdateReplacePolicy: 'Retain',
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
 * Minimal surface a CategoryRefactorer exposes to the shared social-auth
 * operation builders. Passed explicitly so these functions can be exported and
 * reused from rollback without cross-class inheritance.
 */
export interface SocialAuthOperationContext {
  readonly cfn: Cfn;
  readonly gen1App: Gen1App;
  readonly gen2Branch: StackFacade;
  readonly resource: DiscoveredResource;
  info(message: string): void;
  debug(message: string): void;
}

/**
 * Builds an operation that orphans UserPoolDomain and UserPoolIdentityProvider
 * from a Gen2 stack. Returns undefined for non-social-auth apps.
 *
 * Validates at execute time that every target has DeletionPolicy: Retain, then
 * removes the resources in a single CFN update. `retainSetBy` controls the
 * error hint (forward: set by generate; rollback: set by forward's import).
 */
export async function buildOrphanSocialAuthOperation(
  ctx: SocialAuthOperationContext,
  gen2StackId: string,
  retainSetBy: 'generate' | 'forward-import',
): Promise<AmplifyMigrationOperation | undefined> {
  const template = await ctx.cfn.fetchTemplate(gen2StackId);

  const logicalIdsToOrphan = Object.entries(template.Resources)
    .filter(([, r]) => r.Type === USER_POOL_DOMAIN_TYPE || r.Type === USER_POOL_IDENTITY_PROVIDER_TYPE)
    .map(([id]) => id);

  if (logicalIdsToOrphan.length === 0) {
    return undefined;
  }

  const gen2StackName = extractStackNameFromId(gen2StackId);
  const resolution =
    retainSetBy === 'generate'
      ? 'Regenerate the Gen2 project with `amplify gen2-migration generate` so that DeletionPolicy: Retain ' +
        'is emitted on UserPoolDomain and UserPoolIdentityProvider resources, redeploy, then retry refactor.'
      : 'Inspect the Gen2 template; the forward refactor should have set Retain on these resources during import.';

  return {
    resource: ctx.resource,
    // Verify Retain at execute time (not plan time) to catch manual template edits
    // between plan and execute. Missing Retain would delete the physical resource.
    validate: () => undefined,
    describe: async () => [
      `Orphan ${logicalIdsToOrphan.length} social auth resource(s) from '${gen2StackName}': ${logicalIdsToOrphan.join(', ')}`,
    ],
    execute: async () => {
      const currentTemplate = await ctx.cfn.fetchTemplate(gen2StackId);

      // Execute-time Retain verification (defense-in-depth). Orphaning without Retain would delete the
      // physical UserPoolDomain / UserPoolIdentityProvider.
      const missingRetain = logicalIdsToOrphan.filter(
        (id) => id in currentTemplate.Resources && currentTemplate.Resources[id].DeletionPolicy !== 'Retain',
      );
      if (missingRetain.length > 0) {
        throw new AmplifyError('MigrationError', {
          message:
            `Cannot orphan social auth resources from '${gen2StackName}': the following resources are missing ` +
            `DeletionPolicy: Retain and would be physically deleted: ${missingRetain.join(', ')}.`,
          resolution,
        });
      }

      const stack = await ctx.cfn.describeStack(gen2StackId);

      for (const id of logicalIdsToOrphan) {
        delete currentTemplate.Resources[id];
      }

      await ctx.cfn.update({
        stackName: gen2StackId,
        templateBody: currentTemplate,
        parameters: stack.Parameters ?? [],
        resource: ctx.resource,
      });

      ctx.info(`Orphaned social auth resources from '${gen2StackName}': ${logicalIdsToOrphan.join(', ')}`);
    },
  };
}

/**
 * Builds an operation that imports physical UserPoolDomain and
 * UserPoolIdentityProvider into a Gen2 stack under the Gen2 original logical
 * IDs. Returns undefined for non-social-auth apps.
 *
 * Plan-time: captures {providerName → logicalId} and domain logical ID from
 * the Gen2 template. Execute-time: discovers UserPool via DescribeStackResources,
 * fetches domain/IDP list from Cognito, and runs the import changeset.
 */
export async function buildImportSocialAuthOperation(
  ctx: SocialAuthOperationContext,
  gen2StackId: string,
): Promise<AmplifyMigrationOperation | undefined> {
  // Plan-time: capture logical IDs from the Gen2 template before any orphan
  // operation runs at execute-time.
  const gen2Template = await ctx.cfn.fetchTemplate(gen2StackId);
  const gen2IdpLogicalIds = new Map<string, string>();
  let gen2DomainLogicalId: string | undefined;

  // We require providerName + logicalId to disambiguate between multiple providers.
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
    ctx.debug('No Gen2 UserPoolDomain resource found — skipping import');
    return undefined;
  }

  if (gen2IdpLogicalIds.size === 0) {
    ctx.debug('No Gen2 UserPoolIdentityProvider resources found — skipping import');
    return undefined;
  }

  const domainLogicalId = gen2DomainLogicalId;
  const gen2StackName = extractStackNameFromId(gen2StackId);

  return {
    resource: ctx.resource,
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
      const userPoolId = await discoverUserPoolId(ctx.gen2Branch, gen2StackId);
      if (!userPoolId) {
        throw new AmplifyError('MigrationError', {
          message: `Unable to discover UserPool in Gen2 stack '${gen2StackName}' for social auth import`,
        });
      }

      const cognitoClient = ctx.gen1App.clients.cognitoIdentityProvider;
      const socialAuthConfig = await fetchSocialAuthConfig(cognitoClient, userPoolId);
      if (!socialAuthConfig) {
        ctx.debug(`UserPool ${userPoolId} has no domain or no identity providers — skipping import`);
        return;
      }

      // Fetch the current template (post-orphan for forward, post-afterMove for rollback). Import re-adds
      // the IDP/domain resources under the Gen2 original logical IDs.
      const templateForImport = await ctx.cfn.fetchTemplate(gen2StackId);

      const { resourcesToImport, templateAdditions } = buildImportSpec(socialAuthConfig, domainLogicalId, gen2IdpLogicalIds);

      for (const [logicalId, resource] of Object.entries(templateAdditions)) {
        templateForImport.Resources[logicalId] = resource;
      }

      await ctx.cfn.importResources({
        stackName: gen2StackId,
        templateBody: templateForImport,
        resourcesToImport,
        resource: ctx.resource,
      });
    },
  };
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
   * Moves core resources to holding, then orphans domain/IDP from Gen2
   * (DeletionPolicy: Retain ensures physical resources survive).
   * Skipped for non-social-auth apps.
   */
  protected override async beforeMove(gen2StackId: string): Promise<AmplifyMigrationOperation[]> {
    const baseOps = await super.beforeMove(gen2StackId);

    const orphanOp = await buildOrphanSocialAuthOperation(this.operationContext(), gen2StackId, 'generate');
    if (orphanOp) {
      return [...baseOps, orphanOp];
    }

    return baseOps;
  }

  /**
   * Moves core Gen1 resources into Gen2, then imports Gen1's domain/IDP as
   * native CFN resources. Runs after super.move() so the UserPool is already
   * in Gen2 when the import references it.
   */
  protected override async move(blueprint: RefactorBlueprint): Promise<AmplifyMigrationOperation[]> {
    const baseOps = await super.move(blueprint);

    const importOp = await buildImportSocialAuthOperation(this.operationContext(), blueprint.targetStackId);
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
