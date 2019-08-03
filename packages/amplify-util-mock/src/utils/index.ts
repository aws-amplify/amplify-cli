export { addCleanupTask } from './cleanup-task';
export { getMockDataDirectory } from './mock-data-directory';
export { addMockDataToGitIgnore } from './git-ignore';
export async function getAmplifyMeta(context: any) {
  const amplifyMetaFilePath = context.amplify.pathManager.getAmplifyMetaFilePath();
  return context.amplify.readJsonFile(amplifyMetaFilePath);
}
