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
  MoveMapping,
  RefactorBlueprint,
  ResolvedStack,
  ResourceMapping,
} from './category-refactorer';
import { formatMoveTable } from '../move-table';

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
  protected buildResourceMappings(sourceResources: Map<string, CFNResource>, _targetResources: Map<string, CFNResource>): MoveMapping[] {
    const mappings: MoveMapping[] = [];
    for (const [sourceId, resource] of sourceResources) {
      const gen1LogicalId = this.targetLogicalId(sourceId, resource);
      if (!gen1LogicalId) {
        throw new AmplifyError('InvalidStackError', {
          message: `No known Gen1 logical ID for resource type '${resource.Type}' (source: '${sourceId}')`,
        });
      }
      mappings.push({ sourceId, targetId: gen1LogicalId, resource });
    }
    return mappings;
  }

  protected abstract targetLogicalId(sourceId: string, sourceResource: CFNResource): string | undefined;

  /**
   * Resolves the Gen2 source stack template for rollback.
   * Resolution chain: params → outputs → deps (no conditions).
   */
  protected async resolveSource(stackId: string): Promise<ResolvedStack> {
    const facade = this.gen2Branch;
    const originalTemplate = await facade.fetchTemplate(stackId);
    const description = await facade.fetchStack(stackId);
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

    return { stackId, resolvedTemplate: resolved, parameters };
  }

  /**
   * Gen1 target: reads template as-is. No resolution needed for rollback destination.
   */
  protected async resolveTarget(stackId: string): Promise<ResolvedStack> {
    const facade = this.gen1Env;
    const originalTemplate = await facade.fetchTemplate(stackId);
    const description = await facade.fetchStack(stackId);
    const parameters = description.Parameters ?? [];

    return { stackId, resolvedTemplate: originalTemplate, parameters };
  }

  protected override async updateSource(): Promise<AmplifyMigrationOperation[]> {
    return [];
  }

  protected override async updateTarget(): Promise<AmplifyMigrationOperation[]> {
    return [];
  }

  /**
   * Rollback: no pre-move operations.
   */
  protected beforeMovePlan(_blueprint: RefactorBlueprint): AmplifyMigrationOperation[] {
    return [];
  }

  /**
   * Restores holding stack resources into Gen2 and deletes the holding stack.
   */
  protected async afterMovePlan(blueprint: RefactorBlueprint): Promise<AmplifyMigrationOperation[]> {
    const gen2StackId = blueprint.source.stackId;
    const holdingStackName = getHoldingStackName(extractStackNameFromId(gen2StackId));

    const holdingStack = await findHoldingStack(this.clients.cloudFormation, holdingStackName);
    if (!holdingStack) return [];

    const holdingTemplateResponse = await this.clients.cloudFormation.send(
      new GetTemplateCommand({ StackName: holdingStackName, TemplateStage: 'Original' }),
    );
    if (!holdingTemplateResponse.TemplateBody) {
      throw new AmplifyError('InvalidStackError', {
        message: `Holding stack '${holdingStackName}' returned an empty template`,
      });
    }

    if (blueprint.mappings.length === 0) {
      return [];
    }

    const restoreMappings: ResourceMapping[] = blueprint.mappings.map((m) => ({
      Source: { StackName: extractStackNameFromId(holdingStackName), LogicalResourceId: m.sourceId },
      Destination: { StackName: extractStackNameFromId(gen2StackId), LogicalResourceId: m.sourceId },
    }));

    const sourceResources = await this.gen2Branch.fetchStackResources(blueprint.source.stackId);
    const physicalIds = new Map(sourceResources.map((r) => [r.LogicalResourceId!, r.PhysicalResourceId!]));
    const restoreTypes = new Map(blueprint.mappings.map((m) => [m.sourceId, m.resource.Type]));

    const header = `Move ${blueprint.mappings.length} resource(s) from '${extractStackNameFromId(
      holdingStackName,
    )}' to '${extractStackNameFromId(gen2StackId)}'`;
    const table = formatMoveTable(restoreMappings, physicalIds, restoreTypes);
    const description = `${header}\n\n${table}`;

    return [
      {
        resource: this.resource,
        validate: () => undefined,
        describe: async () => [description],
        execute: async () => {
          const holdingTemplate = JSON.parse(holdingTemplateResponse.TemplateBody) as CFNTemplate;
          holdingTemplate.Resources[MIGRATION_PLACEHOLDER_LOGICAL_ID] = PLACEHOLDER_RESOURCE;
          await tryUpdateStack({
            cfnClient: this.clients.cloudFormation,
            stackName: holdingStackName,
            parameters: [],
            templateBody: holdingTemplate,
          });

          const targetTemplate = JSON.parse(JSON.stringify(blueprint.source.afterRemoval)) as CFNTemplate;
          for (const mapping of blueprint.mappings) {
            targetTemplate.Resources[mapping.sourceId] = holdingTemplate.Resources[mapping.sourceId];
            delete holdingTemplate.Resources[mapping.sourceId];
          }

          this.logger.info(header);
          const result = await tryRefactorStack(this.clients.cloudFormation, {
            StackDefinitions: [
              { TemplateBody: JSON.stringify(holdingTemplate), StackName: holdingStackName },
              { TemplateBody: JSON.stringify(targetTemplate), StackName: gen2StackId },
            ],
            ResourceMappings: restoreMappings,
          });
          if (!result.success) {
            const failure = result as RefactorFailure;
            throw new AmplifyError('MigrationError', {
              message: `Failed to restore Gen2 resources from holding stack: ${failure.reason}`,
            });
          }
        },
      },
    ];
  }
}
