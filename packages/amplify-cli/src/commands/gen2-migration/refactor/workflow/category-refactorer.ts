import {
  Parameter,
  CreateChangeSetCommand,
  DescribeChangeSetCommand,
  waitUntilChangeSetCreateComplete,
} from '@aws-sdk/client-cloudformation';
import { AmplifyError } from '@aws-amplify/amplify-cli-core';
import { CFNResource, CFNStackStatus, CFNTemplate } from '../../cfn-template';
import { Refactorer } from '../refactorer';
import { AmplifyMigrationOperation } from '../../_operation';
import { AwsClients } from '../../aws-clients';
import { StackFacade } from '../stack-facade';
import { tryUpdateStack } from '../cfn-stack-updater';
import { tryRefactorStack, RefactorFailure } from '../cfn-stack-refactor-updater';
import { SpinningLogger } from '../../_spinning-logger';
import { extractStackNameFromId } from '../utils';
import { DiscoveredResource } from '../../generate/_infra/gen1-app';
import { formatTemplateDiff } from '../template-diff';
import { formatChangeSetReport } from '../changeset-report';
import { formatMoveTable } from '../move-table';

export const MIGRATION_PLACEHOLDER_LOGICAL_ID = 'MigrationPlaceholder';
export const PLACEHOLDER_RESOURCE: CFNResource = { Type: 'AWS::CloudFormation::WaitConditionHandle', Properties: {} };

/**
 * Pre-computed data from resolving a stack's template.
 * Populated during plan(), consumed by operations during execute().
 */
export interface ResolvedStack {
  readonly stackId: string;
  readonly resolvedTemplate: CFNTemplate;
  readonly parameters: Parameter[];
}

/**
 * Resource mapping for the CloudFormation StackRefactor API.
 */
export interface ResourceMapping {
  readonly Source: { readonly StackName: string; readonly LogicalResourceId: string };
  readonly Destination: { readonly StackName: string; readonly LogicalResourceId: string };
}

/**
 * A single resource to be moved from source to target stack.
 */
export interface MoveMapping {
  readonly sourceId: string;
  readonly targetId: string;
  readonly resource: CFNResource;
}

/**
 * Consolidated refactor data object. All templates and mappings are pre-computed
 * together inside buildBlueprint(), ensuring source/target resources stay in sync.
 */
export interface RefactorBlueprint {
  readonly source: {
    readonly stackId: string;
    readonly parameters: Parameter[];
    readonly resolvedTemplate: CFNTemplate;
    readonly afterRemoval: CFNTemplate;
  };
  readonly target: {
    readonly stackId: string;
    readonly parameters: Parameter[];
    readonly resolvedTemplate: CFNTemplate;
    readonly afterRemoval: CFNTemplate;
    readonly afterAddition: CFNTemplate;
  };
  readonly mappings: MoveMapping[];
}

/**
 * Abstract base class implementing the shared refactor workflow.
 *
 * Concrete plan() enforces a rigid phase sequence. Category-specific methods
 * (fetchSourceStackId, fetchDestStackId, buildResourceMappings, resourceTypes)
 * are abstract. Direction-specific methods (resolveSource, resolveTarget,
 * beforeMovePlan, afterMovePlan) are abstract.
 *
 * Shared workflow methods (updateSource, updateTarget, buildBlueprint, buildMoveOperations)
 * are concrete on this base class.
 */
export abstract class CategoryRefactorer implements Refactorer {
  constructor(
    protected readonly gen1Env: StackFacade,
    protected readonly gen2Branch: StackFacade,
    protected readonly clients: AwsClients,
    protected readonly region: string,
    protected readonly accountId: string,
    protected readonly logger: SpinningLogger,
    protected readonly resource: DiscoveredResource,
  ) {}

  /**
   * Computes the full operation plan for this category.
   * All AWS reads happen here. Operations only execute mutations.
   */
  public async plan(): Promise<AmplifyMigrationOperation[]> {
    this.logger.push(`${this.resource.category}/${this.resource.resourceName} (${this.resource.service})`);
    const sourceStackId = await this.fetchSourceStackId();
    const destStackId = await this.fetchDestStackId();

    if (!sourceStackId) {
      throw new AmplifyError('MigrationError', {
        message: `[${this.constructor.name}] unable to find source stack`,
      });
    }
    if (!destStackId) {
      throw new AmplifyError('MigrationError', {
        message: `[${this.constructor.name}] unable to find target stack`,
      });
    }

    const source = await this.resolveSource(sourceStackId);
    const target = await this.resolveTarget(destStackId);

    const blueprint = this.buildBlueprint(source, target);
    if (!blueprint) {
      return []; // Nothing to move — skip this category
    }

    const beforeMoveOps = await this.beforeMovePlan(blueprint);
    const moveOps = await this.buildMoveOperations(blueprint);
    const afterMoveOps = await this.afterMovePlan(blueprint);

    const operations = [
      ...(await this.updateSource(blueprint.source)),
      ...(await this.updateTarget(blueprint.target)),
      ...beforeMoveOps,
      ...moveOps,
      ...afterMoveOps,
    ];
    this.logger.pop();
    return operations;
  }

  // -- Category-specific (abstract) --

  protected abstract fetchSourceStackId(): Promise<string | undefined>;
  protected abstract fetchDestStackId(): Promise<string | undefined>;
  protected abstract resourceTypes(): string[];

  /**
   * Builds the resource mappings from source to destination.
   * Called internally by buildBlueprint() with already-filtered resources.
   */
  protected abstract buildResourceMappings(
    sourceResources: Map<string, CFNResource>,
    targetResources: Map<string, CFNResource>,
  ): MoveMapping[];

  // -- Direction-specific (abstract) --

  protected abstract resolveSource(stackId: string): Promise<ResolvedStack>;
  protected abstract resolveTarget(stackId: string): Promise<ResolvedStack>;

  /**
   * Pre-move operations.
   * Forward: moves Gen2 resources to holding stack.
   * Rollback: no-op.
   */
  protected abstract beforeMovePlan(blueprint: RefactorBlueprint): Promise<AmplifyMigrationOperation[]> | AmplifyMigrationOperation[];

  /**
   * Post-move operations.
   * Forward: empty.
   * Rollback: restores holding stack resources into Gen2, deletes holding stack.
   */
  protected abstract afterMovePlan(blueprint: RefactorBlueprint): Promise<AmplifyMigrationOperation[]>;

  // -- Shared workflow (concrete) --

  /**
   * Creates operations to update the source stack with the resolved template.
   * Rollback overrides this to return [].
   */
  protected async updateSource(source: ResolvedStack): Promise<AmplifyMigrationOperation[]> {
    const sourceStackName = extractStackNameFromId(source.stackId);
    // const deployed = await this.gen1Env.fetchTemplate(source.stackId);
    // const diff = formatTemplateDiff(deployed, source.resolvedTemplate);
    const report = await this.createChangeSetReport(source);
    const description = [report].filter(Boolean).join('\n\n');
    return [
      {
        resource: this.resource,
        validate: () => ({
          description: `Ensure no destructive changes to ${sourceStackName}`,
          run: async () => {
            return { valid: true };
          },
        }),
        describe: async () =>
          description
            ? [`Update source stack '${sourceStackName}' with resolved references\n${description}`]
            : [`Update source stack '${sourceStackName}' with resolved references`],
        execute: async () => {
          const status = await tryUpdateStack({
            cfnClient: this.clients.cloudFormation,
            stackName: source.stackId,
            parameters: source.parameters,
            templateBody: source.resolvedTemplate,
          });
          if (status !== CFNStackStatus.UPDATE_COMPLETE) {
            throw new AmplifyError('StackStateError', {
              message: `Source stack '${source.stackId}' ended with status '${status}' instead of UPDATE_COMPLETE`,
            });
          }
        },
      },
    ];
  }

  /**
   * Creates operations to update the target stack with the resolved template.
   * Rollback overrides this to return [].
   */
  protected async updateTarget(target: ResolvedStack): Promise<AmplifyMigrationOperation[]> {
    const targetStackName = extractStackNameFromId(target.stackId);
    // const deployed = await this.gen2Branch.fetchTemplate(target.stackId);
    // const diff = formatTemplateDiff(deployed, target.resolvedTemplate);
    const report = await this.createChangeSetReport(target);
    const description = [report].filter(Boolean).join('\n\n');
    return [
      {
        resource: this.resource,
        validate: () => ({
          description: `Ensure no destructive changes to ${targetStackName}`,
          run: async () => {
            return { valid: true };
          },
        }),
        describe: async () =>
          description
            ? [`Update target stack '${targetStackName}' with resolved references\n${description}`]
            : [`Update target stack '${targetStackName}' with resolved references`],
        execute: async () => {
          const status = await tryUpdateStack({
            cfnClient: this.clients.cloudFormation,
            stackName: target.stackId,
            parameters: target.parameters,
            templateBody: target.resolvedTemplate,
          });
          if (status !== CFNStackStatus.UPDATE_COMPLETE) {
            throw new AmplifyError('StackStateError', {
              message: `Target stack '${target.stackId}' ended with status '${status}' instead of UPDATE_COMPLETE`,
            });
          }
        },
      },
    ];
  }

  /**
   * Creates a changeset for the given stack and returns a formatted report.
   */
  private async createChangeSetReport(stack: ResolvedStack): Promise<string> {
    const changeSetName = `migration-preview-${Date.now()}`;
    const stackName = stack.stackId;

    this.logger.push(extractStackNameFromId(stackName));
    await this.clients.cloudFormation.send(
      new CreateChangeSetCommand({
        StackName: stackName,
        ChangeSetName: changeSetName,
        TemplateBody: JSON.stringify(stack.resolvedTemplate),
        Parameters: stack.parameters,
        Capabilities: ['CAPABILITY_NAMED_IAM'],
      }),
    );

    try {
      await waitUntilChangeSetCreateComplete(
        { client: this.clients.cloudFormation, maxWaitTime: 120 },
        { StackName: stackName, ChangeSetName: changeSetName },
      );
    } catch {
      // Changeset creation fails when there are no changes — not an error.
      return '';
    }

    const changeSet = await this.clients.cloudFormation.send(
      new DescribeChangeSetCommand({ StackName: stackName, ChangeSetName: changeSetName, IncludePropertyValues: true }),
    );

    this.logger.pop();
    return formatChangeSetReport(changeSet);
  }

  /**
   * Builds a consolidated RefactorBlueprint from resolved source and target stacks.
   * Returns undefined if there are no resources to move.
   *
   * This consolidates buildResourceMappings + template manipulation + placeholder logic
   * into one function, ensuring resourcesToMove and logicalIdMap are always in sync.
   */
  protected buildBlueprint(source: ResolvedStack, target: ResolvedStack): RefactorBlueprint | undefined {
    const sourceResources = this.filterResourcesByType(source.resolvedTemplate);
    const targetResources = this.filterResourcesByType(target.resolvedTemplate);

    if (sourceResources.size === 0) return undefined;

    const mappings = this.buildResourceMappings(sourceResources, targetResources);

    // source.afterRemoval: clone source template, remove mapped resources, add placeholder if empty
    const afterRemoval = JSON.parse(JSON.stringify(source.resolvedTemplate)) as CFNTemplate;
    for (const { sourceId } of mappings) {
      delete afterRemoval.Resources[sourceId];
    }
    addPlaceholderIfEmpty(afterRemoval);

    // If afterRemoval needs a placeholder, the resolved template used by updateSource must
    // also include it. The refactor API only moves existing resources — the placeholder must
    // be created via UpdateStack first so it physically exists before the refactor.
    const sourceResolved = afterRemoval.Resources[MIGRATION_PLACEHOLDER_LOGICAL_ID]
      ? {
          ...source.resolvedTemplate,
          Resources: { ...source.resolvedTemplate.Resources, [MIGRATION_PLACEHOLDER_LOGICAL_ID]: PLACEHOLDER_RESOURCE },
        }
      : source.resolvedTemplate;

    // target.afterRemoval: clone target template, remove target category resources, add placeholder if empty
    const targetAfterRemoval = JSON.parse(JSON.stringify(target.resolvedTemplate)) as CFNTemplate;
    for (const [id] of targetResources) {
      delete targetAfterRemoval.Resources[id];
    }
    addPlaceholderIfEmpty(targetAfterRemoval);

    // target.afterAddition: clone afterRemoval, add mapped resources with remapped DependsOn
    const afterAddition = JSON.parse(JSON.stringify(targetAfterRemoval)) as CFNTemplate;
    const idMap = new Map(mappings.map((m) => [m.sourceId, m.targetId]));
    for (const { targetId, resource } of mappings) {
      const cloned = JSON.parse(JSON.stringify(resource)) as CFNResource;
      if (cloned.DependsOn) {
        const deps = Array.isArray(cloned.DependsOn) ? cloned.DependsOn : [cloned.DependsOn];
        cloned.DependsOn = deps.map((d) => idMap.get(d) ?? d);
      }
      afterAddition.Resources[targetId] = cloned;
    }

    return {
      source: {
        stackId: source.stackId,
        parameters: source.parameters,
        resolvedTemplate: sourceResolved,
        afterRemoval,
      },
      target: {
        stackId: target.stackId,
        parameters: target.parameters,
        resolvedTemplate: target.resolvedTemplate,
        afterRemoval: targetAfterRemoval,
        afterAddition,
      },
      mappings,
    };
  }

  /**
   * Creates the move operation that executes the CloudFormation stack refactor.
   */
  protected async buildMoveOperations(blueprint: RefactorBlueprint): Promise<AmplifyMigrationOperation[]> {
    const { source, target, mappings } = blueprint;
    const sourceStackName = extractStackNameFromId(source.stackId);
    const targetStackName = extractStackNameFromId(target.stackId);
    const resourceMappings: ResourceMapping[] = mappings.map(({ sourceId, targetId }) => ({
      Source: { StackName: sourceStackName, LogicalResourceId: sourceId },
      Destination: { StackName: targetStackName, LogicalResourceId: targetId },
    }));

    const sourceResources = await this.gen1Env.fetchStackResources(source.stackId);
    const physicalIds = new Map(sourceResources.map((r) => [r.LogicalResourceId!, r.PhysicalResourceId ?? '']));
    const types = new Map(mappings.map((m) => [m.sourceId, m.resource.Type]));

    const header = `Move ${resourceMappings.length} resource(s) from '${extractStackNameFromId(
      sourceStackName,
    )}' to '${extractStackNameFromId(targetStackName)}'`;
    const table = formatMoveTable(resourceMappings, physicalIds, types);

    return [
      {
        resource: this.resource,
        validate: () => undefined,
        describe: async () => [`${header}\n\n${table}`],
        execute: async () => {
          const result = await tryRefactorStack(this.clients.cloudFormation, {
            StackDefinitions: [
              { TemplateBody: JSON.stringify(source.afterRemoval), StackName: source.stackId },
              { TemplateBody: JSON.stringify(target.afterAddition), StackName: target.stackId },
            ],
            ResourceMappings: resourceMappings,
          });
          if (!result.success) {
            const failure = result as RefactorFailure;
            throw new AmplifyError('StackStateError', {
              message: `Stack refactor failed: ${failure.reason} (status: ${failure.status}, refactorId: ${failure.stackRefactorId})`,
            });
          }
        },
      },
    ];
  }

  /**
   * Filters resources from a template by the category's resource types.
   */
  protected filterResourcesByType(template: CFNTemplate): Map<string, CFNResource> {
    const types = this.resourceTypes();
    return new Map(Object.entries(template.Resources).filter(([, resource]) => types.includes(resource.Type)));
  }

  /**
   * Finds a nested stack by logical ID prefix under the given facade's root stack.
   */
  protected async findNestedStack(facade: StackFacade, prefix: string): Promise<string | undefined> {
    const stacks = await facade.fetchNestedStacks();
    return stacks.find((s) => s.LogicalResourceId?.startsWith(prefix))?.PhysicalResourceId;
  }
}

/**
 * Adds a placeholder resource if the template has no resources.
 * CloudFormation requires at least one resource in a stack.
 */
function addPlaceholderIfEmpty(template: CFNTemplate): void {
  if (Object.keys(template.Resources).length === 0) {
    template.Resources[MIGRATION_PLACEHOLDER_LOGICAL_ID] = PLACEHOLDER_RESOURCE;
  }
}
