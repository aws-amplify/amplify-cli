import { Output, Parameter } from '@aws-sdk/client-cloudformation';
import { AmplifyError } from '@aws-amplify/amplify-cli-core';
import { CFNResource, CFNTemplate } from '../../cfn-template';
import { AmplifyMigrationOperation } from '../../_operation';
import { resolveParameters } from '../resolvers/cfn-parameter-resolver';
import { resolveOutputs } from '../resolvers/cfn-output-resolver';
import { resolveDependencies } from '../resolvers/cfn-dependency-resolver';
import { resolveConditions } from '../resolvers/cfn-condition-resolver';
import { extractStackNameFromId } from '../utils';
import { getHoldingStackName, findHoldingStack, deleteHoldingStack } from '../holding-stack';
import { tryRefactorStack, RefactorFailure } from '../cfn-stack-refactor-updater';
import { CategoryRefactorer, MIGRATION_PLACEHOLDER_LOGICAL_ID, ResolvedStack, ResourceMapping } from './category-refactorer';

/**
 * Forward direction base: moves resources from Gen1 (source) to Gen2 (target).
 *
 * resolveSource: Gen1 resolution — params → outputs → deps → conditions
 * resolveTarget: Gen2 resolution — deps → outputs
 * beforeMovePlan: move Gen2 resources to holding stack
 * afterMovePlan: empty (holding stack survives for rollback)
 */
export abstract class ForwardCategoryRefactorer extends CategoryRefactorer {
  /**
   * Default forward mapping: matches source and target resources by type.
   * Works for categories with at most one resource per type (storage, analytics).
   * Auth overrides this for UserPoolClient Web/Native disambiguation.
   */
  protected buildResourceMappings(
    sourceResources: Map<string, CFNResource>,
    targetResources: Map<string, CFNResource>,
  ): Map<string, string> {
    const mapping = new Map<string, string>();
    const usedTargetIds = new Set<string>();
    for (const [sourceId, sourceResource] of sourceResources) {
      for (const [targetId, targetResource] of targetResources) {
        if (sourceResource.Type === targetResource.Type && !usedTargetIds.has(targetId)) {
          mapping.set(sourceId, targetId);
          usedTargetIds.add(targetId);
          break;
        }
      }
    }
    return mapping;
  }

  /**
   * Resolves the Gen1 source stack template.
   * Resolution chain: params → outputs → deps → conditions.
   * Resource IDs are filtered from the original template before resolution.
   */
  protected async resolveSource(stackId: string): Promise<ResolvedStack> {
    const facade = this.gen1Env;
    const originalTemplate = await facade.fetchTemplate(stackId);
    const description = await facade.fetchStackDescription(stackId);
    const parameters = description.Parameters ?? [];
    const outputs = description.Outputs ?? [];

    // Filter resource IDs from original template (before resolution)
    const resourceIds = [...this.filterResourcesByType(originalTemplate).keys()];

    // Resolution chain
    const stackName = extractStackNameFromId(stackId);
    const withParams = resolveParameters(originalTemplate, parameters, stackName);
    const stackResources = await facade.fetchStackResources(stackId);
    const withOutputs = resolveOutputs({
      template: withParams,
      stackOutputs: outputs,
      stackResources,
      region: this.region,
      accountId: this.accountId,
    });
    const withDeps = resolveDependencies(withOutputs, resourceIds);
    const resolved = resolveConditions(withDeps, parameters);

    // Add placeholder if all resources are being moved
    const resourcesToMove = new Map(resourceIds.filter((id) => id in resolved.Resources).map((id) => [id, resolved.Resources[id]]));
    this.addPlaceholderIfNeeded(resolved, resourcesToMove);

    // Handle OAuth if this category needs it
    const updatedParameters = await this.resolveOAuthParameters(parameters, outputs);

    return { stackId, originalTemplate, resolvedTemplate: resolved, parameters: updatedParameters, resourcesToMove };
  }

  /**
   * Resolves the Gen2 target stack template.
   * Resolution chain: deps → outputs (no params or conditions for Gen2).
   */
  protected async resolveTarget(stackId: string): Promise<ResolvedStack> {
    const facade = this.gen2Branch;
    const originalTemplate = await facade.fetchTemplate(stackId);
    const description = await facade.fetchStackDescription(stackId);
    const parameters = description.Parameters ?? [];
    const outputs = description.Outputs ?? [];

    const resourceIds = [...this.filterResourcesByType(originalTemplate).keys()];

    // Resolver ordering (deps → outputs) differs from resolveSource (params → outputs → deps → conditions).
    // Order is irrelevant: resolveDependencies only touches DependsOn (string arrays),
    // resolveOutputs only touches Ref/Fn::GetAtt (object nodes). They're orthogonal.
    const stackResources = await facade.fetchStackResources(stackId);
    const withDeps = resolveDependencies(originalTemplate, resourceIds);
    const resolved = resolveOutputs({
      template: withDeps,
      stackOutputs: outputs,
      stackResources,
      region: this.region,
      accountId: this.accountId,
    });

    const resourcesToMove = new Map(resourceIds.filter((id) => id in resolved.Resources).map((id) => [id, resolved.Resources[id]]));

    return { stackId, originalTemplate, resolvedTemplate: resolved, parameters, resourcesToMove };
  }

  /**
   * Moves Gen2 resources to a holding stack before the main refactor.
   * Returns the operations and the post-holding-stack target template.
   */
  protected beforeMovePlan(
    _source: ResolvedStack,
    target: ResolvedStack,
  ): { operations: AmplifyMigrationOperation[]; postTargetTemplate: CFNTemplate } {
    if (target.resourcesToMove.size === 0) {
      return { operations: [], postTargetTemplate: target.resolvedTemplate };
    }

    // Pure computation: build post-holding-stack target template
    const postTargetTemplate = JSON.parse(JSON.stringify(target.resolvedTemplate)) as CFNTemplate;
    const holdingResources: Record<string, CFNResource> = {};

    for (const [logicalId] of target.resourcesToMove) {
      holdingResources[logicalId] = postTargetTemplate.Resources[logicalId];
      delete postTargetTemplate.Resources[logicalId];
    }

    const holdingStackName = getHoldingStackName(extractStackNameFromId(target.stackId));
    const holdingTemplate: CFNTemplate = {
      AWSTemplateFormatVersion: '2010-09-09',
      Description: 'Temporary holding stack for Gen2 migration',
      Resources: holdingResources,
      Outputs: {},
    };

    const holdingMappings: ResourceMapping[] = [...target.resourcesToMove.keys()].map((id) => ({
      Source: { StackName: extractStackNameFromId(target.stackId), LogicalResourceId: id },
      Destination: { StackName: extractStackNameFromId(holdingStackName), LogicalResourceId: id },
    }));

    const operations: AmplifyMigrationOperation[] = [
      {
        validate: async () => {
          // No validation needed for holding stack move
        },
        describe: async () => [`Move Gen2 resources to holding stack '${holdingStackName}'`],
        execute: async () => {
          // Clean up orphaned holding stack from a previous failed attempt
          const existing = await findHoldingStack(this.clients.cfn, holdingStackName);
          if (existing?.StackStatus === 'REVIEW_IN_PROGRESS') {
            await deleteHoldingStack(this.clients.cfn, holdingStackName);
          }

          const result = await tryRefactorStack(this.clients.cfn, {
            StackDefinitions: [
              { TemplateBody: JSON.stringify(postTargetTemplate), StackName: target.stackId },
              { TemplateBody: JSON.stringify(holdingTemplate), StackName: holdingStackName },
            ],
            ResourceMappings: holdingMappings,
            EnableStackCreation: true,
          });
          if (!result.success) {
            const failure = result as RefactorFailure;
            throw new AmplifyError('StackStateError', {
              message: `Failed to move Gen2 resources to holding stack: ${failure.reason}`,
            });
          }
        },
      },
    ];

    return { operations, postTargetTemplate };
  }

  /**
   * Forward: no post-move operations. Holding stack survives for rollback.
   */
  protected async afterMovePlan(): Promise<{ operations: AmplifyMigrationOperation[] }> {
    return { operations: [] };
  }

  /**
   * Hook for OAuth parameter resolution. Override in auth category.
   * Default: returns parameters unchanged.
   */
  protected async resolveOAuthParameters(parameters: Parameter[], _outputs: Output[]): Promise<Parameter[]> {
    return parameters;
  }
}
