import { Output, Parameter, ResourceMapping } from '@aws-sdk/client-cloudformation';
import { AmplifyError } from '@aws-amplify/amplify-cli-core';
import { CFNResource } from '../../_common/cfn-template';
import { AmplifyMigrationOperation } from '../../_common/operation';
import { resolveParameters } from '../resolvers/cfn-parameter-resolver';
import { resolveOutputs } from '../resolvers/cfn-output-resolver';
import { resolveDependencies } from '../resolvers/cfn-dependency-resolver';
import { resolveConditions } from '../resolvers/cfn-condition-resolver';
import { extractStackNameFromId } from '../../_common/utils';
import { CategoryRefactorer, ResolvedStack } from './category-refactorer';

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
   * Sub-classes can override match() for custom disambiguation.
   */
  protected async buildResourceMappings(
    sourceResources: Map<string, CFNResource>,
    targetResources: Map<string, CFNResource>,
    sourceStackId: string,
    targetStackId: string,
  ): Promise<ResourceMapping[]> {
    const usedTargetIds = new Set<string>();
    const mappings: ResourceMapping[] = [];
    for (const [sourceId, sourceResource] of sourceResources) {
      const targetId = this.findMatchingTarget(sourceId, sourceResource, targetResources, usedTargetIds, targetStackId);
      usedTargetIds.add(targetId);
      mappings.push({
        Source: { StackName: extractStackNameFromId(sourceStackId), LogicalResourceId: sourceId },
        Destination: { StackName: extractStackNameFromId(targetStackId), LogicalResourceId: targetId },
      });
    }
    return mappings;
  }

  /**
   * Finds exactly one matching target for a source resource.
   * Throws if zero or multiple matches are found.
   */
  private findMatchingTarget(
    sourceId: string,
    sourceResource: CFNResource,
    targetResources: Map<string, CFNResource>,
    usedTargetIds: Set<string>,
    targetStackId: string,
  ): string {
    const matched: string[] = [];
    for (const [targetId, targetResource] of targetResources) {
      if (usedTargetIds.has(targetId)) continue;
      if (this.match(sourceId, sourceResource, targetId, targetResource)) {
        matched.push(targetId);
      }
    }
    if (matched.length === 0) {
      throw new AmplifyError('ResourceMappingError', {
        message: `Source resource '${sourceId}' (${
          sourceResource.Type
        }) has no corresponding target resource in stack: ${extractStackNameFromId(targetStackId)}`,
      });
    }
    if (matched.length > 1) {
      throw new AmplifyError('ResourceMappingError', {
        message: `Source resource '${sourceId}' (${
          sourceResource.Type
        }) has multiple corresponding target resources in stack: ${extractStackNameFromId(targetStackId)}`,
      });
    }
    return matched[0];
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
      region: this.gen1App.region,
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
    const stack = await facade.fetchStack(stackId);
    const parameters = stack.Parameters ?? [];
    const outputs = stack.Outputs ?? [];

    const stackName = extractStackNameFromId(stackId);
    const stackResources = await facade.fetchStackResources(stackId);
    const withParams = resolveParameters(originalTemplate, parameters, stackName);
    const withDeps = resolveDependencies(withParams);
    const resolved = resolveOutputs({
      template: withDeps,
      stackOutputs: outputs,
      stackResources,
      region: this.gen1App.region,
      accountId: this.accountId,
    });

    return { stackId, resolvedTemplate: resolved, parameters };
  }

  /**
   * Moves Gen2 resources to a holding stack before the main refactor.
   * Templates are fetched fresh at execution time.
   */
  protected async beforeMove(gen2StackId: string): Promise<AmplifyMigrationOperation[]> {
    const gen2StackName = extractStackNameFromId(gen2StackId);
    const holdingStackName = this.getHoldingStackName(gen2StackName);

    this.debug(`Fetching template of gen2 stack: ${gen2StackName}`);
    const gen2StackTemplate = await this.gen2Branch.fetchTemplate(gen2StackName);

    this.debug(`Locating holding stack: ${holdingStackName}`);
    const holdingStack = await this.cfn.findStack(holdingStackName);

    const resources = this.filterResourcesByType(gen2StackTemplate);
    this.debug(`Found ${resources.size} resources to move from stack: ${gen2StackName}`);

    const holdingStackTemplate = holdingStack ? await this.cfn.fetchTemplate(holdingStackName) : undefined;
    const holdingStackResources = holdingStackTemplate?.Resources ?? {};

    const resourceMappings: ResourceMapping[] = [];
    for (const logicalId of resources.keys()) {
      if (logicalId in holdingStackResources) {
        // holding stack already contains this resource. can happen on a second
        // subsequent execution of forward. the resources we discovered here
        // are actually the gen1 resources that were moved.
        this.debug(`Not registering ${logicalId} since it already exists in ${holdingStackName}`);
        continue;
      }
      this.debug(`Registering ${logicalId} move to ${holdingStackName}`);
      resourceMappings.push({
        Source: { StackName: gen2StackName, LogicalResourceId: logicalId },
        Destination: { StackName: holdingStackName, LogicalResourceId: logicalId },
      });
    }

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

    if (resourceMappings.length > 0) {
      operations.push({
        resource: this.resource,
        validate: () => undefined,
        describe: async () => {
          const header = `Move ${resourceMappings.length} resource(s) from '${gen2StackName}' to '${extractStackNameFromId(
            holdingStackName,
          )}'`;
          const table = this.renderMappingTable(resourceMappings);
          return [`${header}\n\n${table}`];
        },
        execute: async () => {
          await this.cfn.refactor(resourceMappings, this.resource);
        },
      });
    }

    return operations;
  }

  /**
   * Forward: no post-move operations. Holding stack survives for rollback.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected async afterMove(_gen2StackId: string): Promise<AmplifyMigrationOperation[]> {
    return [];
  }

  /**
   * Hook for OAuth parameter resolution. Override in auth category.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected async resolveOAuthParameters(parameters: Parameter[], _outputs: Output[]): Promise<Parameter[]> {
    return parameters;
  }
}
