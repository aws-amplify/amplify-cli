import * as path from 'path';
import { $TSAny, JSONUtilities } from '@aws-amplify/amplify-cli-core';

export function getMockConfig(context) {
  const { projectPath } = context.amplify.getEnvInfo();
  const mockConfigPath = path.join(projectPath, 'amplify', 'mock.json');
  return JSONUtilities.readJson<$TSAny>(mockConfigPath, { throwIfNotExist: false }) ?? {};
}
