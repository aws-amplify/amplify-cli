import { $TSContext } from '@aws-amplify/amplify-cli-core';
import { mockAllCategories } from '../../mockAll';
import { run as runHelp } from './help';

export const name = 'mock';

export const run = async (context: $TSContext) => {
  if (context.parameters.options.help) {
    return runHelp(context);
  }
  await mockAllCategories(context);
  return undefined;
};
