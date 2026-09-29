import { $TSContext } from '@aws-amplify/amplify-cli-core';
import { printer } from '@aws-amplify/amplify-prompts';
import * as path from 'path';
import { categoryName } from '../constants';

export { categoryName as name } from '../constants';
import { run as runHelp } from './storage/help';

export async function run(context: $TSContext): Promise<void> {
  if (context.parameters.options?.help) {
    runHelp(context);
    return;
  }
  if (/^win/.test(process.platform)) {
    try {
      if (!context.parameters.first) {
        throw new TypeError('Missing command');
      }
      const { run } = await import(path.join('.', categoryName, context.parameters.first));
      run(context);
    } catch (e) {
      printer.error('Command not found');
    }
  }
}
