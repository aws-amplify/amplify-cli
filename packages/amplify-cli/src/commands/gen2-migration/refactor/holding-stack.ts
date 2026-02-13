import { CloudFormationClient, CreateStackCommand, DeleteStackCommand, DescribeStacksCommand, Stack } from '@aws-sdk/client-cloudformation';
import { pollStackForCompletionState } from './cfn-stack-updater';

export const HOLDING_STACK_SUFFIX = '-holding';

/**
 * Derives the holding stack name from a Gen2 category stack ID.
 * Extracts the stack name from the ARN and appends '-holding'.
 */
export function getHoldingStackName(gen2CategoryStackId: string): string {
  // Stack ID can be ARN: arn:aws:cloudformation:region:account:stack/stack-name/guid
  // or just stack name
  const stackName = gen2CategoryStackId.includes('/') ? gen2CategoryStackId.split('/')[1] : gen2CategoryStackId;
  return `${stackName}${HOLDING_STACK_SUFFIX}`;
}

/**
 * Creates an empty holding stack with metadata and a placeholder resource.
 */
export async function createHoldingStack(
  cfnClient: CloudFormationClient,
  stackName: string,
  category: string,
  sourceCategoryStack: string,
): Promise<void> {
  const template = {
    AWSTemplateFormatVersion: '2010-09-09',
    Description: 'Temporary holding stack for Gen2 migration',
    Metadata: {
      AmplifyMigration: {
        SourceCategoryStack: sourceCategoryStack,
        Category: category,
      },
    },
    Resources: {
      MigrationPlaceholder: {
        Type: 'AWS::CloudFormation::WaitConditionHandle',
        Properties: {},
      },
    },
  };

  await cfnClient.send(
    new CreateStackCommand({
      StackName: stackName,
      TemplateBody: JSON.stringify(template),
    }),
  );

  await pollStackForCompletionState(cfnClient, stackName, 60);
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
  await pollStackForCompletionState(cfnClient, stackName, 60);
}
