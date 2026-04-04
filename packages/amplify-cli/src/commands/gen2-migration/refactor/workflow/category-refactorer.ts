import { Parameter, ResourceMapping } from '@aws-sdk/client-cloudformation';
import { AmplifyError } from '@aws-amplify/amplify-cli-core';
import { CFNResource, CFNTemplate } from '../../_infra/cfn-template';
import { Planner } from '../../_infra/planner';
import { AmplifyMigrationOperation, ValidationResult } from '../../_infra/operation';
import { StackFacade } from '../stack-facade';
import { Cfn, HOLDING_STACK_NAME_SUFFIX } from '../cfn';
import { SpinningLogger } from '../../_infra/spinning-logger';
import { extractStackNameFromId } from '../utils';
import { DiscoveredResource, Gen1App } from '../../generate/_infra/gen1-app';
import CLITable from 'cli-table3';

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
 * Mappings-only refactor plan. Templates are fetched fresh at execution time
 * so that sequential refactorers targeting the same stack always see current state.
 */
export interface RefactorBlueprint {
  readonly sourceStackId: string;
  readonly targetStackId: string;
  readonly mappings: ResourceMapping[];
}

/**
 * Abstract base class implementing the shared refactor workflow.
 *
 * plan() enforces a rigid phase sequence: resolve → build mappings →
 * update stacks → beforeMove → move → afterMove.
 *
 * Category-specific methods (fetchSourceStackId, fetchDestStackId,
 * buildResourceMappings, resourceTypes) are abstract.
 * Direction-specific methods (resolveSource, resolveTarget,
 * beforeMove, afterMove) are abstract.
 */
export abstract class CategoryRefactorer implements Planner {
  constructor(
    protected readonly gen1Env: StackFacade,
    protected readonly gen2Branch: StackFacade,
    protected readonly gen1App: Gen1App,
    protected readonly accountId: string,
    protected readonly logger: SpinningLogger,
    protected readonly resource: DiscoveredResource,
    protected readonly cfn: Cfn,
  ) {}

  /**
   * Computes the full operation plan for this category.
   * All AWS reads happen here. Operations only execute mutations.
   */
  public async plan(): Promise<AmplifyMigrationOperation[]> {
    this.logger.push(`${this.resource.category}/${this.resource.resourceName} (${this.resource.service})`);
    const sourceStackId = await this.fetchSourceStackId();
    const destStackId = await this.fetchDestStackId();

    const resourceSpec = `${this.resource.category}/${this.resource.resourceName} (${this.resource.service})`;
    if (!sourceStackId) {
      throw new AmplifyError('MigrationError', {
        message: `Unable to find source stack for resource: ${resourceSpec}`,
      });
    }
    if (!destStackId) {
      throw new AmplifyError('MigrationError', {
        message: `Unable to find target stack for resource: ${resourceSpec}`,
      });
    }

    const sourceStatusOp = this.buildStackStatusValidation(sourceStackId);
    const destStatusOp = this.buildStackStatusValidation(destStackId);

    const source = await this.resolveSource(sourceStackId);
    const target = await this.resolveTarget(destStackId);

    const sourceResources = this.filterResourcesByType(source.resolvedTemplate);
    const targetResources = this.filterResourcesByType(target.resolvedTemplate);

    const mappings = await this.buildResourceMappings(sourceResources, targetResources, source.stackId, target.stackId);

    const blueprint: RefactorBlueprint = { sourceStackId, targetStackId: destStackId, mappings };

    const updateSourceOps = await this.updateSource(source);
    const updateTargetOps = await this.updateTarget(target);
    const beforeMoveOps = await this.beforeMove(blueprint.targetStackId);
    const moveOps = await this.move(blueprint);
    const afterMoveOps = await this.afterMove(blueprint.sourceStackId);

    const operations = [
      sourceStatusOp,
      destStatusOp,
      ...updateSourceOps,
      ...updateTargetOps,
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
   */
  protected abstract buildResourceMappings(
    sourceResources: Map<string, CFNResource>,
    targetResources: Map<string, CFNResource>,
    sourceStackId: string,
    targetStackId: string,
  ): Promise<ResourceMapping[]>;

  // -- Direction-specific (abstract) --

  protected abstract resolveSource(stackId: string): Promise<ResolvedStack>;
  protected abstract resolveTarget(stackId: string): Promise<ResolvedStack>;

  /**
   * Pre-move operations.
   * Forward: moves Gen2 resources to holding stack.
   * Rollback: no-op.
   */
  protected abstract beforeMove(gen2StackId: string): Promise<AmplifyMigrationOperation[]>;

  /**
   * Post-move operations.
   * Forward: empty.
   * Rollback: restores holding stack resources into Gen2.
   */
  protected abstract afterMove(gen2StackId: string): Promise<AmplifyMigrationOperation[]>;

  // -- Shared workflow (concrete) --

  /**
   * Creates operations to update the source stack with the resolved template.
   * Skips if the stack was already updated by a previous refactorer.
   */
  protected async updateSource(source: ResolvedStack): Promise<AmplifyMigrationOperation[]> {
    if (this.cfn.isUpdateClaimed(source.stackId)) return [];
    this.cfn.claimUpdate(source.stackId);

    const sourceStackName = extractStackNameFromId(source.stackId);
    const report = await this.createChangeSetReport(source);
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
            templateBody: source.resolvedTemplate,
            resource: this.resource,
          });
        },
      },
    ];
  }

  /**
   * Creates operations to update the target stack with the resolved template.
   * Skips if the stack was already updated by a previous refactorer.
   */
  protected async updateTarget(target: ResolvedStack): Promise<AmplifyMigrationOperation[]> {
    if (this.cfn.isUpdateClaimed(target.stackId)) return [];
    this.cfn.claimUpdate(target.stackId);

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
            resource: this.resource,
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
   * Creates the move operation that executes the CloudFormation stack refactor.
   * Templates are fetched and resolved fresh at execution time.
   */
  protected async move(blueprint: RefactorBlueprint): Promise<AmplifyMigrationOperation[]> {
    if (blueprint.mappings.length === 0) {
      return [];
    }
    const sourceStackName = extractStackNameFromId(blueprint.sourceStackId);
    const targetStackName = extractStackNameFromId(blueprint.targetStackId);

    return [
      {
        resource: this.resource,
        validate: () => undefined,
        describe: async () => {
          const header = `Move ${blueprint.mappings.length} resource(s) from '${sourceStackName}' to '${targetStackName}'`;
          const table = this.renderMappingTable(blueprint.mappings);
          return [`${header}\n\n${table}`];
        },
        execute: async () => {
          await this.cfn.refactor(blueprint.mappings, this.resource);
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
    const tail = `${hashSuffix}${HOLDING_STACK_NAME_SUFFIX}`;
    const maxPrefixLength = MAX_STACK_NAME_LENGTH - tail.length;
    return `${prefix.substring(0, maxPrefixLength)}${tail}`;
  }

  /**
   * Renders a CLI table of move mappings.
   */
  protected renderMappingTable(mappings: readonly ResourceMapping[]): string {
    const table = new CLITable({
      head: ['Source Logical ID', 'Target Logical ID'],
      style: { head: [] },
    });
    for (const m of mappings) {
      table.push([m.Source.LogicalResourceId, m.Destination.LogicalResourceId]);
    }
    return `${table.toString()}`;
  }

  protected info(message: string) {
    this.logger.info(`[${this.resource.category}/${this.resource.resourceName}] ${message}`);
  }

  protected debug(message: string) {
    this.logger.debug(`[${this.resource.category}/${this.resource.resourceName}] ${message}`);
  }

  /**
   * Builds a no-op operation whose validate() checks a single stack's status.
   */
  private buildStackStatusValidation(stackId: string): AmplifyMigrationOperation {
    const stackName = extractStackNameFromId(stackId);
    return {
      resource: this.resource,
      describe: async () => [],
      validate: () => ({
        description: `Stack status: ${stackName}`,
        run: async (): Promise<ValidationResult> => {
          const stack = await this.cfn.describeStack(stackId);
          const status = stack.StackStatus;
          if (status !== 'CREATE_COMPLETE' && status !== 'UPDATE_COMPLETE') {
            return {
              valid: false,
              report: `Stack '${stackName}' is in ${status ?? 'UNKNOWN'} state, expected CREATE_COMPLETE or UPDATE_COMPLETE`,
            };
          }
          return { valid: true };
        },
      }),
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      execute: async () => {},
    };
  }
}
