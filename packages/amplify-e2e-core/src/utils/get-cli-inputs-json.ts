import * as path from 'path';
import { readJsonFile } from './readJsonFile';

export const getCLIInputsJson = (projectRoot: string, categoryName: string, resourceName: string) => {
  return readJsonFile(path.join(projectRoot, 'amplify', 'backend', categoryName, resourceName, 'cli-inputs.json'));
};
