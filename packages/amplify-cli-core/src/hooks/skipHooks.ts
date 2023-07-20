import * as fs from 'fs-extra';
import { skipHooksFilePath } from './hooksConstants';

export function skipHooks(): boolean {
  // DO NOT CHANGE: used to skip hooks on Admin UI
  try {
    return fs.existsSync(skipHooksFilePath);
  } catch (err) {
    return false;
  }
}
