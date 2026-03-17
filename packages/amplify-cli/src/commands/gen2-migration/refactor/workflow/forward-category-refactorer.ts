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
import { CategoryRefactorer, MoveMapping, RefactorBlueprint, ResolvedStack, ResourceMapping } from './category-refactorer';

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
  protected buildResourceMappings(sourceResources: Map<string, CFNResource>, targetResources: Map<string, CFNResource>): MoveMapping[] {
    const mappings: MoveMapping[] = [];
    const usedTargetIds = new Set<string>();
    for (const [sourceId, sourceResource] of sourceResources) {
      let matched = false;
      for (const [targetId, targetResource] of targetResources) {
        if (sourceResource.Type === targetResource.Type && !usedTargetIds.has(targetId)) {
          mappings.push({ sourceId, targetId, resource: sourceResource });
          usedTargetIds.add(targetId);
          matched = true;
          break;
        }
      }
      if (!matched) {
        throw new AmplifyError('InvalidStackError', {
          message: `Source resource '${sourceId}' (type '${sourceResource.Type}') has no corresponding target resource`,
        });
      }
    }
    return mappings;
  }

  /**
   * Resolves the Gen1 source stack template.
   * Resolution chain: params → outputs → deps → conditions.
   */
  protected async resolveSource(stackId: string): Promise<ResolvedStack> {
    const facade = this.gen1Env;
    const originalTemplate = await facade.fetchTemplate(stackId);
    const description = await facade.fetchStack(stackId);
    const parameters = description.Parameters ?? [];
    const outputs = description.Outputs ?? [];

    const resourceIds = [...this.filterResourcesByType(originalTemplate).keys()];

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

    const updatedParameters = await this.resolveOAuthParameters(parameters, outputs);

    return { stackId, resolvedTemplate: resolved, parameters: updatedParameters };
  }

  /**
   * Resolves the Gen2 target stack template.
   * Resolution chain: deps → outputs (no params or conditions for Gen2).
   */
  protected async resolveTarget(stackId: string): Promise<ResolvedStack> {
    const facade = this.gen2Branch;
    const originalTemplate = await facade.fetchTemplate(stackId);
    const description = await facade.fetchStack(stackId);
    const parameters = description.Parameters ?? [];
    const outputs = description.Outputs ?? [];

    const resourceIds = [...this.filterResourcesByType(originalTemplate).keys()];

    const stackResources = await facade.fetchStackResources(stackId);
    const withDeps = resolveDependencies(originalTemplate, resourceIds);
    const resolved = resolveOutputs({
      template: withDeps,
      stackOutputs: outputs,
      stackResources,
      region: this.region,
      accountId: this.accountId,
    });

    return { stackId, resolvedTemplate: resolved, parameters };
  }

  /**
   * Moves Gen2 resources to a holding stack before the main refactor.
   */
  protected beforeMovePlan(blueprint: RefactorBlueprint): AmplifyMigrationOperation[] {
    const targetResources = this.filterResourcesByType(blueprint.target.resolvedTemplate);
    if (targetResources.size === 0) {
      return [];
    }

    // The holding stack gets all target category resources
    const holdingResources: Record<string, CFNResource> = {};
    for (const [logicalId] of targetResources) {
      holdingResources[logicalId] = blueprint.target.resolvedTemplate.Resources[logicalId];
    }

    const holdingStackName = getHoldingStackName(extractStackNameFromId(blueprint.target.stackId));
    const holdingTemplate: CFNTemplate = {
      AWSTemplateFormatVersion: '2010-09-09',
      Description: 'Temporary holding stack for Gen2 migration',
      Resources: holdingResources,
      Outputs: {},
    };

    // Post-holding target = target.afterRemoval (already computed by buildBlueprint)
    const postTargetTemplate = blueprint.target.afterRemoval;

    const holdingMappings: ResourceMapping[] = [...targetResources.keys()].map((id) => ({
      Source: { StackName: extractStackNameFromId(blueprint.target.stackId), LogicalResourceId: id },
      Destination: { StackName: extractStackNameFromId(holdingStackName), LogicalResourceId: id },
    }));

    return [
      {
        validate: () => undefined,
        describe: async () => [`Move Gen2 resources to holding stack '${holdingStackName}'`],
        execute: async () => {
          const existing = await findHoldingStack(this.clients.cloudFormation, holdingStackName);
          if (existing?.StackStatus === 'REVIEW_IN_PROGRESS') {
            await deleteHoldingStack(this.clients.cloudFormation, holdingStackName);
          }

          const result = await tryRefactorStack(this.clients.cloudFormation, {
            StackDefinitions: [
              { TemplateBody: JSON.stringify(postTargetTemplate), StackName: blueprint.target.stackId },
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
  }

  /**
   * Forward: no post-move operations. Holding stack survives for rollback.
   */
  protected async afterMovePlan(): Promise<AmplifyMigrationOperation[]> {
    return [];
  }

  /**
   * Hook for OAuth parameter resolution. Override in auth category.
   */
  protected async resolveOAuthParameters(parameters: Parameter[], _outputs: Output[]): Promise<Parameter[]> {
    return parameters;
  }
}
