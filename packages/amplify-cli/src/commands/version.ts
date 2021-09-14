import { Context } from '../domain/context';
import { printer } from 'amplify-prompts';
import { getAmplifyVersion } from '../extensions/amplify-helpers/get-amplify-version';

export const run = (context: Context) => {
  printer.info(getAmplifyVersion());
};
