import { Output, Parameter, ResourceMapping } from '@aws-sdk/client-cloudformation';
import { AmplifyError } from '@aws-amplify/amplify-cli-core';
import { CFNResource } from '../../cfn-template';
import { AmplifyMigrationOperation } from '../../_operation';
import { resolveParameters } from '../resolvers/cfn-parameter-resolver';
import { resolveOutputs } from '../resolvers/cfn-output-resolver';
import { resolveDependencies } from '../resolvers/cfn-dependency-resolver';
import { resolveConditions } from '../resolvers/cfn-condition-resolver';
import { extractStackNameFromId } from '../utils';
import { CategoryRefactorer, RefactorBlueprint, ResolvedStack } from './category-refactorer';

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
   * Matches source resources to target resources by type.
   * Subclasses can override match() for custom disambiguation.
   */
  protected async buildResourceMappings(
    sourceResources: Map<string, CFNResource>,
    targetResources: Map<string, CFNResource>,
    sourceStackId: string,
    targetStackId: string,
  ): Promise<ResourceMapping[]> {
    const mappings: ResourceMapping[] = [];
    for (const [sourceId, sourceResource] of sourceResources) {
      const matchedTargets = [];
      for (const [targetId, targetResource] of targetResources) {
        const matched = this.match(sourceId, sourceResource, targetId, targetResource);
        if (matched) {
          matchedTargets.push(targetId);
        }
      }
      if (matchedTargets.length === 0) {
        throw new AmplifyError('InvalidStackError', {
          message: `Source resource '${sourceId}' (${
            sourceResource.Type
          }) has no corresponding target resource in stack: ${extractStackNameFromId(targetStackId)}`,
        });
      }
      if (matchedTargets.length > 1) {
        throw new AmplifyError('InvalidStackError', {
          message: `Source resource '${sourceId}' (${
            sourceResource.Type
          }) has multiple corresponding target resources in stack: ${extractStackNameFromId(targetStackId)}`,
        });
      }
      const targetId = matchedTargets[0];
      mappings.push({
        Source: { StackName: sourceStackId, LogicalResourceId: sourceId },
        Destination: { StackName: targetStackId, LogicalResourceId: targetId },
      });
    }
    return mappings;
  }

  /**
   * Returns true if a source resource corresponds to a target resource.
   * Default: matches by type. Override for disambiguation (e.g., UserPoolClient).
   */
  protected match(_sourceId: string, sourceResource: CFNResource, _targetId: string, targetResource: CFNResource): boolean {
    // default matching - assumes one resource per type in source/target
    return sourceResource.Type === targetResource.Type;
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
    const withDeps = resolveDependencies(withOutputs);
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

    const stackResources = await facade.fetchStackResources(stackId);
    const withDeps = resolveDependencies(originalTemplate);
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
   * Templates are fetched fresh at execution time.
   */
  protected async beforeMove(blueprint: RefactorBlueprint): Promise<AmplifyMigrationOperation[]> {
    if (blueprint.mappings.length === 0) return [];

    const gen2StackName = extractStackNameFromId(blueprint.targetStackId);
    const holdingStackName = this.getHoldingStackName(gen2StackName);

    const resourceMappings: ResourceMapping[] = blueprint.mappings.map((m) => ({
      Source: { StackName: gen2StackName, LogicalResourceId: m.Destination.LogicalResourceId },
      Destination: { StackName: holdingStackName, LogicalResourceId: m.Destination.LogicalResourceId },
    }));
    const holdingStack = await this.cfn.findStack(holdingStackName);

    const operations: AmplifyMigrationOperation[] = [];

    if (holdingStack?.StackStatus === 'REVIEW_IN_PROGRESS') {
      operations.push({
        resource: this.resource,
        validate: () => undefined,
        describe: async () => [`Delete stale holding stack '${extractStackNameFromId(holdingStackName)}'`],
        execute: async () => {
          await this.cfn.deleteStack(holdingStackName, this.resource);
        },
      });
    }

    operations.push({
      resource: this.resource,
      validate: () => undefined,
      describe: async () => {
        const header = `Move ${blueprint.mappings.length} resource(s) from '${gen2StackName}' to '${extractStackNameFromId(
          holdingStackName,
        )}'`;
        const table = this.renderMappingTable(resourceMappings);
        return [`${header}\n\n${table}`];
      },
      execute: async () => {
        await this.cfn.refactor(resourceMappings, this.resource);
      },
    });

    return operations;
  }

  /**
   * Forward: no post-move operations. Holding stack survives for rollback.
   */
  protected async afterMove(): Promise<AmplifyMigrationOperation[]> {
    return [];
  }

  /**
   * Hook for OAuth parameter resolution. Override in auth category.
   */
  protected async resolveOAuthParameters(parameters: Parameter[], _outputs: Output[]): Promise<Parameter[]> {
    return parameters;
  }
}
