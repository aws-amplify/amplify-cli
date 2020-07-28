import * as path from 'path';
import { Context } from '../domain/context';
import { readJsonFileSync } from '../utils/readJsonFile';

export const run = (context: Context) => {
  const packageJsonFilePath = path.join(__dirname, '..', '..', 'package.json');
  context.print.info(readJsonFileSync(packageJsonFilePath).version);
};
