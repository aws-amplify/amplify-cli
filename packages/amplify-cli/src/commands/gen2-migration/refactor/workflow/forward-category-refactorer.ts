import { ResourceMapping } from '@aws-sdk/client-cloudformation';
import { AmplifyError } from '@aws-amplify/amplify-cli-core';
import { CFNResource, CFNTemplate } from '../../_common/cfn-template';
import { AmplifyMigrationOperation } from '../../_common/operation';
import { resolveNoEchoParameters, resolveParameters } from '../resolvers/cfn-parameter-resolver';
import { resolveOutputs } from '../resolvers/cfn-output-resolver';
import { resolveDependencies } from '../resolvers/cfn-dependency-resolver';
import { resolveConditions } from '../resolvers/cfn-condition-resolver';
import { extractStackNameFromId } from '../../_common/utils';
import { VALID_HOLDING_STACK_STATUSES } from '../../_common/cfn';
import { CategoryRefactorer, RefactorBlueprint, ResolvedStack } from './category-refactorer';
import { HOLDING_STACK_FORWARD_MAPPINGS_METADATA_KEY } from '../../_common/cfn';

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
    // clone since we are mutating
    const clonedTargetResources = new Map(Array.from(targetResources.entries()).map(([k, v]) => [k, structuredClone(v)]));
    const mappings: ResourceMapping[] = [];
    for (const [sourceId, sourceResource] of sourceResources) {
      const targetId = await this.gen2LogicalId(sourceId, sourceResource, clonedTargetResources);
      mappings.push({
        Source: { StackName: extractStackNameFromId(sourceStackId), LogicalResourceId: sourceId },
        Destination: { StackName: extractStackNameFromId(targetStackId), LogicalResourceId: targetId },
      });
      // delete so that subsequent resources cannot mistakenly reuse it
      clonedTargetResources.delete(targetId);
    }
    return mappings;
  }

  protected async gen2LogicalId(sourceId: string, sourceResource: CFNResource, targetResources: Map<string, CFNResource>): Promise<string> {
    const candidates: string[] = Array.from(targetResources.keys()).filter((r) => targetResources.get(r)?.Type === sourceResource.Type);
    if (candidates.length !== 1) {
      throw new AmplifyError('MigrationError', {
        message: `Unable to map Gen1 resource ${sourceId} (${sourceResource.Type}) to Gen2 resource`,
      });
    }
    return candidates[0];
  }

  /**
   * Resolves the Gen1 source stack template.
   * Resolution chain: params → outputs → deps → conditions.
   */
  protected async resolveSource(stackId: string): Promise<ResolvedStack> {
    const facade = this.gen1Env;
    const originalTemplate = await facade.fetchTemplate(stackId);
    const description = await facade.fetchStack(stackId);
    const parameters = resolveNoEchoParameters(originalTemplate, description.Parameters ?? []);
    const outputs = description.Outputs ?? [];

    const stackName = extractStackNameFromId(stackId);
    const withParams = await resolveParameters(originalTemplate, parameters, stackName);
    const stackResources = await facade.fetchStackResources(stackId);
    const withOutputs = await resolveOutputs({
      template: withParams,
      stackOutputs: outputs,
      stackResources,
      cloudControl: this.gen1App.clients.cloudControl,
    });
    const withDeps = resolveDependencies(withOutputs);
    const resolved = resolveConditions(withDeps, parameters);

    return { stackId, resolvedTemplate: resolved, parameters };
  }

  /**
   * Resolves the Gen2 target stack template.
   * Resolution chain: deps → outputs (no params or conditions for Gen2).
   */
  protected async resolveTarget(stackId: string): Promise<ResolvedStack> {
    const facade = this.gen2Branch;
    const originalTemplate = await facade.fetchTemplate(stackId);
    const stack = await facade.fetchStack(stackId);
    const parameters = resolveNoEchoParameters(originalTemplate, stack.Parameters ?? []);
    const outputs = stack.Outputs ?? [];

    const stackName = extractStackNameFromId(stackId);
    const stackResources = await facade.fetchStackResources(stackId);
    const withParams = await resolveParameters(originalTemplate, parameters, stackName);
    const withDeps = resolveDependencies(withParams);
    const resolved = await resolveOutputs({
      template: withDeps,
      stackOutputs: outputs,
      stackResources,
      cloudControl: this.gen1App.clients.cloudControl,
    });

    return { stackId, resolvedTemplate: resolved, parameters };
  }

  /**
   * Moves Gen2 resources to a holding stack before the main refactor.
   * Templates are fetched fresh at execution time.
   */
  protected async beforeMove(blueprint: RefactorBlueprint): Promise<AmplifyMigrationOperation[]> {
    const gen2StackName = extractStackNameFromId(blueprint.targetStackId);
    const holdingStackName = this.getHoldingStackName(gen2StackName);

    this.debug(`Fetching template of gen2 stack: ${gen2StackName}`);
    const gen2StackTemplate = await this.gen2Branch.fetchTemplate(gen2StackName);

    this.debug(`Locating holding stack: ${holdingStackName}`);
    const holdingStack = await this.cfn.findStack(holdingStackName);
    if (
      holdingStack &&
      holdingStack.StackStatus !== 'REVIEW_IN_PROGRESS' &&
      !VALID_HOLDING_STACK_STATUSES.includes(holdingStack.StackStatus!)
    ) {
      throw new AmplifyError('StackStateError', {
        message: `Unexpected state of stack ${holdingStackName}: ${holdingStack.StackStatus} (expected ${VALID_HOLDING_STACK_STATUSES.join(
          ', ',
        )})`,
      });
    }

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
          await this.cfn.refactor(resourceMappings, this.resource, async (targetTemplate: CFNTemplate) => {
            // store the blueprint mappings in the holding stack so we can retrieve them during rollback and auto map
            // back to gen1 logical ids. append to existing since two source stacks can map to a single target (e.g cognito user pools).
            const forwardMappings = (targetTemplate.Metadata?.[HOLDING_STACK_FORWARD_MAPPINGS_METADATA_KEY] ?? []) as ResourceMapping[];
            forwardMappings.push(...blueprint.mappings);
            targetTemplate.Metadata = { [HOLDING_STACK_FORWARD_MAPPINGS_METADATA_KEY]: forwardMappings };
          });
        },
      });
    }

    return operations;
  }

  /**
   * Forward: no post-move operations. Holding stack survives for rollback.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected async afterMove(_blueprint: RefactorBlueprint): Promise<AmplifyMigrationOperation[]> {
    return [];
  }
}
