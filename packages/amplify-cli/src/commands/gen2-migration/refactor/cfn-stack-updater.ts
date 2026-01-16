import { CloudFormationClient, DescribeStacksCommand, Parameter, UpdateStackCommand } from '@aws-sdk/client-cloudformation';
import { CFNTemplate } from './types';
import assert from 'node:assert';

// Increased from 60 to support multiple sequential stack updates (e.g., multiple storage stacks)
const POLL_ATTEMPTS = 200;
const POLL_INTERVAL_MS = 1500;
const NO_UPDATES_MESSAGE = 'No updates are to be performed';
const CFN_IAM_CAPABILIY = 'CAPABILITY_NAMED_IAM';
const COMPLETION_STATE = '_COMPLETE';
export const UPDATE_COMPLETE = 'UPDATE_COMPLETE';
/**
 * Updates a stack with given template. If no updates are present, it no-ops.
 * @param cfnClient
 * @param stackName
 * @param parameters
 * @param templateBody
 * @param attempts number of attempts to poll CFN stack for update completion state. The interval between the polls is 1.5 seconds.
 */
export async function tryUpdateStack(
  cfnClient: CloudFormationClient,
  stackName: string,
  parameters: Parameter[],
  templateBody: CFNTemplate,
  attempts = POLL_ATTEMPTS,
): Promise<string> {
  try {
    await cfnClient.send(
      new UpdateStackCommand({
        TemplateBody: JSON.stringify(templateBody),
        Parameters: parameters,
        StackName: stackName,
        Capabilities: [CFN_IAM_CAPABILIY],
        Tags: [],
      }),
    );
    return pollStackForCompletionState(cfnClient, stackName, attempts);
  } catch (e) {
    if (!(e && typeof e === 'object' && 'message' in e && typeof e.message === 'string' && e.message.includes(NO_UPDATES_MESSAGE))) {
      throw e;
    }
    return UPDATE_COMPLETE;
  }
}

/**
 * Polls a stack for completion state
 * @param cfnClient
 * @param stackName
 * @param attempts number of attempts to poll for completion.
 * @returns the stack status
 */
export async function pollStackForCompletionState(
  cfnClient: CloudFormationClient,
  stackName: string,
  attempts: number = POLL_ATTEMPTS,
): Promise<string> {
  do {
    const { Stacks } = await cfnClient.send(
      new DescribeStacksCommand({
        StackName: stackName,
      }),
    );
    const stack = Stacks?.[0];
    assert(stack);
    const stackStatus = stack.StackStatus;
    assert(stackStatus);
    if (stackStatus?.endsWith(COMPLETION_STATE)) {
      return stackStatus;
    }
    await new Promise((res) => setTimeout(() => res(''), POLL_INTERVAL_MS));
    attempts--;
  } while (attempts > 0);
  throw new Error(`Stack ${stackName} did not reach a completion state within the given time period.`);
}
