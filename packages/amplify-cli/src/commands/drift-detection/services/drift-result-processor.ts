/**
 * Drift result processor service
 * Handles transformation and processing of drift detection results
 */

import type { CloudFormationClient } from '@aws-sdk/client-cloudformation';
import type { CloudFormationTemplate, ConsolidatedDriftResults } from '../consolidated-drift-formatter';
import { ResourceCounter } from './resource-counter';
import { CloudFormationService } from './cloudformation-service';
import { AmplifyConfigService } from './amplify-config-service';

/**
 * Service for processing drift detection results
 */
export class DriftResultProcessor {
  constructor(private readonly cfnService: CloudFormationService, private readonly configService: AmplifyConfigService) {}

  /**
   * Build consolidated results structure for the formatter
   */
  public async buildConsolidatedResults(
    cfn: CloudFormationClient,
    stackName: string,
    rootTemplate: CloudFormationTemplate,
    combinedResults: any,
  ): Promise<ConsolidatedDriftResults> {
    const nestedStacks: Array<{
      logicalId: string;
      physicalName: string;
      category?: string;
      drifts: any[];
      template: CloudFormationTemplate;
    }> = [];
    let totalDrifted = 0;
    let totalInSync = 0;
    let totalUnchecked = 0;
    let totalFailed = 0;

    // Process root stack
    const rootDrifts = combinedResults.rootStackDrifts.StackResourceDrifts || [];
    const rootDrifted = ResourceCounter.countDriftedResources(rootDrifts);
    const rootInSync = ResourceCounter.countInSyncResources(rootDrifts);
    const rootUnchecked = ResourceCounter.countUncheckedResources(rootDrifts, rootTemplate);
    const rootFailed = ResourceCounter.countFailedResources(rootDrifts);

    totalDrifted += rootDrifted;
    totalInSync += rootInSync;
    totalUnchecked += rootUnchecked;
    totalFailed += rootFailed;

    // Process nested stacks
    for (const [logicalId, nestedDrift] of combinedResults.nestedStackDrifts.entries()) {
      if (!nestedDrift.StackResourceDrifts) {
        continue;
      }

      const physicalName = combinedResults.nestedStackPhysicalIds.get(logicalId) || logicalId;
      const nestedTemplate = await this.cfnService.getStackTemplate(cfn, physicalName);

      const nestedDrifted = ResourceCounter.countDriftedResources(nestedDrift.StackResourceDrifts);
      const nestedInSync = ResourceCounter.countInSyncResources(nestedDrift.StackResourceDrifts);
      const nestedUnchecked = ResourceCounter.countUncheckedResources(nestedDrift.StackResourceDrifts, nestedTemplate);
      const nestedFailed = ResourceCounter.countFailedResources(nestedDrift.StackResourceDrifts);

      totalDrifted += nestedDrifted;
      totalInSync += nestedInSync;
      totalUnchecked += nestedUnchecked;
      totalFailed += nestedFailed;

      nestedStacks.push({
        logicalId,
        physicalName,
        category: this.configService.extractCategory(logicalId),
        drifts: nestedDrift.StackResourceDrifts,
        template: nestedTemplate,
      });
    }

    return {
      rootStack: {
        name: stackName,
        drifts: rootDrifts,
        template: rootTemplate,
      },
      nestedStacks,
      summary: {
        totalStacks: 1 + nestedStacks.length,
        totalDrifted,
        totalInSync,
        totalUnchecked,
        totalFailed,
      },
    };
  }

  /**
   * Create simplified JSON output structure
   */
  public createSimplifiedJsonOutput(consolidatedResults: ConsolidatedDriftResults): any {
    return {
      stackName: consolidatedResults.rootStack.name,
      numResourcesWithDrift: consolidatedResults.summary.totalDrifted,
      numResourcesUnchecked: consolidatedResults.summary.totalUnchecked,
      timestamp: new Date().toISOString(),
    };
  }
}
