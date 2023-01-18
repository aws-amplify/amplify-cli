/* eslint-disable jsdoc/require-jsdoc, jsdoc/require-description */
import { $TSContext } from 'amplify-cli-core';
import { printer } from 'amplify-prompts';
import * as path from 'path';
import { categoryName } from '../constants';

export { categoryName as name } from '../constants';
import { run as runHelp } from './storage/help';

export async function run(context: $TSContext) {
  if (context.parameters.options.help) {
    return runHelp(context);
  }
  if (/^win/.test(process.platform)) {
    try {
      const { run } = await import(path.join('.', categoryName, context.parameters.first));

      return run(context);
    } catch (e) {
      printer.error('Command not found');
    }
  }
}
