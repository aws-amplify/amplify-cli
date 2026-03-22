import { ResourceMapping } from '@aws-sdk/client-cloudformation';
import { AmplifyError } from '@aws-amplify/amplify-cli-core';
import { CFNResource } from '../../cfn-template';
import { AmplifyMigrationOperation } from '../../_operation';
import { resolveParameters } from '../resolvers/cfn-parameter-resolver';
import { resolveOutputs } from '../resolvers/cfn-output-resolver';
import { resolveDependencies } from '../resolvers/cfn-dependency-resolver';
import { extractStackNameFromId } from '../utils';
import {
  CategoryRefactorer,
  MIGRATION_PLACEHOLDER_LOGICAL_ID,
  PLACEHOLDER_RESOURCE,
  RefactorBlueprint,
  ResolvedStack,
} from './category-refactorer';

/**
 * Rollback direction base: moves resources from Gen2 (source) back to Gen1 (target).
 *
 * resolveSource: Gen2 resolution — params → outputs → deps
 * resolveTarget: Gen1 — reads template as-is, no resolution needed
 * beforeMovePlan: empty
 * afterMovePlan: restores holding stack resources into Gen2, deletes holding stack
 *
 * Does NOT pre-update stacks (overrides updateSource/updateTarget to return []).
 */
export abstract class RollbackCategoryRefactorer extends CategoryRefactorer {
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
        throw new AmplifyError('MigrationError', {
          message: `Failed building mappings: Unable to determine target id of resource ${sourceId} (${resource.Type})`,
        });
      }
      if (targetResources.has(gen1LogicalId)) {
        continue;
      }
      mappings.push({
        Source: { LogicalResourceId: sourceId, StackName: sourceStackId },
        Destination: { LogicalResourceId: gen1LogicalId, StackName: targetStackId },
      });
    }
    return mappings;
  }

  protected abstract targetLogicalId(sourceId: string, sourceResource: CFNResource): string | undefined;

  /**
   * Resolves the Gen2 source stack template for rollback.
   * Resolution chain: params → outputs → deps (no conditions).
   */
  protected async resolveSource(stackId: string): Promise<ResolvedStack> {
    const facade = this.gen2Branch;
    const originalTemplate = await facade.fetchTemplate(stackId);
    const description = await facade.fetchStack(stackId);
    const parameters = description.Parameters ?? [];
    const outputs = description.Outputs ?? [];

    const withParams = resolveParameters(originalTemplate, parameters);
    const stackResources = await facade.fetchStackResources(stackId);
    const withOutputs = resolveOutputs({
      template: withParams,
      stackOutputs: outputs,
      stackResources,
      region: this.region,
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
    const parameters = description.Parameters ?? [];

    return { stackId, resolvedTemplate: originalTemplate, parameters };
  }

  protected override async updateSource(_source: ResolvedStack): Promise<AmplifyMigrationOperation[]> {
    return [];
  }

  protected override async updateTarget(_target: ResolvedStack): Promise<AmplifyMigrationOperation[]> {
    return [];
  }

  /**
   * Rollback: no pre-move operations.
   */
  protected beforeMove(_blueprint: RefactorBlueprint): AmplifyMigrationOperation[] {
    return [];
  }

  /**
   * Restores holding stack resources into Gen2 and deletes the holding stack.
   * Templates are fetched fresh at execution time.
   */
  protected async afterMove(blueprint: RefactorBlueprint): Promise<AmplifyMigrationOperation[]> {
    const gen2StackName = blueprint.sourceStackId;
    const holdingStackName = this.getHoldingStackName(extractStackNameFromId(gen2StackName));

    const holdingStack = await this.cfn.findStack(holdingStackName);
    if (!holdingStack) return [];

    const resourceMappings: ResourceMapping[] = blueprint.mappings.map((m) => ({
      Source: { LogicalResourceId: m.Source.LogicalResourceId, StackName: holdingStackName },
      Destination: { LogicalResourceId: m.Source.LogicalResourceId, StackName: gen2StackName },
    }));

    return [
      {
        resource: this.resource,
        validate: () => undefined,
        describe: async () => {
          return [`Update holding stack '${extractStackNameFromId(holdingStackName)}' with placeholder resource`];
        },
        execute: async () => {
          const holdingTemplate = await this.cfn.fetchTemplate(holdingStackName);
          holdingTemplate.Resources[MIGRATION_PLACEHOLDER_LOGICAL_ID] = PLACEHOLDER_RESOURCE;
          await this.cfn.update({
            stackName: holdingStackName,
            parameters: [],
            templateBody: holdingTemplate,
          });
        },
      },
      {
        resource: this.resource,
        validate: () => undefined,
        describe: async () => {
          const header = `Move ${blueprint.mappings.length} resource(s) from '${extractStackNameFromId(
            holdingStackName,
          )}' to '${extractStackNameFromId(gen2StackName)}'`;
          const table = this.renderMappingTable(resourceMappings);
          return [`${header}\n\n${table}`];
        },
        execute: async () => {
          await this.cfn.refactor(resourceMappings);
        },
      },
    ];
  }
}
