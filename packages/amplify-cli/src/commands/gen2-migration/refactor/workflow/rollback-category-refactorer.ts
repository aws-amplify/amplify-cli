import { DescribeChangeSetOutput } from '@aws-sdk/client-cloudformation';
import { AmplifyError } from '@aws-amplify/amplify-cli-core';
import { CFNResource, CFNTemplate } from '../../cfn-template';
import { AmplifyMigrationOperation } from '../../_operation';
import { resolveParameters } from '../resolvers/cfn-parameter-resolver';
import { resolveOutputs } from '../resolvers/cfn-output-resolver';
import { resolveDependencies } from '../resolvers/cfn-dependency-resolver';
import { extractStackNameFromId } from '../utils';
import {
  CategoryRefactorer,
  MIGRATION_PLACEHOLDER_LOGICAL_ID,
  PLACEHOLDER_RESOURCE,
  MoveMapping,
  RefactorBlueprint,
  ResolvedStack,
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
  protected async buildResourceMappings(
    sourceResources: Map<string, CFNResource>,
    targetResources: Map<string, CFNResource>,
    sourceStackId: string,
    targetStackId: string,
  ): Promise<MoveMapping[]> {
    const stackResources = await this.gen2Branch.fetchStackResources(sourceStackId);
    const physicalIds = new Map(stackResources.map((r) => [r.LogicalResourceId, r.PhysicalResourceId]));

    const mappings: MoveMapping[] = [];
    for (const [sourceId, resource] of sourceResources) {
      const gen1LogicalId = this.targetLogicalId(sourceId, resource);
      if (!gen1LogicalId) {
        throw new AmplifyError('MigrationError', {
          message: `Failed building mappings: Unable to determine target id of resource ${sourceId} (${resource.Type})`,
        });
      }
      if (targetResources.has(gen1LogicalId)) {
        continue;
        // throw new AmplifyError('MigrationError', {
        //   message: `Failed building mappings: Resource ${gen1LogicalId} (${
        //     resource.Type
        //   }) already exists in target stack: ${extractStackNameFromId(targetStackId)}`,
        // });
      }
      mappings.push({ sourceId, targetId: gen1LogicalId, resource, physicalResourceId: physicalIds.get(sourceId) ?? '' });
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

  protected override async updateSource(_source: ResolvedStack, _mappings: MoveMapping[]): Promise<AmplifyMigrationOperation[]> {
    return [];
  }

  protected override async updateTarget(_target: ResolvedStack): Promise<AmplifyMigrationOperation[]> {
    return [];
  }

  /**
   * Rollback: no pre-move operations.
   */
  protected beforeMove(_blueprint: RefactorBlueprint): AmplifyMigrationOperation[] {
    return [];
  }

  /**
   * Restores holding stack resources into Gen2 and deletes the holding stack.
   * Templates are fetched fresh at execution time.
   */
  protected async afterMove(blueprint: RefactorBlueprint): Promise<AmplifyMigrationOperation[]> {
    const gen2StackId = blueprint.sourceStackId;
    const holdingStackName = this.getHoldingStackName(extractStackNameFromId(gen2StackId));

    const holdingStack = await this.cfn.findStack(holdingStackName);
    if (!holdingStack) return [];

    const holdingTemplate = await this.cfn.fetchTemplate(holdingStackName);

    const mappings = blueprint.mappings.map((m) => ({
      sourceId: m.sourceId,
      targetId: m.sourceId,
      resource: m.resource,
      physicalResourceId: m.physicalResourceId,
    }));

    const holdingWithPlaceholder = {
      ...holdingTemplate,
      Resources: { ...holdingTemplate.Resources, [MIGRATION_PLACEHOLDER_LOGICAL_ID]: PLACEHOLDER_RESOURCE },
    };

    this.logger.push(extractStackNameFromId(holdingStackName));
    const holdingChangeSet = await this.cfn.createChangeSet({
      stackName: holdingStackName,
      parameters: [],
      templateBody: holdingWithPlaceholder,
    });
    const holdingReport = holdingChangeSet ? this.cfn.renderChangeSet(holdingChangeSet) : undefined;
    this.logger.pop();

    return [
      {
        resource: this.resource,
        validate: () => ({
          description: `Ensure holding stack ${extractStackNameFromId(holdingStackName)} update only adds placeholder`,
          run: async () => ({ valid: this.isPlaceholderOnlyChangeSet(holdingChangeSet), report: holdingReport }),
        }),
        describe: async () => {
          const header = `Update holding stack '${extractStackNameFromId(holdingStackName)}' with placeholder resource`;
          const desc = holdingReport ? `${header}\n\n${holdingReport.trimStart()}\n` : `${header} (empty change-set)`;
          return [desc];
        },
        execute: async () => {
          await this.cfn.update({
            stackName: holdingStackName,
            parameters: [],
            templateBody: holdingWithPlaceholder,
          });
        },
      },
      {
        resource: this.resource,
        validate: () => undefined,
        describe: async () => {
          const header = `Move ${blueprint.mappings.length} resource(s) from '${extractStackNameFromId(
            holdingStackName,
          )}' to '${extractStackNameFromId(gen2StackId)}'`;
          const table = this.renderMappingTable(mappings);
          return [`${header}\n\n${table}`];
        },
        execute: async () => {
          // Fetch fresh templates at execution time
          const source = await this.resolveSource(gen2StackId);
          const currentHoldingTemplate = await this.cfn.fetchTemplate(holdingStackName);
          const currentHoldingWithPlaceholder = {
            ...currentHoldingTemplate,
            Resources: { ...currentHoldingTemplate.Resources, [MIGRATION_PLACEHOLDER_LOGICAL_ID]: PLACEHOLDER_RESOURCE },
          };

          const resourceMappings = mappings.map(({ sourceId, targetId }) => ({
            Source: { StackName: extractStackNameFromId(holdingStackName), LogicalResourceId: sourceId },
            Destination: { StackName: extractStackNameFromId(gen2StackId), LogicalResourceId: targetId },
          }));

          const targetTemplate = JSON.parse(JSON.stringify(source.resolvedTemplate)) as CFNTemplate;
          const holdingAfterRemoval = JSON.parse(JSON.stringify(currentHoldingWithPlaceholder)) as CFNTemplate;
          for (const mapping of resourceMappings) {
            targetTemplate.Resources[mapping.Destination.LogicalResourceId] =
              currentHoldingWithPlaceholder.Resources[mapping.Source.LogicalResourceId];
            delete holdingAfterRemoval.Resources[mapping.Source.LogicalResourceId];
          }

          await this.cfn.refactor({
            StackDefinitions: [
              { TemplateBody: JSON.stringify(holdingAfterRemoval), StackName: holdingStackName },
              { TemplateBody: JSON.stringify(targetTemplate), StackName: gen2StackId },
            ],
            ResourceMappings: resourceMappings,
          });
        },
      },
    ];
  }

  /**
   * Returns true if the changeset is empty or only adds the migration placeholder.
   */
  private isPlaceholderOnlyChangeSet(changeSet: DescribeChangeSetOutput | undefined): boolean {
    if (!changeSet) return true;
    const changes = changeSet.Changes ?? [];
    if (changes.length === 0) return true;
    return changes.every((c) => {
      const rc = c.ResourceChange;
      return rc?.Action === 'Add' && rc?.LogicalResourceId === MIGRATION_PLACEHOLDER_LOGICAL_ID;
    });
  }
}
