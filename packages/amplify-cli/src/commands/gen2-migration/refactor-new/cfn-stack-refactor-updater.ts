import {
  CloudFormationClient,
  CreateStackRefactorCommand,
  CreateStackRefactorCommandInput,
  DescribeStackRefactorCommand,
  DescribeStackRefactorCommandOutput,
  ExecuteStackRefactorCommand,
  StackRefactorExecutionStatus,
  StackRefactorStatus,
} from '@aws-sdk/client-cloudformation';
import { AmplifyError } from '@aws-amplify/amplify-cli-core';
import { CFNStackStatus } from './cfn-template';
import { pollStackForCompletionState } from './cfn-stack-updater';
import { extractStackNameFromId } from './utils';
import * as snap from './snap';

const POLL_ATTEMPTS = 300;
const POLL_INTERVAL_MS = 12000;
const COMPLETION_STATE = '_COMPLETE';
const FAILED_STATE = '_FAILED';

export type RefactorResult = { readonly success: true } | RefactorFailure;

export type RefactorFailure = {
  readonly success: false;
  readonly reason: string | undefined;
  readonly stackRefactorId: string;
  readonly status: StackRefactorStatus | StackRefactorExecutionStatus | undefined;
};

/**
 * Creates and executes a CloudFormation stack refactor operation.
 * Polls for completion at each stage (create, execute, stack updates).
 */
export async function tryRefactorStack(
  cfnClient: CloudFormationClient,
  input: CreateStackRefactorCommandInput,
  attempts = POLL_ATTEMPTS,
): Promise<RefactorResult> {
  input.Description = buildRefactorDescription(input);

  snap.preRefactorStack(input);
  const { StackRefactorId } = await cfnClient.send(new CreateStackRefactorCommand(input));
  if (!StackRefactorId) {
    throw new AmplifyError('StackStateError', {
      message: 'CreateStackRefactor returned no StackRefactorId',
    });
  }

  // Poll for create completion
  let response = await pollStackRefactorForCompletionState(
    cfnClient,
    StackRefactorId,
    (r) => {
      if (!r.Status) {
        throw new AmplifyError('StackStateError', {
          message: `Stack refactor '${StackRefactorId}' has no status`,
        });
      }
      return r.Status.endsWith(COMPLETION_STATE) || r.Status.endsWith(FAILED_STATE);
    },
    attempts,
  );

  if (response.Status !== StackRefactorStatus.CREATE_COMPLETE) {
    return { success: false, status: response.Status, reason: response.StatusReason, stackRefactorId: StackRefactorId };
  }

  // Execute the refactor
  await cfnClient.send(new ExecuteStackRefactorCommand({ StackRefactorId }));

  response = await pollStackRefactorForCompletionState(
    cfnClient,
    StackRefactorId,
    (r) => {
      if (!r.ExecutionStatus) {
        throw new AmplifyError('StackStateError', {
          message: `Stack refactor '${StackRefactorId}' has no execution status`,
        });
      }
      return r.ExecutionStatus.endsWith(COMPLETION_STATE) || r.ExecutionStatus.endsWith(FAILED_STATE);
    },
    attempts,
  );

  if (response.ExecutionStatus !== StackRefactorExecutionStatus.EXECUTE_COMPLETE) {
    return { success: false, status: response.ExecutionStatus, reason: response.ExecutionStatusReason, stackRefactorId: StackRefactorId };
  }

  // Verify both stacks reached completion
  const sourceStackName = input.StackDefinitions?.[0]?.StackName;
  const destStackName = input.StackDefinitions?.[1]?.StackName;
  if (!sourceStackName || !destStackName) {
    throw new AmplifyError('InvalidStackError', {
      message: 'Stack refactor input is missing source or destination stack name',
    });
  }

  const sourceStatus = await pollStackForCompletionState(cfnClient, sourceStackName);
  if (sourceStatus !== CFNStackStatus.UPDATE_COMPLETE) {
    throw new AmplifyError('StackStateError', {
      message: `Source stack '${sourceStackName}' ended with status '${sourceStatus}' instead of UPDATE_COMPLETE`,
    });
  }

  const destStatus = await pollStackForCompletionState(cfnClient, destStackName);
  if (destStatus !== CFNStackStatus.UPDATE_COMPLETE && destStatus !== CFNStackStatus.CREATE_COMPLETE) {
    throw new AmplifyError('StackStateError', {
      message: `Destination stack '${destStackName}' ended with status '${destStatus}' instead of UPDATE_COMPLETE or CREATE_COMPLETE`,
    });
  }

  return { success: true };
}

function buildRefactorDescription(input: CreateStackRefactorCommandInput): string {
  const logicalIds = input.ResourceMappings?.map((m) => m.Source?.LogicalResourceId).join(', ');
  const source = resolveStackName(input.StackDefinitions?.[0]?.StackName);
  const dest = resolveStackName(input.StackDefinitions?.[1]?.StackName);
  return `Move [${logicalIds}] from ${source} to ${dest}`;
}

function resolveStackName(stackNameOrArn: string | undefined): string {
  if (!stackNameOrArn) return 'unknown';
  return stackNameOrArn.startsWith('arn:') ? extractStackNameFromId(stackNameOrArn) : stackNameOrArn;
}

/**
 * Polls a stack refactor operation until the exit condition is met.
 */
async function pollStackRefactorForCompletionState(
  cfnClient: CloudFormationClient,
  stackRefactorId: string,
  exitCondition: (response: DescribeStackRefactorCommandOutput) => boolean,
  attempts: number,
): Promise<DescribeStackRefactorCommandOutput> {
  do {
    const response = await cfnClient.send(new DescribeStackRefactorCommand({ StackRefactorId: stackRefactorId }));
    if (exitCondition(response)) {
      return response;
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    attempts--;
  } while (attempts > 0);
  throw new AmplifyError('StackStateError', {
    message: `Stack refactor '${stackRefactorId}' did not reach a completion state within the polling period`,
  });
}
