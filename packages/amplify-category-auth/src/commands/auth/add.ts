import { $TSContext } from '@aws-amplify/amplify-cli-core';
import * as enable from './enable';

export const name = 'add';

export const run = async (context: $TSContext) => {
  return enable.run(context);
};
