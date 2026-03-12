import { Parameter } from '@aws-sdk/client-cloudformation';
import { AmplifyError } from '@aws-amplify/amplify-cli-core';
import { CFNResource, CFNStackStatus, CFNTemplate } from '../../cfn-template';
import { Refactorer } from '../refactorer';
import { AmplifyMigrationOperation } from '../../_operation';
import { AwsClients } from '../aws-clients';
import { StackFacade } from '../stack-facade';
import { tryUpdateStack } from '../cfn-stack-updater';
import { tryRefactorStack, RefactorFailure } from '../cfn-stack-refactor-updater';
import { extractStackNameFromId } from '../utils';

export const MIGRATION_PLACEHOLDER_LOGICAL_ID = 'MigrationPlaceholder';
export const PLACEHOLDER_RESOURCE: CFNResource = { Type: 'AWS::CloudFormation::WaitConditionHandle', Properties: {} };

/**
 * Pre-computed data from resolving a stack's template.
 * Populated during plan(), consumed by operations during execute().
 */
export interface ResolvedStack {
  readonly stackId: string;
  readonly originalTemplate: CFNTemplate;
  readonly resolvedTemplate: CFNTemplate;
  readonly parameters: Parameter[];
  readonly resourcesToMove: Map<string, CFNResource>;
}

/**
 * Resource mapping for the CloudFormation StackRefactor API.
 */
export interface ResourceMapping {
  readonly Source: { readonly StackName: string; readonly LogicalResourceId: string };
  readonly Destination: { readonly StackName: string; readonly LogicalResourceId: string };
}

/**
 * Abstract base class implementing the shared refactor workflow.
 *
 * Concrete plan() enforces a rigid phase sequence. Category-specific methods
 * (fetchSourceStackId, fetchDestStackId, buildResourceMappings, resourceTypes)
 * are abstract. Direction-specific methods (resolveSource, resolveTarget,
 * beforeMovePlan, afterMovePlan) are abstract.
 *
 * Shared workflow methods (updateSource, updateTarget, move, buildRefactorTemplates)
 * are concrete on this base class.
 */
export abstract class CategoryRefactorer implements Refactorer {
  constructor(
    protected readonly gen1Env: StackFacade,
    protected readonly gen2Branch: StackFacade,
    protected readonly clients: AwsClients,
    protected readonly region: string,
    protected readonly accountId: string,
  ) {}

  /**
   * Computes the full operation plan for this category.
   * All AWS reads happen here. Operations only execute mutations.
   */
  public async plan(): Promise<AmplifyMigrationOperation[]> {
    const sourceStackId = await this.fetchSourceStackId();
    const destStackId = await this.fetchDestStackId();

    if (!sourceStackId && !destStackId) return [];
    if (!sourceStackId || !destStackId) {
      throw new AmplifyError('InvalidStackError', {
        message: `Category exists in ${sourceStackId ? 'source' : 'destination'} but not ${sourceStackId ? 'destination' : 'source'} stack`,
      });
    }

    const source = await this.resolveSource(sourceStackId);
    const target = await this.resolveTarget(destStackId);

    if (source.resourcesToMove.size === 0) {
      return []; // Nothing to move — skip this category (matches old behavior)
    }

    const logicalIdMap = this.buildResourceMappings(source.resourcesToMove, target.resourcesToMove);
    const { operations: beforeMoveOps, postTargetTemplate } = this.beforeMovePlan(source, target);
    const { finalSource, finalTarget } = this.buildRefactorTemplates(source, postTargetTemplate, logicalIdMap);

    const moveOps = this.buildMoveOperations(source.stackId, destStackId, finalSource, finalTarget, logicalIdMap);
    const { operations: afterMoveOps } = await this.afterMovePlan({ source, target, finalSource, finalTarget });

    return [...this.updateSource(source), ...this.updateTarget(target), ...beforeMoveOps, ...moveOps, ...afterMoveOps];
  }

  // -- Category-specific (abstract) --

  /**
   * Returns the source stack ID for this category, or undefined if the category doesn't exist.
   */
  protected abstract fetchSourceStackId(): Promise<string | undefined>;

  /**
   * Returns the destination stack ID for this category, or undefined if the category doesn't exist.
   */
  protected abstract fetchDestStackId(): Promise<string | undefined>;

  /**
   * Returns the CFN resource types this category handles (e.g., ['AWS::S3::Bucket']).
   */
  protected abstract resourceTypes(): string[];

  /**
   * Builds the logical ID mapping from source to destination.
   */
  protected abstract buildResourceMappings(
    sourceResources: Map<string, CFNResource>,
    targetResources: Map<string, CFNResource>,
  ): Map<string, string>;

  // -- Direction-specific (abstract) --

  /**
   * Resolves the source stack template. Returns pre-computed data including
   * the resolved template and the resources to move.
   */
  protected abstract resolveSource(stackId: string): Promise<ResolvedStack>;

  /**
   * Resolves the target stack template.
   */
  protected abstract resolveTarget(stackId: string): Promise<ResolvedStack>;

  /**
   * Pre-move operations and the post-operation target template.
   * Forward: moves Gen2 resources to holding stack, returns modified target template.
   * Rollback: no-op, returns target template unchanged.
   */
  protected abstract beforeMovePlan(
    source: ResolvedStack,
    target: ResolvedStack,
  ): { operations: AmplifyMigrationOperation[]; postTargetTemplate: CFNTemplate };

  /**
   * Post-move operations. All reads happen here (during plan()); operations only execute mutations.
   * Forward: empty.
   * Rollback: reads holding stack template, returns 3 operations (update, refactor, delete).
   */
  protected abstract afterMovePlan(params: {
    source: ResolvedStack;
    target: ResolvedStack;
    finalSource: CFNTemplate;
    finalTarget: CFNTemplate;
  }): Promise<{ operations: AmplifyMigrationOperation[] }>;

  // -- Shared workflow (concrete) --

  /**
   * Creates operations to update the source stack with the resolved template.
   * Rollback overrides this to return [].
   */
  protected updateSource(source: ResolvedStack): AmplifyMigrationOperation[] {
    return [
      {
        validate: async () => {
          this.validateNoResourceRemoval(source);
        },
        describe: async () => [`Update source stack '${extractStackNameFromId(source.stackId)}' with resolved references`],
        execute: async () => {
          const status = await tryUpdateStack({
            cfnClient: this.clients.cfn,
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
  protected updateTarget(target: ResolvedStack): AmplifyMigrationOperation[] {
    return [
      {
        validate: async () => {
          this.validateNoResourceRemoval(target);
        },
        describe: async () => [`Update target stack '${extractStackNameFromId(target.stackId)}' with resolved references`],
        execute: async () => {
          const status = await tryUpdateStack({
            cfnClient: this.clients.cfn,
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
   * Manipulates resolved templates to produce the final templates for the refactor API.
   * Removes moved resources from source, adds them to target with remapped IDs.
   */
  protected buildRefactorTemplates(
    source: ResolvedStack,
    postTargetTemplate: CFNTemplate,
    logicalIdMap: Map<string, string>,
  ): { finalSource: CFNTemplate; finalTarget: CFNTemplate } {
    const finalSource = JSON.parse(JSON.stringify(source.resolvedTemplate)) as CFNTemplate;
    const finalTarget = JSON.parse(JSON.stringify(postTargetTemplate)) as CFNTemplate;

    // Remove moved resources from source
    for (const logicalId of source.resourcesToMove.keys()) {
      delete finalSource.Resources[logicalId];
    }

    // Add source resources to target with remapped logical IDs
    for (const [sourceId, resource] of source.resourcesToMove) {
      const targetId = logicalIdMap.get(sourceId);
      if (!targetId) continue;

      const clonedResource = JSON.parse(JSON.stringify(resource)) as CFNResource;

      // Remap DependsOn to use target logical IDs
      if (clonedResource.DependsOn) {
        const deps = Array.isArray(clonedResource.DependsOn) ? clonedResource.DependsOn : [clonedResource.DependsOn];
        clonedResource.DependsOn = deps.map((d) => logicalIdMap.get(d) ?? d);
      }

      finalTarget.Resources[targetId] = clonedResource;
    }

    return { finalSource, finalTarget };
  }

  /**
   * Creates the move operation that executes the CloudFormation stack refactor.
   */
  protected buildMoveOperations(
    sourceStackId: string,
    destStackId: string,
    finalSource: CFNTemplate,
    finalTarget: CFNTemplate,
    logicalIdMap: Map<string, string>,
  ): AmplifyMigrationOperation[] {
    const resourceMappings: ResourceMapping[] = [...logicalIdMap.entries()].map(([sourceLogicalId, destLogicalId]) => ({
      Source: { StackName: extractStackNameFromId(sourceStackId), LogicalResourceId: sourceLogicalId },
      Destination: { StackName: extractStackNameFromId(destStackId), LogicalResourceId: destLogicalId },
    }));

    return [
      {
        validate: async () => {
          // No pre-validation needed for the move operation
        },
        describe: async () => [
          `Move ${resourceMappings.length} resource(s) from '${extractStackNameFromId(sourceStackId)}' to '${extractStackNameFromId(
            destStackId,
          )}'`,
        ],
        execute: async () => {
          const result = await tryRefactorStack(this.clients.cfn, {
            StackDefinitions: [
              { TemplateBody: JSON.stringify(finalSource), StackName: sourceStackId },
              { TemplateBody: JSON.stringify(finalTarget), StackName: destStackId },
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
   * Used by direction subclasses during resolution.
   */
  protected filterResourcesByType(template: CFNTemplate): Map<string, CFNResource> {
    const types = this.resourceTypes();
    return new Map(Object.entries(template.Resources).filter(([, resource]) => types.includes(resource.Type)));
  }

  /**
   * Adds a placeholder resource if all resources in the resolved template are being moved.
   * CloudFormation requires at least one resource in a stack.
   */
  protected addPlaceholderIfNeeded(resolvedTemplate: CFNTemplate, resourcesToMove: Map<string, CFNResource>): void {
    if (Object.keys(resolvedTemplate.Resources).length === resourcesToMove.size) {
      resolvedTemplate.Resources[MIGRATION_PLACEHOLDER_LOGICAL_ID] = PLACEHOLDER_RESOURCE;
    }
  }

  /**
   * Finds a nested stack by logical ID prefix under the given facade's root stack.
   * Returns the physical resource ID (stack ARN) or undefined if not found.
   */
  protected async findNestedStack(facade: StackFacade, prefix: string): Promise<string | undefined> {
    const stacks = await facade.fetchNestedStacks();
    return stacks.find((s) => s.LogicalResourceId?.startsWith(prefix))?.PhysicalResourceId;
  }

  /**
   * R6: Validates that template resolution did not remove any unconditional resources.
   * Resources with a Condition property may be legitimately removed by condition resolution
   * (the condition evaluated to false, so the resource was never created).
   * Only flags removal of resources that have no Condition — those should always survive resolution.
   */
  private validateNoResourceRemoval(stack: ResolvedStack): void {
    const resolvedKeys = new Set(Object.keys(stack.resolvedTemplate.Resources));
    const removed = Object.entries(stack.originalTemplate.Resources)
      .filter(([key, resource]) => !resource.Condition && !resolvedKeys.has(key))
      .map(([key]) => key);
    if (removed.length > 0) {
      throw new AmplifyError('StackStateError', {
        message:
          `Pre-processing stack '${extractStackNameFromId(stack.stackId)}' would remove ${removed.length} resource(s): ` +
          `${removed.join(', ')}. Aborting to prevent resource deletion.`,
      });
    }
  }
}
