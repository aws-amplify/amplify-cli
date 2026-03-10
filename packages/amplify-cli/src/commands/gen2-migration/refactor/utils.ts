export default function extractStackNameFromId(stackId: string): string {
  return stackId.startsWith('arn') ? stackId.split('/')[1] : stackId;
}
