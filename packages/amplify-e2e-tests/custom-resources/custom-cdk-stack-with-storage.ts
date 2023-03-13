// extraneous by design - this file is used in a project created by e2e tests, not by e2e tests directly
// eslint-disable-next-line import/no-extraneous-dependencies
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

/**
 * Base amplify stack class
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class cdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    new cdk.CfnParameter(this, 'env', {
      type: 'String',
      description: 'Current Amplify CLI env name',
    });
  }
}
