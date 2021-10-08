import * as path from 'path';
import { JSONUtilities, $TSAny } from 'amplify-cli-core';

export const getAmplifyVersion = (): string => {
  const pkg = JSONUtilities.readJson<$TSAny>(path.join(__dirname, '..', '..', '..', 'package.json'));
  return pkg.version;
};
