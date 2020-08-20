import * as path from 'path';
import { Context } from '../domain/context';
import { JSONUtilities, $TSAny } from 'amplify-cli-core';

export const run = (context: Context) => {
  const pkg = JSONUtilities.readJson<$TSAny>(path.join(__dirname, '..', '..', 'package.json'));

  context.print.info(pkg.version);
};
