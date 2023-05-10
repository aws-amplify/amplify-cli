import { execAsStringPromise } from '@aws-amplify/amplify-cli-core';
import { printer } from '@aws-amplify/amplify-prompts';
import { getAmplifyVersion } from '../extensions/amplify-helpers/get-amplify-version';

export const run = async () => {
  printer.info(await execAsStringPromise('yarn --version'));
  printer.info(getAmplifyVersion());
};
