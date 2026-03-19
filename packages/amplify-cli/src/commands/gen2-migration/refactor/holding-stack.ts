import {
  CloudFormationClient,
  CloudFormationServiceException,
  DeleteStackCommand,
  DescribeStacksCommand,
  Stack,
} from '@aws-sdk/client-cloudformation';
import { pollStackForCompletionState } from './cfn-stack-updater';

export const HOLDING_STACK_SUFFIX = '-holding';
const MAX_STACK_NAME_LENGTH = 128;

/**
 * Derives the holding stack name from a Gen2 category stack ID.
 * Preserves the CloudFormation hash suffix (part after the last dash) for uniqueness.
 * If the resulting name would exceed 128 characters, the prefix is truncated.
 */
export function getHoldingStackName(gen2CategoryStackId: string): string {
  const lastDashIndex = gen2CategoryStackId.lastIndexOf('-');
  const prefix = gen2CategoryStackId.substring(0, lastDashIndex);
  const hashSuffix = gen2CategoryStackId.substring(lastDashIndex);
  const tail = `${hashSuffix}${HOLDING_STACK_SUFFIX}`;
  const maxPrefixLength = MAX_STACK_NAME_LENGTH - tail.length;
  return `${prefix.substring(0, maxPrefixLength)}${tail}`;
}

/**
 * Finds a holding stack by name. Returns the stack if it exists, null otherwise.
 */
export async function findHoldingStack(cfnClient: CloudFormationClient, stackName: string): Promise<Stack | null> {
  try {
    const response = await cfnClient.send(new DescribeStacksCommand({ StackName: stackName }));
    const stack = response.Stacks?.[0];
    if (stack && stack.StackStatus !== 'DELETE_COMPLETE') {
      return stack;
    }
    return null;
  } catch (error: unknown) {
    if (error instanceof CloudFormationServiceException && error.name === 'ValidationError' && error.message?.includes('does not exist')) {
      return null;
    }
    throw error;
  }
}

/**
 * Deletes a holding stack and waits for deletion to complete.
 */
export async function deleteHoldingStack(cfnClient: CloudFormationClient, stackName: string): Promise<void> {
  try {
    await cfnClient.send(new DeleteStackCommand({ StackName: stackName }));
    await pollStackForCompletionState(cfnClient, stackName, 60);
  } catch (error: unknown) {
    if (error instanceof CloudFormationServiceException && error.name === 'ValidationError' && error.message?.includes('does not exist')) {
      return;
    }
    throw error;
  }
}
