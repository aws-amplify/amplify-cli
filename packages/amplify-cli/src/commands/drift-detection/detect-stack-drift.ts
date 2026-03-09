/**
 * Core drift detection logic for CloudFormation stacks
 */

import {
  CloudFormationClient,
  DetectStackDriftCommand,
  DescribeStackDriftDetectionStatusCommand,
  DescribeStackResourcesCommand,
  paginateDescribeStackResourceDrifts,
  StackResourceDriftStatus,
  type StackResourceDrift,
  type PropertyDifference,
  type DescribeStackDriftDetectionStatusCommandOutput,
} from '@aws-sdk/client-cloudformation';
import { AmplifyError } from '@aws-amplify/amplify-cli-core';
import { extractCategory } from '../gen2-migration/categories';
import type { Printer } from '@aws-amplify/amplify-prompts';

/**
 * Enriched drift tree node — one per stack (root or nested)
 */
export interface StackDriftNode {
  logicalId: string;
  category: string;
  drifts: StackResourceDrift[];
  driftDetectionId: string;
  children: StackDriftNode[];
  skippedChildren?: string[];
}

/**
 * CloudFormation drift results — enriched tree + total drifted count
 */
export interface CloudFormationDriftResults {
  root: StackDriftNode;
  totalDrifted: number;
  skippedStacks: string[];
  incomplete: boolean;
}

/** Check if a resource drift indicates actual drift (MODIFIED or DELETED) */
export const isDrifted = (d: StackResourceDrift): boolean =>
  d.StackResourceDriftStatus === StackResourceDriftStatus.MODIFIED || d.StackResourceDriftStatus === StackResourceDriftStatus.DELETED;

/**
 * Recursively count total drifted resources across the entire tree
 */
function countTotalDrifted(node: StackDriftNode): number {
  let total = node.drifts.filter(isDrifted).length;
  for (const child of node.children) {
    total += countTotalDrifted(child);
  }
  return total;
}

/**
 * Recursively collect all skipped children across the entire tree
 */
function collectSkippedStacks(node: StackDriftNode, result: string[] = []): string[] {
  if (node.skippedChildren) result.push(...node.skippedChildren);
  for (const child of node.children) collectSkippedStacks(child, result);
  return result;
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
  print: Printer,
): Promise<{ drifts: StackResourceDrift[]; driftDetectionId: string }> {
  // Start drift detection
  print.debug(`detectStackDrift: ${stackName}`);
  const driftDetection = await cfn.send(
    new DetectStackDriftCommand({
      StackName: stackName,
    }),
  );

  print.debug(`Detecting drift with ID ${driftDetection.StackDriftDetectionId} for stack ${stackName}...`);

  // Wait for drift detection to complete
  const driftStatus = await waitForDriftDetection(cfn, driftDetection.StackDriftDetectionId!, print);

  // Handle UNKNOWN stack drift status
  if (driftStatus?.StackDriftStatus === 'UNKNOWN') {
    print.debug(
      'Stack drift status is UNKNOWN. This may occur when CloudFormation is unable to detect drift for at least one resource and all other resources are IN_SYNC.\n' +
        `Reason: ${driftStatus.DetectionStatusReason ?? 'No reason provided'}`,
    );
  }

  // Get the drift results (paginated)
  const allDrifts: StackResourceDrift[] = [];
  const paginator = paginateDescribeStackResourceDrifts({ client: cfn, pageSize: 100 }, { StackName: stackName });
  for await (const page of paginator) {
    if (page.StackResourceDrifts) allDrifts.push(...page.StackResourceDrifts);
  }

  // Filter out known Amplify Auth IdP Deny→Allow changes
  const filteredDrifts = allDrifts.map((drift) => {
    if (
      drift.StackResourceDriftStatus === StackResourceDriftStatus.MODIFIED &&
      drift.PropertyDifferences &&
      drift.PropertyDifferences.length > 0
    ) {
      drift.PropertyDifferences = drift.PropertyDifferences.filter((propDiff) => {
        return !isAmplifyAuthRoleDenyToAllowChange(propDiff, print);
      });

      if (drift.PropertyDifferences.length === 0) {
        drift.StackResourceDriftStatus = StackResourceDriftStatus.IN_SYNC;
      }
    }
    return drift;
  });

  return { drifts: filteredDrifts, driftDetectionId: driftDetection.StackDriftDetectionId! };
}

/**
 * Check if a property difference is an Amplify auth role Deny→Allow change (intended drift)
 */
function isAmplifyAuthRoleDenyToAllowChange(propDiff: PropertyDifference, print: Printer): boolean {
  // Check if this is an AssumeRolePolicyDocument change
  if (!propDiff.PropertyPath || !propDiff.PropertyPath.includes('AssumeRolePolicyDocument')) {
    return false;
  }

  // Check if this involves Effect changing from Deny to Allow
  const expectedValue = propDiff.ExpectedValue;
  const actualValue = propDiff.ActualValue;

  if (typeof expectedValue === 'string' && typeof actualValue === 'string') {
    try {
      // Parse JSON values to check for Effect change
      const expectedJson = JSON.parse(expectedValue);
      const actualJson = JSON.parse(actualValue);

      // Check if this is a Statement array change with Effect Deny→Allow
      if (expectedJson.Statement && actualJson.Statement && Array.isArray(expectedJson.Statement) && Array.isArray(actualJson.Statement)) {
        // Look for Deny→Allow change in any statement
        for (let i = 0; i < Math.max(expectedJson.Statement.length, actualJson.Statement.length); i++) {
          const expectedStatement = expectedJson.Statement[i];
          const actualStatement = actualJson.Statement[i];

          if (
            expectedStatement &&
            actualStatement &&
            expectedStatement.Effect === 'Deny' &&
            actualStatement.Effect === 'Allow' &&
            expectedStatement.Principal?.Federated === 'cognito-identity.amazonaws.com' &&
            actualStatement.Principal?.Federated === 'cognito-identity.amazonaws.com'
          ) {
            return true;
          }
        }
      }
    } catch (e: any) {
      // If JSON parsing fails, it's not the specific change we're looking for
      // This is expected for some policy formats, so we log at debug level
      print.debug(`Failed to parse AssumeRolePolicyDocument JSON: ${e.message || 'Unknown error'}`);
      return false;
    }
  }

  return false;
}

/**
 * Wait for a drift detection operation to complete
 * Based on CDK's polling strategy: 5-minute timeout, 2-second polling interval, 10-second user feedback
 */
async function waitForDriftDetection(
  cfn: CloudFormationClient,
  driftDetectionId: string,
  print: Printer,
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
        message: `Drift detection failed: ${response.DetectionStatusReason ?? 'No reason provided'}`,
        resolution: 'Check CloudFormation console for more details or try again.',
      });
    }

    if (Date.now() > deadline) {
      throw new AmplifyError('CloudFormationTemplateError', {
        message: `Drift detection timed out after ${maxWaitForDrift / 1000} seconds.`,
        resolution: 'The stack may be too large or AWS may be experiencing issues. Try again later.',
      });
    }

    if (Date.now() > checkIn) {
      print.debug('Waiting for drift detection to complete...');
      checkIn = Date.now() + timeBetweenOutputs;
    }

    // Wait between API calls to avoid rate limiting (CDK does this too)
    await new Promise((resolve) => setTimeout(resolve, timeBetweenApiCalls));
  }
}

/**
 * Build an enriched StackDriftNode for a single stack, recursing into nested stacks
 */
async function buildDriftNode(
  cfn: CloudFormationClient,
  physicalName: string,
  logicalId: string,
  print: Printer,
  parentCategory?: string,
): Promise<StackDriftNode> {
  // Detect drift on this stack
  const { drifts, driftDetectionId } = await detectStackDrift(cfn, physicalName, print);

  // Compute category
  let category = extractCategory(logicalId);
  if (category === 'Other' && parentCategory) {
    category = parentCategory;
  }

  // Find nested stacks
  const stackResources = await cfn.send(new DescribeStackResourcesCommand({ StackName: physicalName }));
  const nestedStacks = stackResources.StackResources?.filter((resource) => resource.ResourceType === 'AWS::CloudFormation::Stack') || [];

  if (nestedStacks.length > 0) {
    print.debug(`Found ${nestedStacks.length} nested stack(s) in ${logicalId}`);
  }

  const children: StackDriftNode[] = [];
  const skippedChildren: string[] = [];

  for (const nested of nestedStacks) {
    if (!nested.LogicalResourceId || !nested.PhysicalResourceId) continue;
    if (nested.ResourceStatus?.includes('DELETE')) {
      print.debug(`Skipping deleted nested stack: ${nested.LogicalResourceId}`);
      continue;
    }

    try {
      print.debug(`Checking drift for nested stack: ${nested.LogicalResourceId}`);
      const childNode = await buildDriftNode(cfn, nested.PhysicalResourceId, nested.LogicalResourceId, print, category);
      children.push(childNode);

      print.debug(
        `buildDriftNode.nested: ${nested.LogicalResourceId}, ${childNode.drifts.length} direct resources, ${childNode.children.length} sub-stacks`,
      );
    } catch (error: any) {
      print.warn(`Failed to check drift for nested stack ${nested.LogicalResourceId}: ${error.message}`);
      skippedChildren.push(nested.LogicalResourceId);
    }
  }

  return {
    logicalId,
    category,
    drifts,
    driftDetectionId,
    children,
    skippedChildren: skippedChildren.length > 0 ? skippedChildren : undefined,
  };
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
 * @returns enriched drift tree with aggregate summary
 */
export async function detectStackDriftRecursive(
  cfn: CloudFormationClient,
  stackName: string,
  print: Printer,
): Promise<CloudFormationDriftResults> {
  print.debug(`detectStackDriftRecursive: ${stackName}`);

  const root = await buildDriftNode(cfn, stackName, stackName, print);

  // Override root category to 'Core Infrastructure'
  root.category = 'Core Infrastructure';

  const totalDrifted = countTotalDrifted(root);
  const skippedStacks = collectSkippedStacks(root);

  print.debug(`detectStackDriftRecursive.complete: ${stackName}, ${totalDrifted} total drifted resources`);

  return { root, totalDrifted, skippedStacks, incomplete: skippedStacks.length > 0 };
}
