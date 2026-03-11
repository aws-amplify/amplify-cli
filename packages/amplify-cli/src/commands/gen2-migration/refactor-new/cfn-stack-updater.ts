import {
  CloudFormationClient,
  DescribeStacksCommand,
  Parameter,
  UpdateStackCommand,
  UpdateStackCommandInput,
} from '@aws-sdk/client-cloudformation';
import { AmplifyError } from '@aws-amplify/amplify-cli-core';
import { CFNStackStatus, CFNTemplate } from './cfn-template';
import * as snap from './snap';

const POLL_ATTEMPTS = 120;
const POLL_INTERVAL_MS = 5 * 1000;
const NO_UPDATES_MESSAGE = 'No updates are to be performed';
const CFN_IAM_CAPABILITY = 'CAPABILITY_NAMED_IAM';
const COMPLETION_STATE = '_COMPLETE';

/**
 * Updates a stack with the given template. No-ops if no updates are needed.
 */
export async function tryUpdateStack(
  cfnClient: CloudFormationClient,
  stackName: string,
  parameters: Parameter[],
  templateBody: CFNTemplate,
  attempts = POLL_ATTEMPTS,
): Promise<string> {
  try {
    const input: UpdateStackCommandInput = {
      TemplateBody: JSON.stringify(templateBody),
      Parameters: parameters,
      StackName: stackName,
      Capabilities: [CFN_IAM_CAPABILITY],
      Tags: [],
    };
    await snap.preUpdateStack(input);
    await cfnClient.send(new UpdateStackCommand(input));
    return pollStackForCompletionState(cfnClient, stackName, attempts);
  } catch (e) {
    if (e && typeof e === 'object' && 'message' in e && typeof e.message === 'string' && e.message.includes(NO_UPDATES_MESSAGE)) {
      return CFNStackStatus.UPDATE_COMPLETE;
    }
    throw e;
  }
}

/**
 * Polls a stack until it reaches a completion state.
 */
export async function pollStackForCompletionState(
  cfnClient: CloudFormationClient,
  stackName: string,
  attempts: number = POLL_ATTEMPTS,
): Promise<string> {
  do {
    const { Stacks } = await cfnClient.send(new DescribeStacksCommand({ StackName: stackName }));
    const stack = Stacks?.[0];
    if (!stack) {
      throw new AmplifyError('StackNotFoundError', {
        message: `Stack '${stackName}' not found while polling for completion`,
      });
    }
    const stackStatus = stack.StackStatus;
    if (!stackStatus) {
      throw new AmplifyError('StackStateError', {
        message: `Stack '${stackName}' has no status`,
      });
    }
    if (stackStatus.endsWith(COMPLETION_STATE)) {
      return stackStatus;
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    attempts--;
  } while (attempts > 0);
  throw new AmplifyError('StackStateError', {
    message: `Stack '${stackName}' did not reach a completion state within the polling period`,
  });
}
