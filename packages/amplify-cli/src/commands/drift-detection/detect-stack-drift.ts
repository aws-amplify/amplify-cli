/**
 * Core drift detection logic for CloudFormation stacks
 */

import {
  CloudFormationClient,
  DetectStackDriftCommand,
  DescribeStackDriftDetectionStatusCommand,
  DescribeStackResourceDriftsCommand,
  DescribeStackResourcesCommand,
  type DescribeStackResourceDriftsCommandOutput,
  type DescribeStackDriftDetectionStatusCommandOutput,
  type StackResourceDrift,
} from '@aws-sdk/client-cloudformation';
import { AmplifyError } from '@aws-amplify/amplify-cli-core';
import { getAmplifyLogger } from '@aws-amplify/amplify-cli-logger';
import chalk from 'chalk';

const logger = getAmplifyLogger();

/**
 * Combined drift results including nested stacks
 */
export interface CombinedDriftResults {
  /**
   * Drift results for the root stack
   */
  rootStackDrifts: DescribeStackResourceDriftsCommandOutput;

  /**
   * Drift results for nested stacks, keyed by logical resource ID
   */
  nestedStackDrifts: Map<string, DescribeStackResourceDriftsCommandOutput>;

  /**
   * Map of logical resource IDs to physical resource IDs for nested stacks
   */
  nestedStackPhysicalIds: Map<string, string>;
}

/**
 * Detect drift for a CloudFormation stack and wait for the detection to complete
 *
 * @param cfn - CloudFormation client
 * @param stackName - the name of the stack to check for drift
 * @param print - printer for user feedback
 * @returns the CloudFormation description of the drift detection results
 */
export async function detectStackDrift(
  cfn: CloudFormationClient,
  stackName: string,
  print?: { info: (msg: string) => void; debug: (msg: string) => void; warning: (msg: string) => void },
): Promise<DescribeStackResourceDriftsCommandOutput> {
  // Start drift detection
  logger.logInfo({ message: `detectStackDrift: ${stackName}` });
  const driftDetection = await cfn.send(
    new DetectStackDriftCommand({
      StackName: stackName,
    }),
  );

  if (print?.debug) {
    print.debug(`Detecting drift with ID ${driftDetection.StackDriftDetectionId} for stack ${stackName}...`);
  }

  // Wait for drift detection to complete
  const driftStatus = await waitForDriftDetection(cfn, driftDetection.StackDriftDetectionId!, print);

  // Handle UNKNOWN stack drift status
  if (driftStatus?.StackDriftStatus === 'UNKNOWN') {
    const reason = formatReason(driftStatus.DetectionStatusReason);
    if (print?.debug) {
      print.debug(
        'Stack drift status is UNKNOWN. This may occur when CloudFormation is unable to detect drift for at least one resource and all other resources are IN_SYNC.\n' +
          `Reason: ${reason}`,
      );
    }
  }

  // Get the drift results, including ALL statuses (IN_SYNC, MODIFIED, DELETED, NOT_CHECKED)
  const driftResults = await cfn.send(
    new DescribeStackResourceDriftsCommand({
      StackName: stackName,
      StackResourceDriftStatusFilters: ['IN_SYNC', 'MODIFIED', 'DELETED', 'NOT_CHECKED'],
    }),
  );

  // Get ALL resources in the stack to find NOT_CHECKED ones
  const allResources = await cfn.send(
    new DescribeStackResourcesCommand({
      StackName: stackName,
    }),
  );

  // Create a map of drift results by logical resource ID
  const driftMap = new Map<string, StackResourceDrift>();
  for (const drift of driftResults.StackResourceDrifts || []) {
    if (drift.LogicalResourceId) {
      driftMap.set(drift.LogicalResourceId, drift);
    }
  }

  // Build complete resource list with drift status
  const completeResourceList: Array<{
    logicalId: string;
    resourceType: string;
    driftStatus: string;
    drift?: StackResourceDrift;
  }> = [];

  for (const resource of allResources.StackResources || []) {
    if (!resource.LogicalResourceId) continue;

    const drift = driftMap.get(resource.LogicalResourceId);
    completeResourceList.push({
      logicalId: resource.LogicalResourceId,
      resourceType: resource.ResourceType || 'Unknown',
      driftStatus: drift?.StackResourceDriftStatus || 'NOT_CHECKED',
      drift,
    });
  }

  // Print detailed resource table in verbose mode
  if (print?.debug && completeResourceList.length > 0) {
    // Count resources by status
    const statusCounts = {
      IN_SYNC: 0,
      MODIFIED: 0,
      DELETED: 0,
      NOT_CHECKED: 0,
      UNKNOWN: 0,
    };

    for (const resource of completeResourceList) {
      const status = resource.driftStatus;
      if (status in statusCounts) {
        statusCounts[status as keyof typeof statusCounts]++;
      }
    }

    print.debug('Resource drift status:');

    for (const resource of completeResourceList) {
      const status = resource.driftStatus;
      const logicalId = resource.logicalId.substring(0, 50).padEnd(50);
      const resourceType = resource.resourceType.substring(0, 30).padEnd(30);

      let statusDisplay = '';
      switch (status) {
        case 'IN_SYNC':
          statusDisplay = '✓ IN_SYNC  ';
          break;
        case 'MODIFIED':
          statusDisplay = '✗ MODIFIED ';
          break;
        case 'DELETED':
          statusDisplay = '✗ DELETED  ';
          break;
        case 'NOT_CHECKED':
          statusDisplay = '○ UNCHECKED';
          break;
        default:
          statusDisplay = '? UNKNOWN  ';
      }

      print.debug(`  ${statusDisplay}  ${logicalId}  ${resourceType}`);

      // Show property differences for MODIFIED resources
      if (status === 'MODIFIED' && resource.drift?.PropertyDifferences && resource.drift.PropertyDifferences.length > 0) {
        for (const propDiff of resource.drift.PropertyDifferences) {
          const propPath = (propDiff.PropertyPath || '').substring(0, 60);
          const diffType = propDiff.DifferenceType || 'UNKNOWN';
          print.debug(`      → ${propPath.padEnd(60)}  ${diffType}`);
        }
      }
    }
  }

  logger.logInfo({ message: `detectStackDrift.complete: ${stackName}, ${driftResults.StackResourceDrifts?.length} resources` });
  return driftResults;
}

/**
 * Wait for a drift detection operation to complete
 * Based on CDK's polling strategy: 5-minute timeout, 2-second polling interval, 10-second user feedback
 */
async function waitForDriftDetection(
  cfn: CloudFormationClient,
  driftDetectionId: string,
  print?: { info: (msg: string) => void },
): Promise<DescribeStackDriftDetectionStatusCommandOutput | undefined> {
  const maxWaitForDrift = 300_000; // 5 minutes max
  const timeBetweenOutputs = 10_000; // User feedback every 10 seconds
  const timeBetweenApiCalls = 2_000; // API calls every 2 seconds for rate limiting

  const deadline = Date.now() + maxWaitForDrift;
  let checkIn = Date.now() + timeBetweenOutputs;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const response = await cfn.send(
      new DescribeStackDriftDetectionStatusCommand({
        StackDriftDetectionId: driftDetectionId,
      }),
    );

    if (response.DetectionStatus === 'DETECTION_COMPLETE') {
      return response;
    }

    if (response.DetectionStatus === 'DETECTION_FAILED') {
      throw new AmplifyError('CloudFormationTemplateError', {
        message: `Drift detection failed: ${formatReason(response.DetectionStatusReason)}`,
        resolution: 'Check CloudFormation console for more details or try again.',
      });
    }

    if (Date.now() > deadline) {
      throw new AmplifyError('CloudFormationTemplateError', {
        message: `Drift detection timed out after ${maxWaitForDrift / 1000} seconds.`,
        resolution: 'The stack may be too large or AWS may be experiencing issues. Try again later.',
      });
    }

    if (Date.now() > checkIn && print?.info) {
      print.info('Waiting for drift detection to complete...');
      checkIn = Date.now() + timeBetweenOutputs;
    }

    // Wait between API calls to avoid rate limiting (CDK does this too)
    await new Promise((resolve) => setTimeout(resolve, timeBetweenApiCalls));
  }
}

/**
 * Detect drift recursively for a stack and all its nested stacks
 *
 * This is necessary for Amplify because category stacks (auth, storage, etc.)
 * are deployed as nested stacks and are not separate artifacts.
 *
 * @param cfn - CloudFormation client
 * @param stackName - the name of the root stack to check for drift
 * @param print - printer for user feedback
 * @param level - current nesting level (for tracking)
 * @param parentPrefix - prefix for nested stack names (for display)
 * @returns combined drift results for root and all nested stacks
 */
export async function detectStackDriftRecursive(
  cfn: CloudFormationClient,
  stackName: string,
  print?: { info: (msg: string) => void; debug: (msg: string) => void; warning: (msg: string) => void },
  level = 0,
  parentPrefix = '',
): Promise<CombinedDriftResults> {
  logger.logInfo({ message: `detectStackDriftRecursive: ${stackName} (level ${level})` });

  // Detect drift on the current stack
  const currentStackDrifts = await detectStackDrift(cfn, stackName, print);

  // Get all resources in the current stack to find nested stacks
  const stackResources = await cfn.send(
    new DescribeStackResourcesCommand({
      StackName: stackName,
    }),
  );

  // Find all nested stacks in the current stack
  const nestedStacks = stackResources.StackResources?.filter((resource) => resource.ResourceType === 'AWS::CloudFormation::Stack') || [];

  if (nestedStacks.length > 0 && print?.info) {
    print.info(chalk.gray(`Found ${chalk.yellow(nestedStacks.length)} nested stack(s)`));
  }

  // Initialize results
  const nestedStackDrifts = new Map<string, DescribeStackResourceDriftsCommandOutput>();
  const nestedStackPhysicalIds = new Map<string, string>();

  // Process each nested stack recursively
  for (const nestedStack of nestedStacks) {
    if (!nestedStack.LogicalResourceId || !nestedStack.PhysicalResourceId) {
      continue;
    }

    // Skip if the nested stack has been deleted
    if (nestedStack.ResourceStatus?.includes('DELETE')) {
      if (print?.debug) {
        print.debug(`Skipping deleted nested stack: ${nestedStack.LogicalResourceId}`);
      }
      continue;
    }

    try {
      if (print?.info) {
        print.info(chalk.gray(`Checking drift for nested stack: ${chalk.yellow(nestedStack.LogicalResourceId)}`));
      }

      // Extract stack name from PhysicalResourceId
      // Handle both ARN format and direct stack names
      let nestedStackName = nestedStack.PhysicalResourceId;

      // ARN format: arn:aws:cloudformation:region:account:stack/stack-name/id
      if (nestedStackName.startsWith('arn:aws:cloudformation:')) {
        try {
          // Split by colon first to get the resource part
          const arnComponents = nestedStackName.split(':');
          if (arnComponents.length >= 6) {
            // The 6th component contains stack/stack-name/id
            const resourcePart = arnComponents[5];
            if (resourcePart && resourcePart.startsWith('stack/')) {
              // Extract stack name from stack/stack-name/id
              const stackParts = resourcePart.split('/');
              if (stackParts.length >= 2) {
                nestedStackName = stackParts[1];
              }
            }
          }
        } catch (e) {
          // If parsing fails, log and use the original value
          logger.logInfo({
            message: `Failed to parse ARN for nested stack ${nestedStack.LogicalResourceId}: ${nestedStackName}. Using original value.`,
          });
        }
      }

      // Validate the extracted name
      if (!nestedStackName || nestedStackName === nestedStack.PhysicalResourceId) {
        logger.logInfo({
          message: `Could not extract stack name from PhysicalResourceId: ${nestedStack.PhysicalResourceId}`,
        });
      }

      // Store the mapping
      nestedStackPhysicalIds.set(nestedStack.LogicalResourceId, nestedStackName);

      // Recursively detect drift for this nested stack and all its children
      const nestedResults = await detectStackDriftRecursive(cfn, nestedStackName, print, level + 1, nestedStack.LogicalResourceId);

      // Store the direct drift results for this nested stack
      nestedStackDrifts.set(nestedStack.LogicalResourceId, nestedResults.rootStackDrifts);

      // Merge the nested stack's nested results into our results
      nestedResults.nestedStackDrifts.forEach((value, key) => {
        // Prefix the key with the parent stack's logical ID for clarity
        const fullKey = `${nestedStack.LogicalResourceId}/${key}`;
        nestedStackDrifts.set(fullKey, value);
      });

      // Also merge the physical IDs
      nestedResults.nestedStackPhysicalIds.forEach((value, key) => {
        const fullKey = `${nestedStack.LogicalResourceId}/${key}`;
        nestedStackPhysicalIds.set(fullKey, value);
      });

      logger.logInfo({
        message: `detectStackDriftRecursive.nestedStack: ${nestedStack.LogicalResourceId}, ${nestedResults.rootStackDrifts.StackResourceDrifts?.length} direct resources, ${nestedResults.nestedStackDrifts.size} sub-stacks`,
      });
    } catch (error: any) {
      // Log error but continue checking other nested stacks
      if (print?.warning) {
        print.warning(`Failed to check drift for nested stack ${nestedStack.LogicalResourceId}: ${error.message}`);
      }
      logger.logError({
        message: `detectStackDriftRecursive.nestedStack.error: ${nestedStack.LogicalResourceId}`,
        error: error,
      });
    }
  }

  logger.logInfo({
    message: `detectStackDriftRecursive.complete: ${stackName} (level ${level}), ${nestedStackDrifts.size} total nested stacks`,
  });

  return {
    rootStackDrifts: currentStackDrifts,
    nestedStackDrifts,
    nestedStackPhysicalIds,
  };
}

/**
 * Format a reason string, handling undefined/null values
 */
function formatReason(reason: string | undefined): string {
  return reason || 'No reason provided';
}
