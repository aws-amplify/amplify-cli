import * as path from 'path';
import * as cdk from '@aws-cdk/core';
import { JSONUtilities, pathManager } from 'amplify-cli-core';
import { categoryName } from './constants';

export async function generateCloudFormationFromCDK(resourceName: string) {
  const targetDir = path.join(pathManager.getBackendDirPath(), categoryName, resourceName);
  const { cdkStack } = require(path.resolve(path.join(targetDir, 'build', 'cdk-stack.js')));

  const customStack: cdk.Stack = new cdkStack(undefined, undefined, undefined, { category: categoryName, resourceName });

  // @ts-ignore
  JSONUtilities.writeJson(path.join(targetDir, 'build', `${resourceName}-cloudformation-template.json`), customStack._toCloudFormation());
}
