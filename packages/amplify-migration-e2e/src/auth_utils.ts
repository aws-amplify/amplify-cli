import path from 'node:path';
import * as fs from 'fs-extra';
import { removeErrorThrows } from './index';

export function removeErrorThrowsFromAuthResourceFile(projRoot: string) {
  const authResourcePath = path.join(projRoot, 'amplify', 'auth', 'resource.ts');
  const authResourceContent = fs.readFileSync(authResourcePath, 'utf-8');
  const finalContent = removeErrorThrows(authResourceContent);
  fs.writeFileSync(authResourcePath, finalContent, 'utf-8');
}
