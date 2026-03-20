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

  protected override updateSource(): AmplifyMigrationOperation[] {
    return [];
  }

  protected override updateTarget(): AmplifyMigrationOperation[] {
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
    const holdingTemplate = JSON.parse(holdingTemplateResponse.TemplateBody) as CFNTemplate;

    const resourcesToRestore = Object.entries(holdingTemplate.Resources).filter(([id]) => id !== MIGRATION_PLACEHOLDER_LOGICAL_ID);
    if (resourcesToRestore.length === 0) {
      return [this.buildDeleteHoldingStackOp(holdingStackName)];
    }

    const holdingWithPlaceholder: CFNTemplate = {
      ...holdingTemplate,
      Resources: { [MIGRATION_PLACEHOLDER_LOGICAL_ID]: PLACEHOLDER_RESOURCE, ...holdingTemplate.Resources },
    };

    const restoreTarget = JSON.parse(JSON.stringify(blueprint.source.afterRemoval)) as CFNTemplate;
    for (const [logicalId, resource] of resourcesToRestore) {
      restoreTarget.Resources[logicalId] = resource;
    }

    const emptyHolding: CFNTemplate = {
      AWSTemplateFormatVersion: '2010-09-09',
      Description: 'Temporary holding stack for Gen2 migration',
      Resources: { [MIGRATION_PLACEHOLDER_LOGICAL_ID]: PLACEHOLDER_RESOURCE },
      Outputs: {},
    };

    const restoreMappings: ResourceMapping[] = resourcesToRestore.map(([logicalId]) => ({
      Source: { StackName: extractStackNameFromId(holdingStackName), LogicalResourceId: logicalId },
      Destination: { StackName: extractStackNameFromId(gen2StackId), LogicalResourceId: logicalId },
    }));

    return [
      {
        validate: () => undefined,
        describe: async () => [`Update ${holdingStackName} to include placeholder resource`],
        execute: async () => {
          await tryUpdateStack({
            cfnClient: this.clients.cloudFormation,
            stackName: holdingStackName,
            parameters: [],
            templateBody: holdingWithPlaceholder,
          });
        },
      },
      {
        validate: () => undefined,
        describe: async () => [`Restore ${resourcesToRestore.length} resource(s) from holding stack to Gen2`],
        execute: async () => {
          const result = await tryRefactorStack(this.clients.cloudFormation, {
            StackDefinitions: [
              { TemplateBody: JSON.stringify(emptyHolding), StackName: holdingStackName },
              { TemplateBody: JSON.stringify(restoreTarget), StackName: gen2StackId },
            ],
            ResourceMappings: restoreMappings,
          });
          if (!result.success) {
            const failure = result as RefactorFailure;
            throw new AmplifyError('StackStateError', {
              message: `Failed to restore Gen2 resources from holding stack: ${failure.reason}`,
            });
          }
        },
      },
      this.buildDeleteHoldingStackOp(holdingStackName),
    ];
  }

  private buildDeleteHoldingStackOp(holdingStackName: string): AmplifyMigrationOperation {
    return {
      validate: () => undefined,
      describe: async () => [`Delete holding stack '${holdingStackName}'`],
      execute: async () => {
        await deleteHoldingStack(this.clients.cloudFormation, holdingStackName);
      },
    };
  }
}
