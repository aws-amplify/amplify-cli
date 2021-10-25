import * as cdk from '@aws-cdk/core';
import * as iam from '@aws-cdk/aws-iam';

export class cdkStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here
    const role = new iam.Role(this, 'CustomStack', {
      assumedBy: new iam.AccountRootPrincipal(),
    });

    role.addToPolicy(
      new iam.PolicyStatement({
        actions: ['*'],
        resources: [],
      }),
    );
  }
}
