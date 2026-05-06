import { ResourceMapping } from '@aws-sdk/client-cloudformation';
import { AmplifyError } from '@aws-amplify/amplify-cli-core';
import { CFNResource } from '../../_common/cfn-template';
import { AmplifyMigrationOperation } from '../../_common/operation';
import { resolveNoEchoParameters, resolveParameters } from '../resolvers/cfn-parameter-resolver';
import { resolveOutputs } from '../resolvers/cfn-output-resolver';
import { resolveDependencies } from '../resolvers/cfn-dependency-resolver';
import { extractStackNameFromId } from '../../_common/utils';
import { CategoryRefactorer, ResolvedStack } from './category-refactorer';
import { MIGRATION_PLACEHOLDER_LOGICAL_ID } from '../../_common/cfn';

/**
 * Rollback direction base: moves resources from Gen2 (source) back to Gen1 (target).
 *
 * resolveSource: Gen2 resolution — params → outputs → deps
 * resolveTarget: Gen1 — reads template as-is, no resolution needed
 * beforeMove: empty
 * afterMove: restores holding stack resources into Gen2
 */
export abstract class RollbackCategoryRefactorer extends CategoryRefactorer {
  /**
   * Maps Gen2 source resources to Gen1 target logical IDs via targetLogicalId().
   * Skips resources that already exist in the target stack.
   */
  protected async buildResourceMappings(
    sourceResources: Map<string, CFNResource>,
    targetResources: Map<string, CFNResource>,
    sourceStackId: string,
    targetStackId: string,
  ): Promise<ResourceMapping[]> {
    const mappings: ResourceMapping[] = [];
    for (const [sourceId, resource] of sourceResources) {
      const gen1LogicalId = this.targetLogicalId(sourceId, resource);
      if (!gen1LogicalId) {
        throw new AmplifyError('ResourceMappingError', {
          message: `Failed building mappings: Unable to determine target id of resource ${sourceId} (${resource.Type})`,
        });
      }
      if (targetResources.has(gen1LogicalId)) {
        continue;
      }
      mappings.push({
        Source: { StackName: extractStackNameFromId(sourceStackId), LogicalResourceId: sourceId },
        Destination: { StackName: extractStackNameFromId(targetStackId), LogicalResourceId: gen1LogicalId },
      });
    }
    return mappings;
  }

  /**
   * Returns the Gen1 logical ID for a Gen2 resource. Sub-classes implement per category.
   */
  protected abstract targetLogicalId(sourceId: string, sourceResource: CFNResource): string | undefined;

  /**
   * Resolves the Gen2 source stack template for rollback.
   * Resolution chain: params → outputs → deps (no conditions).
   */
  protected async resolveSource(stackId: string): Promise<ResolvedStack> {
    const facade = this.gen2Branch;
    const originalTemplate = await facade.fetchTemplate(stackId);
    const description = await facade.fetchStack(stackId);
    const parameters = resolveNoEchoParameters(originalTemplate, description.Parameters ?? []);
    const outputs = description.Outputs ?? [];

    const withParams = resolveParameters(originalTemplate, parameters);
    const stackResources = await facade.fetchStackResources(stackId);
    const withOutputs = resolveOutputs({
      template: withParams,
      stackOutputs: outputs,
      stackResources,
      region: this.gen1App.region,
      accountId: this.accountId,
    });
    const resolved = resolveDependencies(withOutputs);

    return { stackId, resolvedTemplate: resolved, parameters };
  }

  /**
   * Gen1 target: reads template as-is. No resolution needed for rollback destination.
   */
  protected async resolveTarget(stackId: string): Promise<ResolvedStack> {
    const facade = this.gen1Env;
    const originalTemplate = await facade.fetchTemplate(stackId);
    const description = await facade.fetchStack(stackId);
    const parameters = resolveNoEchoParameters(originalTemplate, description.Parameters ?? []);

    return { stackId, resolvedTemplate: originalTemplate, parameters };
  }

  /**
   * Rollback: no pre-move operations.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected async beforeMove(_gen2StackId: string): Promise<AmplifyMigrationOperation[]> {
    return [];
  }

  /**
   * Restores holding stack resources into Gen2.
   * Templates are fetched fresh at execution time.
   */
  protected async afterMove(gen2StackId: string): Promise<AmplifyMigrationOperation[]> {
    const gen2StackName = extractStackNameFromId(gen2StackId);
    const holdingStackName = this.getHoldingStackName(gen2StackName);

    this.debug(`Locating holding stack: ${holdingStackName}`);
    const holdingStack = await this.cfn.findStack(holdingStackName);
    if (!holdingStack) {
      this.debug(`Holding stack ${holdingStackName} not found. Nothing to do.`);
      return [];
    }

    if (holdingStack.StackStatus === 'REVIEW_IN_PROGRESS') {
      return [
        {
          resource: this.resource,
          validate: () => undefined,
          describe: async () => [`Delete stale holding stack '${extractStackNameFromId(holdingStackName)}'`],
          execute: async () => {
            await this.cfn.deleteStack(holdingStackName, this.resource);
          },
        },
      ];
    }

    this.debug(`Fetching template of holding stack: ${holdingStackName}`);
    const holdingStackTemplate = await this.gen2Branch.fetchTemplate(holdingStackName);
    const resources = this.filterResourcesByType(holdingStackTemplate);
    this.debug(`Found ${resources.size} resources to move from stack: ${holdingStackName}`);

    const resourceMappings: ResourceMapping[] = [];
    for (const logicalId of resources.keys()) {
      this.debug(`Registering ${logicalId} to move from ${holdingStackName} to ${gen2StackName}`);
      resourceMappings.push({
        Source: { StackName: holdingStackName, LogicalResourceId: logicalId },
        Destination: { StackName: gen2StackName, LogicalResourceId: logicalId },
      });
    }

    if (resourceMappings.length === 0) {
      this.debug(`No resources were registered for move from ${holdingStackName} to ${gen2StackName}. Nothing to do.`);
      return [];
    }

    return [
      {
        resource: this.resource,
        validate: () => undefined,
        describe: async () => {
          const header = `Move ${resourceMappings.length} resource(s) from '${extractStackNameFromId(
            holdingStackName,
          )}' to '${extractStackNameFromId(gen2StackName)}'`;
          const table = this.renderMappingTable(resourceMappings);
          return [`${header}\n\n${table}`];
        },
        execute: async () => {
          await this.cfn.refactor(resourceMappings, this.resource);

          // this needs to happen here instead of during planning because
          // each refactorer moves its own resources out of the holding stack.
          const holdingStack = await this.cfn.findStack(holdingStackName);
          if (holdingStack) {
            const holdingStackTemplate = await this.cfn.fetchTemplate(holdingStackName);
            const holdingStackResourceIds = Object.keys(holdingStackTemplate.Resources);
            if (holdingStackResourceIds.length === 1 && holdingStackResourceIds[0] === MIGRATION_PLACEHOLDER_LOGICAL_ID) {
              await this.cfn.deleteStack(holdingStackName, this.resource);
            }
          }
        },
      },
    ];
  }
}
