import { $TSContext } from 'amplify-cli-core';
import * as enable from './enable';

export const name = 'add';

export const run = async (context: $TSContext) => {
  enable.run(context);
};
