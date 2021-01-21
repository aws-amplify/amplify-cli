import * as path from 'path';
import { pathManager } from 'amplify-cli-core';
import { homedir, tmpdir } from 'os';

export const oldVersionPath = path.join(pathManager.getHomeDotAmplifyDirPath(), 'bin', 'amplify-old.exe');
export const pendingDeletePath = path.join(homedir(), '.amplify-pending-delete.exe');
export const tmpRegPath = path.join(tmpdir(), 'tmp.reg');
