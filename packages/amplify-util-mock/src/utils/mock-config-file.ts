import * as path from 'path';
import * as fs from 'fs';

export function getMockConfig(context) {
  const { projectPath } = context.amplify.getEnvInfo();
  const mockConfigPath = path.join(projectPath, 'amplify', 'mock.json');
  if (fs.existsSync(mockConfigPath)) {
    return JSON.parse(fs.readFileSync(mockConfigPath).toString('UTF-8'));
  }
  return {};
}
