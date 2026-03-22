import { GetTemplateCommand, Output, Parameter } from '@aws-sdk/client-cloudformation';
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
import { formatMoveTable } from '../move-table';

/**
 * Forward direction base: moves resources from Gen1 (source) to Gen2 (target).
 *
 * resolveSource: Gen1 resolution — params → outputs → deps → conditions
 * resolveTarget: Gen2 resolution — deps → outputs
 * beforeMovePlan: move Gen2 resources to holding stack
 * afterMovePlan: empty (holding stack survives for rollback)
 */
export abstract class ForwardCategoryRefactorer extends CategoryRefactorer {
  protected buildResourceMappings(sourceResources: Map<string, CFNResource>, targetResources: Map<string, CFNResource>): MoveMapping[] {
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
      mappings.push({ sourceId, targetId, resource: sourceResource });
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
  protected async beforeMovePlan(blueprint: RefactorBlueprint): Promise<AmplifyMigrationOperation[]> {
    // holding stack gets all mapping targets
    const targets = blueprint.mappings.map((m) => m.targetId);
    const holdingResources: Record<string, CFNResource> = {};
    for (const logicalId of targets) {
      holdingResources[logicalId] = blueprint.target.resolvedTemplate.Resources[logicalId];
    }

    const holdingStackName = getHoldingStackName(extractStackNameFromId(blueprint.target.stackId));

    // in auth, there are two gen1 stacks (cognito, groups) that map to the same gen2 stack.
    // each of them gets its own refactorer so the same holding stack is used twice in sequence.
    const existing = await findHoldingStack(this.clients.cloudFormation, holdingStackName);
    if (existing && existing.StackStatus !== 'REVIEW_IN_PROGRESS') {
      const getTemplateResponse = await this.clients.cloudFormation.send(
        new GetTemplateCommand({
          StackName: holdingStackName,
        }),
      );
      const existingTemplate = JSON.parse(getTemplateResponse.TemplateBody ?? '{}');
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

    // Post-holding target = target.afterRemoval (already computed by buildBlueprint)
    const postTargetTemplate = blueprint.target.afterRemoval;

    const holdingMappings: ResourceMapping[] = targets.map((id) => ({
      Source: { StackName: extractStackNameFromId(blueprint.target.stackId), LogicalResourceId: id },
      Destination: { StackName: extractStackNameFromId(holdingStackName), LogicalResourceId: id },
    }));

    const gen2Resources = await this.gen2Branch.fetchStackResources(blueprint.target.stackId);
    const physicalIds = new Map(gen2Resources.map((r) => [r.LogicalResourceId!, r.PhysicalResourceId!]));
    const types = new Map(targets.map((id) => [id, blueprint.mappings.find((m) => m.targetId === id).resource.Type]));

    const header = `Move ${holdingMappings.length} resource(s) from '${extractStackNameFromId(
      blueprint.target.stackId,
    )}' to '${extractStackNameFromId(holdingStackName)}'`;
    const table = formatMoveTable(holdingMappings, physicalIds, types);
    const description = `${header}\n\n${table}`;

    return [
      {
        resource: this.resource,
        validate: () => undefined,
        describe: async () => [description],
        execute: async () => {
          if (existing?.StackStatus === 'REVIEW_IN_PROGRESS') {
            this.logger.info(`Deleting existing holding stack: ${holdingStackName}`);
            await deleteHoldingStack(this.clients.cloudFormation, holdingStackName);
          }

          this.logger.info(header);
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
