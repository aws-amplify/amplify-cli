import { $TSAny } from '../index';
import * as path from 'path';

export const runOverride = async (overrideDir: string, templateObject: $TSAny, projectInfo: $TSAny): Promise<void> => {
  const overrideJSFilePath = path.join(overrideDir, 'build', 'override.js');
  // before importing the override file, we should clear the require cache to avoid
  // importing an outdated version of the override file
  // see: https://github.com/nodejs/modules/issues/307
  // and https://stackoverflow.com/questions/9210542/node-js-require-cache-possible-to-invalidate
  delete require.cache[require.resolve(overrideJSFilePath)];
  const overrideImport = require(overrideJSFilePath);
  if (overrideImport && overrideImport?.override && typeof overrideImport?.override === 'function') {
    await overrideImport.override(templateObject, projectInfo);
  }
};
