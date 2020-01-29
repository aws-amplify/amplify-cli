require = require('esm')(module);
import * as path from 'path';

export function getAWSExportsPath(projRoot: string): string {
  return path.join(projRoot, 'src', 'aws-exports.js');
}

export function getAWSExports(projectRoot: string) {
  const metaFilePath = getAWSExportsPath(projectRoot);
  return require(metaFilePath);
}
