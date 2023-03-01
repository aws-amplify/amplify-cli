import * as cdk from 'aws-cdk-lib';
import { JSONUtilities, pathManager } from 'amplify-cli-core';
import * as path from 'path';
import { categoryName } from './constants';

export type AmplifyResourceProps = {
  category: string;
  resourceName: string;
};

export async function generateCloudFormationFromCDK(resourceName: string) {
  const targetDir = pathManager.getResourceDirectoryPath(undefined, categoryName, resourceName);
  const { cdkStack } = await import(path.resolve(path.join(targetDir, 'build', 'cdk-stack.js')));

  const amplifyResourceProps: AmplifyResourceProps = { category: categoryName, resourceName };

  const customStack: cdk.Stack = new cdkStack(undefined, undefined, undefined, amplifyResourceProps);

  // @ts-ignore
  JSONUtilities.writeJson(path.join(targetDir, 'build', `${resourceName}-cloudformation-template.json`), customStack._toCloudFormation());
}
