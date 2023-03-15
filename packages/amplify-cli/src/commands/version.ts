import { printer } from '@aws-amplify/amplify-prompts';
import { getAmplifyVersion } from '../extensions/amplify-helpers/get-amplify-version';

export const run = () => {
  printer.info(getAmplifyVersion());
};
