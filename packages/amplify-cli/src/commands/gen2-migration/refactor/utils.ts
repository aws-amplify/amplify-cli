/**
 * Extracts the stack name from a CloudFormation stack ID (ARN) or returns the input if it's already a name.
 */
export function extractStackNameFromId(stackId: string): string {
  return stackId.startsWith('arn:') ? stackId.split('/')[1] : stackId;
}

/**
 * Extracts a short, human-readable label from an Amplify stack name for use in operation descriptions.
 * Amplify stack names follow: amplify-<appId>-<env>-<category/resource>-<hash>
 * This returns just the category/resource part (e.g., "storageawards", "auth-UserPool").
 * Falls back to the full name if the pattern doesn't match.
 */
export function shortenStackName(stackName: string): string {
  const parts = stackName.split('-');
  if (parts.length >= 5 && parts[0] === 'amplify') {
    return parts.slice(3, -1).join('-');
  }
  return stackName;
}
