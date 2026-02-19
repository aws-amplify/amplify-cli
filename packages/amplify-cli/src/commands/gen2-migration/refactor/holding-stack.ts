import { CloudFormationClient, DeleteStackCommand, DescribeStacksCommand, Stack } from '@aws-sdk/client-cloudformation';
import { pollStackForCompletionState } from './cfn-stack-updater';

export const HOLDING_STACK_SUFFIX = '-holding';

/**
 * Derives the holding stack name from a Gen2 category stack ID.
 */
export function getHoldingStackName(gen2CategoryStackId: string): string {
  return `${gen2CategoryStackId}${HOLDING_STACK_SUFFIX}`;
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
    if (error instanceof Error && error.message.includes('does not exist')) {
      return null;
    }
    throw error;
  }
}

/**
 * Deletes a holding stack.
 */
export async function deleteHoldingStack(cfnClient: CloudFormationClient, stackName: string): Promise<void> {
  const stack = await findHoldingStack(cfnClient, stackName);
  if (!stack) {
    return;
  }
  await cfnClient.send(new DeleteStackCommand({ StackName: stackName }));
  try {
    await pollStackForCompletionState(cfnClient, stackName, 60);
  } catch (error: unknown) {
    // Stack may already be gone
    if (error instanceof Error && error.message.includes('does not exist')) {
      return;
    }
    throw error;
  }
}
