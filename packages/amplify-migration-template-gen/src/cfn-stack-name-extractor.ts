export default function extractStackNameFromId(stackId: string): string {
  return stackId.split('/')[1];
}
