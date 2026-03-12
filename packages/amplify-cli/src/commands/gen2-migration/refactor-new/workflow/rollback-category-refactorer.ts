import { GetTemplateCommand } from '@aws-sdk/client-cloudformation';
import { AmplifyError } from '@aws-amplify/amplify-cli-core';
import { CFNResource, CFNTemplate } from '../cfn-template';
import { RefactorOperation } from '../refactorer';
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
  protected override updateSource(): RefactorOperation[] {
    return [];
  }

  /**
   * Rollback does not pre-update stacks.
   */
  protected override updateTarget(): RefactorOperation[] {
    return [];
  }

  /**
   * Rollback: no pre-move operations. Target template used as-is.
   */
  protected beforeMovePlan(
    _source: ResolvedStack,
    target: ResolvedStack,
  ): { operations: RefactorOperation[]; postTargetTemplate: CFNTemplate } {
    return { operations: [], postTargetTemplate: target.resolvedTemplate };
  }

  /**
   * Restores holding stack resources into Gen2 and deletes the holding stack.
   *
   * KNOWN LIMITATION: This operation reads the holding stack template during execute(),
   * violating the "all reads in plan(), all mutations in execute()" contract. It also
   * bundles read + update + refactor + delete into a single operation.
   *
   * TARGET STATE: Make afterMovePlan async, read holding stack template during plan(),
   * and return 3 separate operations: (1) update holding stack with placeholder,
   * (2) refactor resources back to Gen2, (3) delete holding stack. This requires
   * updating the rollback-aftermove.test.ts which currently asserts operations.length === 1.
   */
  protected afterMovePlan(params: { source: ResolvedStack; target: ResolvedStack; finalSource: CFNTemplate; finalTarget: CFNTemplate }): {
    operations: RefactorOperation[];
  } {
    // The source in rollback is Gen2. After the main refactor, finalSource is the
    // Gen2 template with resources removed. We need to restore holding stack resources into it.
    const gen2StackId = params.source.stackId;
    const holdingStackName = getHoldingStackName(extractStackNameFromId(gen2StackId));

    const operations: RefactorOperation[] = [
      {
        validate: async () => {
          // No validation needed for holding stack restore
        },
        describe: async () => [`Restore Gen2 resources from holding stack '${holdingStackName}' and clean up`],
        execute: async () => {
          const holdingStack = await findHoldingStack(this.clients.cfn, holdingStackName);
          if (!holdingStack) return; // No holding stack — nothing to restore

          // Read holding stack template
          const holdingTemplateResponse = await this.clients.cfn.send(
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
            await deleteHoldingStack(this.clients.cfn, holdingStackName);
            return;
          }

          // Add placeholder to holding stack so refactor can move all real resources out
          const holdingWithPlaceholder: CFNTemplate = {
            ...holdingTemplate,
            Resources: {
              [MIGRATION_PLACEHOLDER_LOGICAL_ID]: PLACEHOLDER_RESOURCE,
              ...holdingTemplate.Resources,
            },
          };
          await tryUpdateStack({
            cfnClient: this.clients.cfn,
            stackName: holdingStackName,
            parameters: [],
            templateBody: holdingWithPlaceholder,
          });

          // Use finalSource (the post-move Gen2 template) instead of reading from
          // the facade, which would return the cached pre-move version.
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

          const result = await tryRefactorStack(this.clients.cfn, {
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

          await deleteHoldingStack(this.clients.cfn, holdingStackName);
        },
      },
    ];

    return { operations };
  }
}
