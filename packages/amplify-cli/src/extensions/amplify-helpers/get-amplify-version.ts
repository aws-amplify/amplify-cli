import * as path from 'path';

import { JSONUtilities } from 'amplify-cli-core';

export const getAmplifyVersion = (): string => {
  const pkg = JSONUtilities.readJson<any>(path.join(__dirname, '..', '..', '..', 'package.json'));
  return pkg.version;
};
