require = require('esm')(module);
import * as path from 'path';

export function getAWSExports(projectRoot: string) {
  const metaFilePath = path.join(projectRoot, 'src', 'aws-exports.js');
  return require(metaFilePath);
}
