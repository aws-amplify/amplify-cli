import { APITest } from './api';
import { addMockDataToGitIgnore, addMockAPIResourcesToGitIgnore } from '../utils';
import { getMockConfig } from '../utils/mock-config-file';

export async function start(context) {
  const testApi = new APITest();
  try {
    addMockDataToGitIgnore(context);
    addMockAPIResourcesToGitIgnore(context);
    const mockConfig = await getMockConfig(context);
    await testApi.start(context, mockConfig.graphqlPort, mockConfig.graphqlPort);
  } catch (e) {
    console.log(e);
    // Sending term signal so we clean up after ourselves
    process.kill(process.pid, 'SIGTERM');
  }
}
