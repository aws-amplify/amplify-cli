import { Parameter } from '@aws-sdk/client-cloudformation';
import { AmplifyError } from '@aws-amplify/amplify-cli-core';
import { CFNResource, CFNTemplate } from '../../cfn-template';
import { Planner } from '../../planner';
import { AmplifyMigrationOperation, buildNoopOperation } from '../../_operation';
import { AwsClients } from '../../aws-clients';
import { StackFacade } from '../stack-facade';
import { Cfn } from '../cfn';
import { SpinningLogger } from '../../_spinning-logger';
import { extractStackNameFromId } from '../utils';
import { DiscoveredResource } from '../../generate/_infra/gen1-app';
import CLITable from 'cli-table3';

export const MIGRATION_PLACEHOLDER_LOGICAL_ID = 'MigrationPlaceholder';
export const PLACEHOLDER_RESOURCE: CFNResource = { Type: 'AWS::CloudFormation::WaitConditionHandle', Properties: {} };
export const HOLDING_STACK_SUFFIX = '-holding';
const MAX_STACK_NAME_LENGTH = 128;

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
  readonly physicalResourceId: string;
}

/**
 * Mappings-only refactor plan. Templates are fetched fresh at execution time
 * so that sequential refactorers targeting the same stack always see current state.
 */
export interface RefactorBlueprint {
  readonly sourceStackId: string;
  readonly targetStackId: string;
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
export abstract class CategoryRefactorer implements Planner {
  constructor(
    protected readonly gen1Env: StackFacade,
    protected readonly gen2Branch: StackFacade,
    protected readonly clients: AwsClients,
    protected readonly region: string,
    protected readonly accountId: string,
    protected readonly logger: SpinningLogger,
    protected readonly resource: DiscoveredResource,
  ) {
    this.cfn = new Cfn(clients.cloudFormation, logger, resource);
  }

  protected readonly cfn: Cfn;

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

    const mappings = await this.buildMappings(source, target);
    if (mappings.length === 0) {
      this.logger.pop();
      return [buildNoopOperation(this.resource)];
    }

    const blueprint: RefactorBlueprint = { sourceStackId, targetStackId: destStackId, mappings };

    const updateSourceOps = await this.updateSource(source, mappings);
    const updateTargetOps = await this.updateTarget(target);
    const beforeMoveOps = await this.beforeMove(blueprint);
    const moveOps = await this.move(blueprint);
    const afterMoveOps = await this.afterMove(blueprint);

    const operations = [...updateSourceOps, ...updateTargetOps, ...beforeMoveOps, ...moveOps, ...afterMoveOps];
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
    sourceStackId: string,
    targetStackId: string,
  ): Promise<MoveMapping[]>;

  // -- Direction-specific (abstract) --

  protected abstract resolveSource(stackId: string): Promise<ResolvedStack>;
  protected abstract resolveTarget(stackId: string): Promise<ResolvedStack>;

  /**
   * Pre-move operations.
   * Forward: moves Gen2 resources to holding stack.
   * Rollback: no-op.
   */
  protected abstract beforeMove(blueprint: RefactorBlueprint): Promise<AmplifyMigrationOperation[]> | AmplifyMigrationOperation[];

  /**
   * Post-move operations.
   * Forward: empty.
   * Rollback: restores holding stack resources into Gen2, deletes holding stack.
   */
  protected abstract afterMove(blueprint: RefactorBlueprint): Promise<AmplifyMigrationOperation[]>;

  // -- Shared workflow (concrete) --

  /**
   * Creates operations to update the source stack with the resolved template.
   * Adds a placeholder resource if removing the mapped resources would leave the stack empty.
   * Rollback overrides this to return [].
   */
  protected async updateSource(source: ResolvedStack, mappings: MoveMapping[]): Promise<AmplifyMigrationOperation[]> {
    const sourceStackName = extractStackNameFromId(source.stackId);

    // Check if removing mapped resources would leave the stack empty
    const remainingResources = { ...source.resolvedTemplate.Resources };
    for (const { sourceId } of mappings) {
      delete remainingResources[sourceId];
    }
    const needsPlaceholder = Object.keys(remainingResources).length === 0;

    const resolvedTemplate = needsPlaceholder
      ? {
          ...source.resolvedTemplate,
          Resources: { ...source.resolvedTemplate.Resources, [MIGRATION_PLACEHOLDER_LOGICAL_ID]: PLACEHOLDER_RESOURCE },
        }
      : source.resolvedTemplate;

    const resolvedStack: ResolvedStack = { ...source, resolvedTemplate: resolvedTemplate };
    const report = await this.createChangeSetReport(resolvedStack);
    return [
      {
        resource: this.resource,
        validate: () => ({
          description: `Ensure no unexpected changes to ${sourceStackName}`,
          run: async () => ({ valid: report === undefined, report }),
        }),
        describe: async () => {
          const header = `Update source stack '${sourceStackName}' with resolved references`;
          return [report ? `${header}\n\n${report.trimStart()}` : `${header} (empty change-set)`];
        },
        execute: async () => {
          await this.cfn.update({
            stackName: source.stackId,
            parameters: source.parameters,
            templateBody: resolvedTemplate,
          });
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
    const report = await this.createChangeSetReport(target);
    return [
      {
        resource: this.resource,
        validate: () => ({
          description: `Ensure no unexpected changes to ${targetStackName}`,
          run: async () => ({ valid: report === undefined, report }),
        }),
        describe: async () => {
          const header = `Update target stack '${targetStackName}' with resolved references`;
          return [report ? `${header}\n\n${report.trimStart()}` : `${header} (empty change-set)`];
        },
        execute: async () => {
          await this.cfn.update({
            stackName: target.stackId,
            parameters: target.parameters,
            templateBody: target.resolvedTemplate,
          });
        },
      },
    ];
  }

  /**
   * Creates a changeset for the given stack and returns a formatted report.
   */
  protected async createChangeSetReport(stack: ResolvedStack): Promise<string | undefined> {
    const stackName = extractStackNameFromId(stack.stackId);
    this.logger.push(stackName);
    try {
      const changeSet = await this.cfn.createChangeSet({
        stackName: stack.stackId,
        parameters: stack.parameters,
        templateBody: stack.resolvedTemplate,
      });
      return changeSet ? this.cfn.renderChangeSet(changeSet) : undefined;
    } finally {
      this.logger.pop();
    }
  }

  /**
   * Builds resource mappings from resolved source and target stacks.
   * Returns an empty array if there are no resources to move.
   */
  protected async buildMappings(source: ResolvedStack, target: ResolvedStack): Promise<MoveMapping[]> {
    const sourceResources = this.filterResourcesByType(source.resolvedTemplate);
    const targetResources = this.filterResourcesByType(target.resolvedTemplate);

    if (sourceResources.size === 0) return [];

    return this.buildResourceMappings(sourceResources, targetResources, source.stackId, target.stackId);
  }

  /**
   * Creates the move operation that executes the CloudFormation stack refactor.
   * Templates are fetched and resolved fresh at execution time.
   */
  protected async move(blueprint: RefactorBlueprint): Promise<AmplifyMigrationOperation[]> {
    const { sourceStackId, targetStackId, mappings } = blueprint;
    const sourceStackName = extractStackNameFromId(sourceStackId);
    const targetStackName = extractStackNameFromId(targetStackId);

    const header = `Move ${mappings.length} resource(s) from '${sourceStackName}' to '${targetStackName}'`;
    const table = this.renderMappingTable(mappings);

    const resourceMappings: ResourceMapping[] = mappings.map(({ sourceId, targetId }) => ({
      Source: { StackName: sourceStackName, LogicalResourceId: sourceId },
      Destination: { StackName: targetStackName, LogicalResourceId: targetId },
    }));

    return [
      {
        resource: this.resource,
        validate: () => undefined,
        describe: async () => {
          return [`${header}\n\n${table}`];
        },
        execute: async () => {
          const source = await this.resolveSource(sourceStackId);
          const target = await this.resolveTarget(targetStackId);

          // Build afterRemoval: source template minus mapped resources.
          // The placeholder (if needed) was already added by updateSource.
          const afterRemoval = JSON.parse(JSON.stringify(source.resolvedTemplate)) as CFNTemplate;
          for (const { sourceId } of mappings) {
            delete afterRemoval.Resources[sourceId];
          }

          // Build afterAddition: target template plus mapped resources with remapped DependsOn
          const afterAddition = JSON.parse(JSON.stringify(target.resolvedTemplate)) as CFNTemplate;
          const idMap = new Map(mappings.map((m) => [m.sourceId, m.targetId]));
          for (const { targetId, resource } of mappings) {
            const cloned = JSON.parse(JSON.stringify(resource)) as CFNResource;
            if (cloned.DependsOn) {
              const deps = Array.isArray(cloned.DependsOn) ? cloned.DependsOn : [cloned.DependsOn];
              cloned.DependsOn = deps.map((d) => idMap.get(d) ?? d);
            }
            afterAddition.Resources[targetId] = cloned;
          }

          await this.cfn.refactor({
            StackDefinitions: [
              { TemplateBody: JSON.stringify(afterRemoval), StackName: sourceStackId },
              { TemplateBody: JSON.stringify(afterAddition), StackName: targetStackId },
            ],
            ResourceMappings: resourceMappings,
          });
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

  /**
   * Derives the holding stack name from a Gen2 category stack name.
   * Preserves the CloudFormation hash suffix for uniqueness.
   */
  protected getHoldingStackName(gen2CategoryStackId: string): string {
    const lastDashIndex = gen2CategoryStackId.lastIndexOf('-');
    const prefix = gen2CategoryStackId.substring(0, lastDashIndex);
    const hashSuffix = gen2CategoryStackId.substring(lastDashIndex);
    const tail = `${hashSuffix}${HOLDING_STACK_SUFFIX}`;
    const maxPrefixLength = MAX_STACK_NAME_LENGTH - tail.length;
    return `${prefix.substring(0, maxPrefixLength)}${tail}`;
  }

  /** Renders a CLI table of move mappings. */
  protected renderMappingTable(mappings: readonly MoveMapping[]): string {
    const table = new CLITable({
      head: ['Type', 'Source Logical ID', 'Target Logical ID', 'Physical ID'],
      style: { head: [] },
    });
    for (const m of mappings) {
      table.push([m.resource.Type, m.sourceId, m.targetId, m.physicalResourceId]);
    }
    return `${table.toString()}\n`;
  }
}
