require = require('esm')(module);
import { join } from 'path';
export function getAWSExports(projectRoot: string) {
  const metaFilePath = join(projectRoot, 'src', 'aws-exports.js');
  return require(metaFilePath);
}
