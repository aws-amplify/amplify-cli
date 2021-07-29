import * as fs from 'fs-extra';
import { skipHooksFilePath } from './hooksConstants';

export function skipHooks(): boolean {
  return fs.existsSync(skipHooksFilePath);
}
