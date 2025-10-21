/**
 * Core drift detection logic for CloudFormation stacks
 * Based on AWS CDK CLI implementation: aws-cdk-cli/packages/@aws-cdk/toolkit-lib/lib/api/drift/drift.ts
 */

import {
  CloudFormationClient,
  DetectStackDriftCommand,
  DescribeStackDriftDetectionStatusCommand,
  DescribeStackResourceDriftsCommand,
  type DescribeStackResourceDriftsCommandOutput,
  type DescribeStackDriftDetectionStatusCommandOutput,
} from '@aws-sdk/client-cloudformation';
import { AmplifyError } from '@aws-amplify/amplify-cli-core';
import { fileLogger } from '../utils/aws-logger';

const logger = fileLogger('drift-detection');

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
  logger('detectStackDrift', [stackName])();
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

  logger('detectStackDrift.complete', [stackName, driftResults.StackResourceDrifts?.length])();
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
  const maxWaitForDrift = 300_000; // 5 minutes max (CDK pattern)
  const timeBetweenOutputs = 10_000; // User feedback every 10 seconds (CDK pattern)
  const timeBetweenApiCalls = 2_000; // API calls every 2 seconds for rate limiting (CDK pattern)

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

    // Wait between API calls to avoid rate limiting (CDK pattern)
    await new Promise((resolve) => setTimeout(resolve, timeBetweenApiCalls));
  }
}

/**
 * Format a reason string, handling undefined/null values
 */
function formatReason(reason: string | undefined): string {
  return reason || 'No reason provided';
}
