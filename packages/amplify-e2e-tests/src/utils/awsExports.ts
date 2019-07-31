require = require('esm')(module);
import { join } from 'path';
export default function getAWSExports(projectRoot: string) {
  const metaFilePath = join(projectRoot, 'src', 'aws-exports.js');
  return require(metaFilePath);
}