// extraneous by design - this file is used in a project created by e2e tests, not by e2e tests directly
/* eslint-disable @typescript-eslint/no-unused-vars */
// eslint-disable-next-line import/no-extraneous-dependencies
import * as AmplifyHelpers from '@aws-amplify/cli-extensibility-helper';
import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { AmplifyDependentResourcesAttributes } from '../../types/amplify-dependent-resources-ref';

/**
 * Base amplify stack class
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class cdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps, amplifyResourceProps?: AmplifyHelpers.AmplifyResourceProps) {
    super(scope, id, props);

    /* Do not remove - Amplify CLI automatically injects the current deployment environment in this input parameter */
    // eslint-disable-next-line no-new
    new cdk.CfnParameter(this, 'env', {
      type: 'String',
      description: 'Current Amplify CLI env name',
    });

    /* AWS CDK Code goes here - Learn more: https://docs.aws.amazon.com/cdk/latest/guide/home.html */

    /* Example 2: Adding IAM role to the custom stack */
    const role = new iam.Role(this, 'CustomRole', {
      roleName: cdk.Fn.join('-', ['custom-cdk-generated-custom-role-test', cdk.Fn.ref('env')]), // For name uniqueness
      assumedBy: new iam.AccountRootPrincipal(),
    });

    const amplifyResources: AmplifyDependentResourcesAttributes = AmplifyHelpers.addResourceDependency(
      this,
      amplifyResourceProps.category,
      amplifyResourceProps.resourceName,
      [{ category: 'storage', resourceName: 'customStorage' }],
    );
  }
}
