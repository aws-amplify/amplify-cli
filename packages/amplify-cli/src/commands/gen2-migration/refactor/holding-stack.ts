import {
  CloudFormationClient,
  DeleteStackCommand,
  DescribeStacksCommand,
  Stack,
  StackNotFoundException,
} from '@aws-sdk/client-cloudformation';
import { pollStackForCompletionState } from './cfn-stack-updater';

export const HOLDING_STACK_SUFFIX = '-holding';
const MAX_STACK_NAME_LENGTH = 128;

/**
 * Derives the holding stack name from a Gen2 category stack ID.
 * If the resulting name would exceed 128 characters, the stack ID is truncated.
 */
export function getHoldingStackName(gen2CategoryStackId: string): string {
  const maxPrefixLength = MAX_STACK_NAME_LENGTH - HOLDING_STACK_SUFFIX.length;
  const truncatedStackId = gen2CategoryStackId.substring(0, maxPrefixLength);
  return `${truncatedStackId}${HOLDING_STACK_SUFFIX}`;
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
    if (error instanceof StackNotFoundException) {
      return null;
    }
    throw error;
  }
}

/**
 * Deletes a holding stack.
 */
export async function deleteHoldingStack(cfnClient: CloudFormationClient, stackName: string): Promise<void> {
  try {
    await cfnClient.send(new DeleteStackCommand({ StackName: stackName }));
    await pollStackForCompletionState(cfnClient, stackName, 60);
  } catch (error: unknown) {
    if (error instanceof StackNotFoundException) {
      return;
    }
    throw error;
  }
}
