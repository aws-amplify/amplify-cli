import { Output, Parameter, Stack } from '@aws-sdk/client-cloudformation';
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
    targetStackId: string,
  ): Promise<MoveMapping[]> {
    const stackResources = await this.gen1Env.fetchStackResources(sourceStackId);
    const physicalIds = new Map(stackResources.map((r) => [r.LogicalResourceId, r.PhysicalResourceId]));

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
      mappings.push({ sourceId, targetId, resource: sourceResource, physicalResourceId: physicalIds.get(sourceId) });
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

  protected override async updateSource(source: ResolvedStack): Promise<AmplifyMigrationOperation[]> {
    if (this.gen1Env.isUpdated(source)) {
      return [];
    }
    const operations = super.updateSource(source);
    this.gen1Env.markUpdated(source);
    return operations;
  }

  protected override async updateTarget(target: ResolvedStack): Promise<AmplifyMigrationOperation[]> {
    if (this.gen2Branch.isUpdated(target)) {
      return [];
    }
    const operations = super.updateTarget(target);
    this.gen2Branch.markUpdated(target);
    return operations;
  }

  /**
   * Moves Gen2 resources to a holding stack before the main refactor.
   */
  protected async beforeMove(blueprint: RefactorBlueprint): Promise<AmplifyMigrationOperation[]> {
    const gen2StackName = extractStackNameFromId(blueprint.target.stackId);
    const gen2StackTemplate = JSON.parse(JSON.stringify(blueprint.target.resolvedTemplate)) as CFNTemplate;
    const holdingStackName = this.getHoldingStackName(gen2StackName);
    const { stack: holdingStack, template: holdingStackTemplate } = await this.fetchHoldingStackTemplate(holdingStackName);

    const mappings = blueprint.mappings.map((m) => ({
      sourceId: m.targetId,
      targetId: m.targetId,
      resource: gen2StackTemplate.Resources[m.targetId],
      physicalResourceId: m.physicalResourceId,
    }));

    const resourceMappings = mappings.map(({ sourceId, targetId }) => ({
      Source: { StackName: gen2StackName, LogicalResourceId: sourceId },
      Destination: { StackName: holdingStackName, LogicalResourceId: targetId },
    }));

    for (const mapping of mappings) {
      holdingStackTemplate.Resources[mapping.targetId] = mapping.resource;
      delete gen2StackTemplate.Resources[mapping.sourceId];
    }

    const operations: AmplifyMigrationOperation[] = [];

    if (holdingStack?.StackStatus === 'REVIEW_IN_PROGRESS') {
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
        const header = `Move ${mappings.length} resource(s) from '${gen2StackName}' to '${extractStackNameFromId(holdingStackName)}'`;
        const table = this.renderMappingTable(mappings);
        return [`${header}\n\n${table}`];
      },
      execute: async () => {
        await this.cfn.refactor({
          StackDefinitions: [
            { TemplateBody: JSON.stringify(gen2StackTemplate), StackName: gen2StackName },
            { TemplateBody: JSON.stringify(holdingStackTemplate), StackName: holdingStackName },
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

  protected async fetchHoldingStackTemplate(holdingStackName: string): Promise<{
    readonly stack?: Stack;
    readonly template: CFNTemplate;
  }> {
    const existing = await this.cfn.findStack(holdingStackName);
    const template =
      existing && existing.StackStatus !== 'REVIEW_IN_PROGRESS'
        ? await this.cfn.fetchTemplate(holdingStackName)
        : {
            AWSTemplateFormatVersion: '2010-09-09',
            Description: 'Temporary holding stack for Gen2 migration',
            Resources: {},
            Outputs: {},
          };
    return { stack: existing, template };
  }
}
