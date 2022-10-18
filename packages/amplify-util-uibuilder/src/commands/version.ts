import { printer } from 'amplify-prompts';
import path from 'path';

/**
 * runs version command
 */
export const run = async (): Promise<void> => {
  printer.info((await import(path.join(__dirname, '..', '..', 'package.json'))).version);
};
