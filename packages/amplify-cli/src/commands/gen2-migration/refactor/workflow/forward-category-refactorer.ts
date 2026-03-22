import { Output, Parameter } from '@aws-sdk/client-cloudformation';
import { AmplifyError } from '@aws-amplify/amplify-cli-core';
import { CFNResource, CFNTemplate } from '../../cfn-template';
import { AmplifyMigrationOperation } from '../../_operation';
import { resolveParameters } from '../resolvers/cfn-parameter-resolver';
import { resolveOutputs } from '../resolvers/cfn-output-resolver';
import { resolveDependencies } from '../resolvers/cfn-dependency-resolver';
import { resolveConditions } from '../resolvers/cfn-condition-resolver';
import { extractStackNameFromId } from '../utils';
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
  protected async buildResourceMappings(
    sourceResources: Map<string, CFNResource>,
    targetResources: Map<string, CFNResource>,
    sourceStackId: string,
  ): Promise<MoveMapping[]> {
    const stackResources = await this.gen1Env.fetchStackResources(sourceStackId);
    const physicalIds = new Map(stackResources.map((r) => [r.LogicalResourceId!, r.PhysicalResourceId!]));

    const mappings: MoveMapping[] = [];
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
          message: `Source resource '${sourceId}' (${sourceResource.Type}) has no corresponding target resource`,
        });
      }
      if (matchedTargets.length > 1) {
        throw new AmplifyError('InvalidStackError', {
          message: `Source resource '${sourceId}' (${sourceResource.Type}) has multiple corresponding target resources`,
        });
      }
      const targetId = matchedTargets[0];
      mappings.push({ sourceId, targetId, resource: sourceResource, physicalResourceId: physicalIds.get(sourceId) ?? '' });
    }
    return mappings;
  }

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
  protected async beforeMove(blueprint: RefactorBlueprint): Promise<AmplifyMigrationOperation[]> {
    // holding stack gets all mapping targets
    const targets = blueprint.mappings.map((m) => m.targetId);
    const holdingResources: Record<string, CFNResource> = {};
    for (const logicalId of targets) {
      holdingResources[logicalId] = blueprint.target.resolvedTemplate.Resources[logicalId];
    }

    const holdingStackName = this.getHoldingStackName(extractStackNameFromId(blueprint.target.stackId));

    // in auth, there are two gen1 stacks (cognito, groups) that map to the same gen2 stack.
    // each of them gets its own refactorer so the same holding stack is used twice in sequence.
    const existing = await this.cfn.findStack(holdingStackName);
    if (existing && existing.StackStatus !== 'REVIEW_IN_PROGRESS') {
      const existingTemplate = await this.cfn.fetchTemplate(holdingStackName);
      for (const logicalId of Object.keys(existingTemplate.Resources ?? {})) {
        const existingResource = holdingResources[logicalId];
        if (existingResource) {
          throw new AmplifyError('MigrationError', { message: 'WTF?' });
        }
        holdingResources[logicalId] = existingTemplate.Resources[logicalId];
      }
    }

    const holdingTemplate: CFNTemplate = {
      AWSTemplateFormatVersion: '2010-09-09',
      Description: 'Temporary holding stack for Gen2 migration',
      Resources: holdingResources,
      Outputs: {},
    };

    const holdingMoveMappings: MoveMapping[] = blueprint.mappings.map((m) => ({
      sourceId: m.targetId,
      targetId: m.targetId,
      resource: m.resource,
      physicalResourceId: m.physicalResourceId,
    }));

    const targetStackName = extractStackNameFromId(blueprint.target.stackId);

    const header = `Move ${holdingMoveMappings.length} resource(s) from '${targetStackName}' to '${extractStackNameFromId(
      holdingStackName,
    )}'`;

    const operations: AmplifyMigrationOperation[] = [];

    if (existing?.StackStatus === 'REVIEW_IN_PROGRESS') {
      operations.push({
        resource: this.resource,
        validate: () => undefined,
        describe: async () => [`Delete stale holding stack '${extractStackNameFromId(holdingStackName)}'`],
        execute: async () => {
          await this.cfn.deleteStack(holdingStackName);
        },
      });
    }

    operations.push({
      resource: this.resource,
      validate: () => undefined,
      describe: async () => {
        const table = this.renderMappingTable(holdingMoveMappings);
        return [`${header}\n\n${table}`];
      },
      execute: async () => {
        this.logger.info(header);
        const resourceMappings: ResourceMapping[] = holdingMoveMappings.map(({ sourceId, targetId }) => ({
          Source: { StackName: targetStackName, LogicalResourceId: sourceId },
          Destination: { StackName: extractStackNameFromId(holdingStackName), LogicalResourceId: targetId },
        }));
        await this.cfn.refactor({
          StackDefinitions: [
            { TemplateBody: JSON.stringify(blueprint.target.afterRemoval), StackName: blueprint.target.stackId },
            { TemplateBody: JSON.stringify(holdingTemplate), StackName: holdingStackName },
          ],
          ResourceMappings: resourceMappings,
          EnableStackCreation: true,
        });
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
