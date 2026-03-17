/**
 * Extracts the stack name from a CloudFormation stack ID (ARN) or returns the input if it's already a name.
 */
export function extractStackNameFromId(stackId: string): string {
  return stackId.startsWith('arn') ? stackId.split('/')[1] : stackId;
}
