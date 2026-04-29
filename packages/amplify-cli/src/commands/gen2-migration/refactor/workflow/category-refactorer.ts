import { DescribeChangeSetOutput, Parameter, ResourceMapping } from '@aws-sdk/client-cloudformation';
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
 * Describes a CFN change detail that a refactorer intentionally produces and
 * expects updateTarget() to accept. Used to narrow the updateTarget validate()
 * check so it only fails on UNEXPECTED diffs.
 *
 * A change detail is considered expected iff:
 *   - detail.Target.Attribute === 'Properties'
 *   - change.ResourceChange.LogicalResourceId === entry.logicalId
 *   - detail.Target.Path starts with entry.propertyPathPrefix
 *   - detail.Target.AfterValue contains entry.expectedAfterValueSubstring
 */
export interface ExpectedChange {
  readonly logicalId: string;
  readonly propertyPathPrefix: string;
  readonly expectedAfterValueSubstring: string;
}

interface UnexpectedChangeEntry {
  readonly logicalId: string;
  readonly path: string;
  readonly beforeValue?: string;
  readonly afterValue?: string;
}

/**
 * Returns the subset of change details in the changeset that are NOT covered by
 * any ExpectedChange allowlist entry. If the returned array is empty, all diffs
 * are expected and validate() should pass.
 */
function filterUnexpectedChanges(changeSet: DescribeChangeSetOutput, allowlist: ExpectedChange[]): UnexpectedChangeEntry[] {
  const unexpected: UnexpectedChangeEntry[] = [];
  for (const change of changeSet.Changes ?? []) {
    const rc = change.ResourceChange;
    if (!rc) continue;
    const logicalId = rc.LogicalResourceId ?? '';
    for (const detail of rc.Details ?? []) {
      const target = detail.Target;
      if (target?.Attribute !== 'Properties') continue;
      const path = target.Path ?? '';
      const afterValue = target.AfterValue;
      const matches = allowlist.some(
        (entry) =>
          entry.logicalId === logicalId &&
          path.startsWith(entry.propertyPathPrefix) &&
          typeof afterValue === 'string' &&
          afterValue.includes(entry.expectedAfterValueSubstring),
      );
      if (!matches) {
        unexpected.push({ logicalId, path, beforeValue: target.BeforeValue, afterValue });
      }
    }
  }
  return unexpected;
}

/**
 * Formats the unexpected entries for user display, prepending a summary header
 * to the full rendered changeset report.
 */
function renderUnexpectedChanges(unexpected: UnexpectedChangeEntry[], fullReport: string): string {
  const lines = unexpected.map(
    (u) => `  ${u.logicalId}${u.path}: ${u.beforeValue ?? '(none)'} → ${u.afterValue ?? '(none)'}`,
  );
  return `Unexpected changes:\n${lines.join('\n')}\n\nFull changeset:\n${fullReport}`;
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
    const change = await this.createChangeSetReport(source);
    return [
      {
        resource: this.resource,
        validate: () => ({
          description: `Ensure no unexpected changes to ${sourceStackName}`,
          run: async () => ({ valid: change?.report === undefined, report: change?.report }),
        }),
        describe: async () => {
          if (!change) return [];
          const header = `Update source stack '${sourceStackName}' with resolved references`;
          return [change.report ? `${header}\n\n${change.report.trimStart()}` : `${header} (empty change-set)`];
        },
        execute: async () => {
          if (!change) return;
          await this.cfn.executeChangeSet({ changeSet: change.changeSet, templateBody: source.resolvedTemplate, resource: this.resource });
        },
      },
    ];
  }

  /**
   * Creates operations to update the target stack with the resolved template.
   * Skips if the stack was already updated by a previous refactorer.
   *
   * Unlike updateSource(), updateTarget allows the changeset to contain diffs
   * that are covered by an explicit allowlist returned from expectedTargetChanges().
   * A refactorer that intentionally rewrites part of the target template during
   * resolveTarget() (e.g. replacing an Fn::GetAtt with a literal PLACEHOLDER)
   * must override expectedTargetChanges() so that its intentional diff does not
   * cause validate() to fail. Anything outside the allowlist still fails.
   */
  protected async updateTarget(target: ResolvedStack): Promise<AmplifyMigrationOperation[]> {
    if (this.cfn.isUpdateClaimed(target.stackId)) return [];
    this.cfn.claimUpdate(target.stackId);

    const targetStackName = extractStackNameFromId(target.stackId);
    const change = await this.createChangeSetReport(target);
    return [
      {
        resource: this.resource,
        validate: () => ({
          description: `Ensure no unexpected changes to ${targetStackName}`,
          run: async () => {
            if (!change) return { valid: true };
            const allowlist = this.expectedTargetChanges();
            const unexpected = filterUnexpectedChanges(change.changeSet, allowlist);
            if (unexpected.length === 0) return { valid: true };
            return {
              valid: false,
              report: renderUnexpectedChanges(unexpected, change.report ?? ''),
            };
          },
        }),
        describe: async () => {
          if (!change) return [];
          const header = `Update target stack '${targetStackName}' with resolved references`;
          return [change.report ? `${header}\n\n${change.report.trimStart()}` : `${header} (empty change-set)`];
        },
        execute: async () => {
          if (!change) return;
          await this.cfn.executeChangeSet({ changeSet: change.changeSet, templateBody: target.resolvedTemplate, resource: this.resource });
        },
      },
    ];
  }

  /**
   * Returns an allowlist of CFN changes that updateTarget() should treat as expected.
   * Base implementation: no expected changes — updateTarget validate() fails on any diff.
   *
   * Subclasses that intentionally mutate the target template during resolveTarget()
   * must override this to declare the expected diff, otherwise updateTarget validate()
   * will fail.
   */
  protected expectedTargetChanges(): ExpectedChange[] {
    return [];
  }

  /**
   * Creates a change set for the given stack and returns the described change set with a formatted report.
   */
  protected async createChangeSetReport(
    stack: ResolvedStack,
  ): Promise<{ readonly report: string | undefined; readonly changeSet: DescribeChangeSetOutput } | undefined> {
    const stackName = extractStackNameFromId(stack.stackId);
    this.logger.push(stackName);
    try {
      const changeSet = await this.cfn.createChangeSet({
        stackName: stack.stackId,
        parameters: stack.parameters,
        templateBody: stack.resolvedTemplate,
      });
      if (!changeSet) return undefined;
      const report = this.cfn.renderChangeSet(changeSet);
      return { report, changeSet };
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
          // CloudFormation documents UPDATE_ROLLBACK_COMPLETE as a terminal state from which new updates are permitted.
          // The root-level migration validator (_infra/validations.ts) accepts it so a prior failed update does not
          // prevent retrying with a fixed template; we align the per-category check with that policy.
          if (status !== 'CREATE_COMPLETE' && status !== 'UPDATE_COMPLETE' && status !== 'UPDATE_ROLLBACK_COMPLETE') {
            return {
              valid: false,
              report: `Stack '${stackName}' is in ${
                status ?? 'UNKNOWN'
              } state, expected CREATE_COMPLETE, UPDATE_COMPLETE, or UPDATE_ROLLBACK_COMPLETE`,
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
