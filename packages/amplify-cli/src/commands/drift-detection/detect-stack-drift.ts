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

  // Get the drift results, including resources with UNKNOWN status
  const driftResults = await cfn.send(
    new DescribeStackResourceDriftsCommand({
      StackName: stackName,
    }),
  );

  // Log warning for any resources with UNKNOWN status
  const unknownResources = driftResults.StackResourceDrifts?.filter((drift) => drift.StackResourceDriftStatus === 'NOT_CHECKED');

  if (unknownResources && unknownResources.length > 0 && print?.debug) {
    print.debug(
      'Some resources have UNKNOWN drift status. This may be due to insufficient permissions or throttling:\n' +
        unknownResources.map((r) => `  - ${r.LogicalResourceId}: ${formatReason(r.StackResourceDriftStatus)}`).join('\n'),
    );
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
 * @returns combined drift results for root and all nested stacks
 */
export async function detectStackDriftRecursive(
  cfn: CloudFormationClient,
  stackName: string,
  print?: { info: (msg: string) => void; debug: (msg: string) => void; warning: (msg: string) => void },
): Promise<CombinedDriftResults> {
  logger.logInfo({ message: `detectStackDriftRecursive: ${stackName}` });

  // Detect drift on the root stack
  const rootStackDrifts = await detectStackDrift(cfn, stackName, print);

  // DetectStackDrift doesn't include nested stacks in drift results,
  // so we need to query the full resource list separately
  const stackResources = await cfn.send(
    new DescribeStackResourcesCommand({
      StackName: stackName,
    }),
  );

  // Find all nested stacks from the full resource list
  const nestedStacks = stackResources.StackResources?.filter((resource) => resource.ResourceType === 'AWS::CloudFormation::Stack') || [];

  if (nestedStacks.length > 0) {
    if (print?.info) {
      print.info(`Found ${nestedStacks.length} nested stack(s) to check for drift`);
    }
  }

  // Recursively check drift for each nested stack
  const nestedStackDrifts = new Map<string, DescribeStackResourceDriftsCommandOutput>();
  const nestedStackPhysicalIds = new Map<string, string>();

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
        print.info(`Checking drift for nested stack: ${nestedStack.LogicalResourceId}`);
      }

      // Extract stack name from PhysicalResourceId
      // PhysicalResourceId can be either a stack name or an ARN
      // ARN format: arn:aws:cloudformation:region:account:stack/stack-name/guid
      let nestedStackName = nestedStack.PhysicalResourceId;
      if (nestedStackName.startsWith('arn:')) {
        const arnParts = nestedStackName.split('/');
        if (arnParts.length >= 2) {
          nestedStackName = arnParts[1]; // Extract stack name from ARN
        }
      }

      // Store the mapping of logical ID to physical stack name
      nestedStackPhysicalIds.set(nestedStack.LogicalResourceId, nestedStackName);

      // Use the extracted stack name to detect drift
      const nestedDrift = await detectStackDrift(cfn, nestedStackName, print);
      nestedStackDrifts.set(nestedStack.LogicalResourceId, nestedDrift);

      logger.logInfo({
        message: `detectStackDriftRecursive.nestedStack: ${nestedStack.LogicalResourceId}, ${nestedDrift.StackResourceDrifts?.length} resources`,
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
    message: `detectStackDriftRecursive.complete: ${stackName}, ${nestedStackDrifts.size} nested stacks`,
  });

  return {
    rootStackDrifts,
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
