import { $TSAny } from '../index';
import * as path from 'path';

export const runOverride = (overrideDir: string, templateObject: $TSAny, projectInfo: $TSAny): void => {
  const overrideJSFilePath = path.join(overrideDir, 'build', 'override.js');
  delete require.cache[require.resolve(overrideJSFilePath)];
  const overrideImport = require(overrideJSFilePath);
  if (overrideImport && overrideImport?.override && typeof overrideImport?.override === 'function') {
    overrideImport.override(templateObject, projectInfo);
  }
};
