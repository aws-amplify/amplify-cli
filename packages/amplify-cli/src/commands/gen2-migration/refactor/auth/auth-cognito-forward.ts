import { ResourceToImport } from '@aws-sdk/client-cloudformation';
import { AmplifyError } from '@aws-amplify/amplify-cli-core';
import { ForwardCategoryRefactorer } from '../workflow/forward-category-refactorer';
import { checkRetainPolicies, RefactorBlueprint } from '../workflow/category-refactorer';
import { CFNResource, CFNTemplate } from '../../_common/cfn-template';
import { AmplifyMigrationOperation } from '../../_common/operation';
import { extractStackNameFromId } from '../../_common/utils';
import { VALID_HOLDING_STACK_STATUSES } from '../../_common/cfn';
import { SocialAuthConfig, StackFacade } from '../stack-facade';
import CLITable from 'cli-table3';

export const GEN1_NATIVE_APP_CLIENT_LOGICAL_ID = 'UserPoolClient';
export const GEN1_WEB_CLIENT_LOGICAL_ID = 'UserPoolClientWeb';

export const GEN2_NATIVE_APP_CLIENT_LOGICAL_ID = 'UserPoolNativeAppClient';
export const GEN2_WEB_CLIENT_LOGICAL_ID = 'UserPoolAppClient';

export const USER_POOL_CLIENT_TYPE = 'AWS::Cognito::UserPoolClient';
export const USER_POOL_TYPE = 'AWS::Cognito::UserPool';
export const IDENTITY_POOL_TYPE = 'AWS::Cognito::IdentityPool';
export const IDENTITY_POOL_ROLE_ATTACHMENT_TYPE = 'AWS::Cognito::IdentityPoolRoleAttachment';
export const USER_POOL_DOMAIN_TYPE = 'AWS::Cognito::UserPoolDomain';
export const USER_POOL_IDENTITY_PROVIDER_TYPE = 'AWS::Cognito::UserPoolIdentityProvider';

/**
 * Core Cognito resource types that move through the holding stack during the
 * standard refactor.
 */
export const RESOURCE_TYPES = [USER_POOL_TYPE, USER_POOL_CLIENT_TYPE, IDENTITY_POOL_TYPE, IDENTITY_POOL_ROLE_ATTACHMENT_TYPE];

/**
 * Builds the CFN import spec for the Gen1 UserPoolDomain and UserPoolIdentityProvider
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
    // Retain so CFN import can adopt the live physical resource without deleting it on subsequent stack updates.
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
        message: `Identity provider '${provider.providerName}' exists on the UserPool but has no matching UserPoolIdentityProvider resource in the Gen2 template.`,
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
        // Empty Details- CFN import only validates the ResourceIdentifier. The next
        // Gen2 deploy regenerates real values from AmplifySecretFetcherResource.
        ProviderDetails: {},
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
 * Returns the logical IDs of the Gen2 social-auth resources in the
 * template: the UserPoolDomain logical ID (if present) and a
 * providerName → UserPoolIdentityProvider logical ID map (possibly
 * empty). Callers decide how to handle partial state.
 */
export function extractSocialAuthLogicalIds(template: CFNTemplate): {
  readonly domainLogicalId: string | undefined;
  readonly idpLogicalIds: Map<string, string>;
} {
  const idpLogicalIds = new Map<string, string>();
  let domainLogicalId: string | undefined;
  for (const [logicalId, resource] of Object.entries(template.Resources)) {
    if (resource.Type === USER_POOL_DOMAIN_TYPE) {
      domainLogicalId = logicalId;
    } else if (resource.Type === USER_POOL_IDENTITY_PROVIDER_TYPE) {
      const providerName = resource.Properties.ProviderName as string;
      if (providerName) idpLogicalIds.set(providerName, logicalId);
    }
  }
  return { domainLogicalId, idpLogicalIds };
}

/**
 * Renders the describe-table for the import operation: one row per resource
 * to import, showing the CFN ResourceIdentifier tuple (slash-joined, the
 * physical identity CFN will adopt) alongside the target logical ID.
 */
export function renderImportTable(resourcesToImport: ResourceToImport[], gen2StackName: string): string {
  const table = new CLITable({ head: ['Physical ID', 'Target Logical ID'], style: { head: [] } });
  for (const r of resourcesToImport) {
    const physicalId = Object.values(r.ResourceIdentifier ?? {}).join('/');
    table.push([physicalId, r.LogicalResourceId ?? '']);
  }
  return `Import social auth resources into '${gen2StackName}'\n\n${table.toString()}`;
}

/**
 * Renders the describe-table for the orphan operation: one row per
 * resource being removed from the stack, showing its logical ID
 * and CFN type.
 */
export async function renderOrphanTable(
  stackFacade: StackFacade,
  logicalIds: string[],
  template: CFNTemplate,
  stackName: string,
  variant: 'forward' | 'rollback',
): Promise<string> {
  const deployedResources = await stackFacade.fetchStackResources(stackName);

  const userPool = deployedResources.find((r) => r.ResourceType === USER_POOL_TYPE);
  if (!userPool) {
    throw new AmplifyError('MigrationError', { message: `Unable to find user pool in stack ${stackName}` });
  }

  const table = new CLITable({ head: ['PhysicalId', 'Logical ID', 'Type'], style: { head: [] } });
  for (const id of logicalIds) {
    const deployedResource = deployedResources.find((r) => r.LogicalResourceId === id);
    const templateResource = template.Resources[id];
    if (!deployedResource || !templateResource) {
      throw new AmplifyError('MigrationError', { message: `Unable to find resource with id ${id} in stack ${stackName}` });
    }
    table.push([`${userPool.PhysicalResourceId}/${deployedResource.PhysicalResourceId}`, id, templateResource.Type]);
  }
  const header =
    variant === 'forward'
      ? `Orphan ${logicalIds.length} social auth resource(s) from '${stackName}'`
      : `Orphan ${logicalIds.length} imported social auth resource(s) from '${stackName}'`;
  return `${header}\n\n${table.toString()}`;
}

/**
 * Forward refactorer for the auth:Cognito resource.
 *
 * Moves main auth resources from Gen1 to Gen2 via the holding stack.
 *
 * For social auth apps, the Gen2 UserPoolDomain and UserPoolIdentityProvider
 * resources are orphaned from Gen2 in beforeMove()
 * Gen1's physical domain and IDPs are imported into Gen2 in move().
 */
export class AuthCognitoForwardRefactorer extends ForwardCategoryRefactorer {
  protected resourceTypes(): string[] {
    return RESOURCE_TYPES;
  }

  /**
   * Moves resources to holding
   *
   * For social auth:
   * Orphans UserPoolDomain / UserPoolIdentityProvider from Gen2
   * (DeletionPolicy: Retain, set by generate's escape hatches, ensures
   * the physical Cognito resources survive)
   */
  protected override async beforeMove(blueprint: RefactorBlueprint): Promise<AmplifyMigrationOperation[]> {
    const baseOps = await super.beforeMove(blueprint);

    const gen2StackId = blueprint.targetStackId;
    const gen2StackName = extractStackNameFromId(gen2StackId);
    const holdingStackName = this.getHoldingStackName(gen2StackName);
    const holdingStack = await this.cfn.findStack(holdingStackName);
    if (holdingStack && !VALID_HOLDING_STACK_STATUSES.includes(holdingStack.StackStatus!)) {
      throw new AmplifyError('StackStateError', {
        message: `Unexpected state of stack ${holdingStackName}: ${holdingStack.StackStatus} (expected ${VALID_HOLDING_STACK_STATUSES.join(
          ', ',
        )})`,
      });
    }
    if (holdingStack) return baseOps;

    const template = await this.cfn.fetchTemplate(gen2StackId);
    const { domainLogicalId, idpLogicalIds } = extractSocialAuthLogicalIds(template);

    if (domainLogicalId || idpLogicalIds.size > 0) {
      const socialProvidersResourceIds = [...(domainLogicalId ? [domainLogicalId] : []), ...idpLogicalIds.values()];
      const gen2StackName = extractStackNameFromId(gen2StackId);
      const description = await renderOrphanTable(this.gen2Branch, socialProvidersResourceIds, template, gen2StackName, 'forward');
      baseOps.push({
        resource: this.resource,
        validate: () => ({
          description: `Deletion Protection (social auth): ${gen2StackName}`,
          run: async () => checkRetainPolicies(template, socialProvidersResourceIds),
        }),
        describe: async () => [description],
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
   * Moves Gen1 resources into Gen2
   *
   * For social auth:
   * Imports Gen1's UserPoolDomain / UserPoolIdentityProvider under the Gen2-original logical IDs.
   * Runs after super.move() so the UserPool is already in Gen2 when the import references it.
   */
  protected override async move(blueprint: RefactorBlueprint): Promise<AmplifyMigrationOperation[]> {
    const baseOps = await super.move(blueprint);

    const gen2StackId = blueprint.targetStackId;
    const gen2StackName = extractStackNameFromId(gen2StackId);
    const holdingStackName = this.getHoldingStackName(gen2StackName);
    const holdingStack = await this.cfn.findStack(holdingStackName);
    if (holdingStack && !VALID_HOLDING_STACK_STATUSES.includes(holdingStack.StackStatus!)) {
      throw new AmplifyError('StackStateError', {
        message: `Unexpected state of stack ${holdingStackName}: ${holdingStack.StackStatus} (expected ${VALID_HOLDING_STACK_STATUSES.join(
          ', ',
        )})`,
      });
    }
    if (holdingStack) return baseOps;

    const gen1UserPoolId = this.gen1App.resourceMetaOutput(this.resource, 'UserPoolId');
    const socialAuthConfig = await this.gen2Branch.fetchSocialAuthConfig(gen1UserPoolId);

    if (socialAuthConfig) {
      const template = await this.cfn.fetchTemplate(gen2StackId);
      const gen2StackName = extractStackNameFromId(gen2StackId);
      const { domainLogicalId, idpLogicalIds } = extractSocialAuthLogicalIds(template);

      if (!domainLogicalId) {
        throw new AmplifyError('MigrationError', {
          message: `Gen2 template '${gen2StackName}' has no UserPoolDomain resource for social auth import.`,
        });
      }

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
    }

    return baseOps;
  }

  protected async gen2LogicalId(sourceId: string, sourceResource: CFNResource, targetResources: Map<string, CFNResource>): Promise<string> {
    if (sourceResource.Type !== USER_POOL_CLIENT_TYPE) {
      return await super.gen2LogicalId(sourceId, sourceResource, targetResources);
    }
    let candidates: string[];
    const targetResourceIds = Array.from(targetResources.keys());

    switch (sourceId) {
      case GEN1_WEB_CLIENT_LOGICAL_ID: {
        candidates = targetResourceIds.filter((r) => r.includes(GEN2_WEB_CLIENT_LOGICAL_ID));
        break;
      }
      case GEN1_NATIVE_APP_CLIENT_LOGICAL_ID: {
        candidates = targetResourceIds.filter((r) => r.includes(GEN2_NATIVE_APP_CLIENT_LOGICAL_ID));
        break;
      }
      default:
        throw new AmplifyError('MigrationError', {
          message: `Unexpected source logical id ${sourceId} for resource of type ${USER_POOL_CLIENT_TYPE}`,
        });
    }

    if (candidates.length !== 1) {
      throw new AmplifyError('MigrationError', {
        message: `Unable to map Gen1 resource ${sourceId} (${sourceResource.Type}) to Gen2 resource`,
      });
    }
    return candidates[0];
  }

  protected async fetchSourceStackId(): Promise<string | undefined> {
    return this.findNestedStack(this.gen1Env, `auth${this.resource.resourceName}`);
  }

  protected async fetchDestStackId(): Promise<string | undefined> {
    // in gen2 all auth resources are in a single auth nested stack
    return this.findNestedStack(this.gen2Branch, 'auth');
  }
}
