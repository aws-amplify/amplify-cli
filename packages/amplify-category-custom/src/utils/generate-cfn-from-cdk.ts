import * as cdk from 'aws-cdk-lib';
import { JSONUtilities, pathManager } from '@aws-amplify/amplify-cli-core';
import * as path from 'path';
import { categoryName } from './constants';
import { StackProps } from 'aws-cdk-lib';

export type AmplifyResourceProps = {
  category: string;
  resourceName: string;
};

export function getCDKProps(): StackProps {
  if (process.env.CDK_DEFAULT_ACCOUNT || process.env.CDK_DEFAULT_REGION) {
    return {
      env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION,
      },
    };
  }
  return {};
}

export async function generateCloudFormationFromCDK(resourceName: string) {
  const targetDir = pathManager.getResourceDirectoryPath(undefined, categoryName, resourceName);
  const { cdkStack } = await import(path.resolve(path.join(targetDir, 'build', 'cdk-stack.js')));

  const amplifyResourceProps: AmplifyResourceProps = { category: categoryName, resourceName };

  const customStack: cdk.Stack = new cdkStack(undefined, undefined, getCDKProps(), amplifyResourceProps);

  // @ts-ignore
  JSONUtilities.writeJson(path.join(targetDir, 'build', `${resourceName}-cloudformation-template.json`), customStack._toCloudFormation());
}
