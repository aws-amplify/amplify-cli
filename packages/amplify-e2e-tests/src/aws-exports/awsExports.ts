import * as fs from 'fs-extra';
import * as path from 'path';

export function getAWSExportsPath(projRoot: string): string {
  return path.join(projRoot, 'src', 'aws-exports.js');
}

export function getAWSExports(projectRoot: string) {
  const awsExportsPath = getAWSExportsPath(projectRoot);
  // From Jest 25, ESM modules can only be loaded with mjs extension and Jest takes over
  // require, that's why we need to copy the file.
  const awsExportsMJSPath = awsExportsPath.replace('.js', '.mjs');
  fs.copySync(awsExportsPath, awsExportsMJSPath, { overwrite: true });
  const localRequire = require('esm')(module);
  return localRequire(awsExportsMJSPath);
}
