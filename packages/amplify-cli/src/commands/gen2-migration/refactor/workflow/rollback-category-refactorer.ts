import { GetTemplateCommand } from '@aws-sdk/client-cloudformation';
import { AmplifyError } from '@aws-amplify/amplify-cli-core';
import { CFNResource, CFNTemplate } from '../../cfn-template';
import { AmplifyMigrationOperation } from '../../_operation';
import { resolveParameters } from '../resolvers/cfn-parameter-resolver';
import { resolveOutputs } from '../resolvers/cfn-output-resolver';
import { resolveDependencies } from '../resolvers/cfn-dependency-resolver';
import { extractStackNameFromId } from '../utils';
import { getHoldingStackName, findHoldingStack, deleteHoldingStack } from '../holding-stack';
import { tryUpdateStack } from '../cfn-stack-updater';
import { tryRefactorStack, RefactorFailure } from '../cfn-stack-refactor-updater';
import {
  CategoryRefactorer,
  MIGRATION_PLACEHOLDER_LOGICAL_ID,
  PLACEHOLDER_RESOURCE,
  ResolvedStack,
  ResourceMapping,
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
  /**
   * Map of CFN resource type → Gen1 logical resource ID.
   * Subclasses override this with their category-specific map.
   * Used by the default buildResourceMappings implementation.
   */
  protected readonly gen1LogicalIds: ReadonlyMap<string, string> = new Map();

  /**
   * Default rollback mapping: looks up Gen1 logical ID by resource type.
   * Throws AmplifyError if a source resource's type is not in gen1LogicalIds.
   * Auth overrides this entirely (different mapping strategies for main auth vs user pool groups).
   */
  protected buildResourceMappings(
    sourceResources: Map<string, CFNResource>,
    _targetResources: Map<string, CFNResource>,
  ): Map<string, string> {
    const mapping = new Map<string, string>();
    for (const [sourceId, resource] of sourceResources) {
      const gen1LogicalId = this.gen1LogicalIds.get(resource.Type);
      if (!gen1LogicalId) {
        throw new AmplifyError('InvalidStackError', {
          message: `No known Gen1 logical ID for resource type '${resource.Type}' (source: '${sourceId}')`,
        });
      }
      mapping.set(sourceId, gen1LogicalId);
    }
    return mapping;
  }

  /**
   * Resolves the Gen2 source stack template for rollback.
   * Resolution chain: params → outputs → deps (no conditions).
   */
  protected async resolveSource(stackId: string): Promise<ResolvedStack> {
    const facade = this.gen2Branch;
    const originalTemplate = await facade.fetchTemplate(stackId);
    const description = await facade.fetchStackDescription(stackId);
    const parameters = description.Parameters ?? [];
    const outputs = description.Outputs ?? [];

    const resourceIds = [...this.filterResourcesByType(originalTemplate).keys()];

    const withParams = resolveParameters(originalTemplate, parameters);
    const stackResources = await facade.fetchStackResources(stackId);
    const withOutputs = resolveOutputs({
      template: withParams,
      stackOutputs: outputs,
      stackResources,
      region: this.region,
      accountId: this.accountId,
    });
    const resolved = resolveDependencies(withOutputs, resourceIds);

    const resourcesToMove = new Map(resourceIds.filter((id) => id in resolved.Resources).map((id) => [id, resolved.Resources[id]]));

    return { stackId, originalTemplate, resolvedTemplate: resolved, parameters, resourcesToMove };
  }

  /**
   * Gen1 target: reads template as-is. No resolution needed for rollback destination.
   * Returns empty resourcesToMove — Gen1 is the destination, not the source.
   */
  protected async resolveTarget(stackId: string): Promise<ResolvedStack> {
    const facade = this.gen1Env;
    const originalTemplate = await facade.fetchTemplate(stackId);
    const description = await facade.fetchStackDescription(stackId);
    const parameters = description.Parameters ?? [];

    return {
      stackId,
      originalTemplate,
      resolvedTemplate: originalTemplate,
      parameters,
      resourcesToMove: new Map(),
    };
  }

  /**
   * Rollback does not pre-update stacks.
   */
  protected override updateSource(): AmplifyMigrationOperation[] {
    return [];
  }

  /**
   * Rollback does not pre-update stacks.
   */
  protected override updateTarget(): AmplifyMigrationOperation[] {
    return [];
  }

  /**
   * Rollback: no pre-move operations. Target template used as-is.
   */
  protected beforeMovePlan(
    _source: ResolvedStack,
    target: ResolvedStack,
  ): { operations: AmplifyMigrationOperation[]; postTargetTemplate: CFNTemplate } {
    return { operations: [], postTargetTemplate: target.resolvedTemplate };
  }

  /**
   * Restores holding stack resources into Gen2 and deletes the holding stack.
   *
   * Reads the holding stack template during plan() (this method).
   * Returns 3 separate operations: (1) update holding stack with placeholder,
   * (2) refactor resources back to Gen2, (3) delete holding stack.
   */
  protected async afterMovePlan(params: {
    source: ResolvedStack;
    target: ResolvedStack;
    finalSource: CFNTemplate;
    finalTarget: CFNTemplate;
  }): Promise<{ operations: AmplifyMigrationOperation[] }> {
    const gen2StackId = params.source.stackId;
    const holdingStackName = getHoldingStackName(extractStackNameFromId(gen2StackId));

    // Read during plan() — all AWS reads happen here
    const holdingStack = await findHoldingStack(this.clients.cloudFormation, holdingStackName);
    if (!holdingStack) return { operations: [] };

    const holdingTemplateResponse = await this.clients.cloudFormation.send(
      new GetTemplateCommand({ StackName: holdingStackName, TemplateStage: 'Original' }),
    );
    if (!holdingTemplateResponse.TemplateBody) {
      throw new AmplifyError('InvalidStackError', {
        message: `Holding stack '${holdingStackName}' returned an empty template`,
      });
    }
    const holdingTemplate = JSON.parse(holdingTemplateResponse.TemplateBody) as CFNTemplate;

    const resourcesToRestore = Object.entries(holdingTemplate.Resources).filter(([id]) => id !== MIGRATION_PLACEHOLDER_LOGICAL_ID);
    if (resourcesToRestore.length === 0) {
      return { operations: [this.buildDeleteHoldingStackOp(holdingStackName)] };
    }

    // Pre-compute all templates during plan()
    const holdingWithPlaceholder: CFNTemplate = {
      ...holdingTemplate,
      Resources: { [MIGRATION_PLACEHOLDER_LOGICAL_ID]: PLACEHOLDER_RESOURCE, ...holdingTemplate.Resources },
    };

    const restoreTarget = JSON.parse(JSON.stringify(params.finalSource)) as CFNTemplate;
    for (const [logicalId, resource] of resourcesToRestore) {
      restoreTarget.Resources[logicalId] = resource;
    }

    const emptyHolding: CFNTemplate = {
      AWSTemplateFormatVersion: '2010-09-09',
      Description: 'Temporary holding stack for Gen2 migration',
      Resources: { [MIGRATION_PLACEHOLDER_LOGICAL_ID]: PLACEHOLDER_RESOURCE },
      Outputs: {},
    };

    const restoreMappings: ResourceMapping[] = resourcesToRestore.map(([logicalId]) => ({
      Source: { StackName: extractStackNameFromId(holdingStackName), LogicalResourceId: logicalId },
      Destination: { StackName: extractStackNameFromId(gen2StackId), LogicalResourceId: logicalId },
    }));

    return {
      operations: [
        // Op 1: Add placeholder to holding stack so refactor can move all real resources out
        {
          validate: async () => {
            /* no validation needed */
          },
          describe: async () => [`Add placeholder to holding stack '${holdingStackName}'`],
          execute: async () => {
            await tryUpdateStack({
              cfnClient: this.clients.cloudFormation,
              stackName: holdingStackName,
              parameters: [],
              templateBody: holdingWithPlaceholder,
            });
          },
        },
        // Op 2: Refactor resources from holding stack back to Gen2
        {
          validate: async () => {
            /* no validation needed */
          },
          describe: async () => [`Restore ${resourcesToRestore.length} resource(s) from holding stack to Gen2`],
          execute: async () => {
            const result = await tryRefactorStack(this.clients.cloudFormation, {
              StackDefinitions: [
                { TemplateBody: JSON.stringify(emptyHolding), StackName: holdingStackName },
                { TemplateBody: JSON.stringify(restoreTarget), StackName: gen2StackId },
              ],
              ResourceMappings: restoreMappings,
            });
            if (!result.success) {
              const failure = result as RefactorFailure;
              throw new AmplifyError('StackStateError', {
                message: `Failed to restore Gen2 resources from holding stack: ${failure.reason}`,
              });
            }
          },
        },
        // Op 3: Delete the now-empty holding stack
        this.buildDeleteHoldingStackOp(holdingStackName),
      ],
    };
  }

  /**
   * Builds an operation that deletes a holding stack.
   */
  private buildDeleteHoldingStackOp(holdingStackName: string): AmplifyMigrationOperation {
    return {
      validate: async () => {
        /* no validation needed */
      },
      describe: async () => [`Delete holding stack '${holdingStackName}'`],
      execute: async () => {
        await deleteHoldingStack(this.clients.cloudFormation, holdingStackName);
      },
    };
  }
}
