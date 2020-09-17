import * as os from 'os';
import * as path from 'path';
import { Context } from '../domain/context';
import * as fs from 'fs-extra';

export function getPath(context: Context) {
  const executable = path.basename(context.input.argv[1]);
  const dir = path.join(os.homedir(), '.amplify');
  const configPath = path.join(dir, `${executable}-configuration.json`);
  fs.ensureDirSync(dir);
  return configPath;
}
