import * as path from 'path';

export const getHooksDirPath = (projRoot: string): string => {
  return path.join(projRoot, 'amplify', 'hooks');
};
