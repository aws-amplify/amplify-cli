import { Context } from '../domain/context';
import { getAmplifyVersion } from '../extensions/amplify-helpers/get-amplify-version';

export const run = (context: Context) => {
  context.print.info(getAmplifyVersion());
};
