import * as cdk from 'aws-cdk-lib';
import * as AmplifyHelpers from '@aws-amplify/cli-extensibility-helper';
import { AmplifyDependentResourcesAttributes } from '../../types/amplify-dependent-resources-ref';
import { Construct } from 'constructs';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as iam from 'aws-cdk-lib/aws-iam';

export class cdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps, amplifyResourceProps?: AmplifyHelpers.AmplifyResourceProps) {
    super(scope, id, props);
    /* Do not remove - Amplify CLI automatically injects the current deployment environment in this input parameter */
    new cdk.CfnParameter(this, 'env', {
      type: 'String',
      description: 'Current Amplify CLI env name',
    });

    const deps: AmplifyDependentResourcesAttributes = AmplifyHelpers.addResourceDependency(this, 
      amplifyResourceProps.category, 
      amplifyResourceProps.resourceName, 
      [
        {category: 'function', resourceName: 'moodboardKinesisTrigger'},
        {category: 'function', resourceName: 'moodboardKinesisReader'},
      ]
    );

    const readerDlq = new sqs.Queue(this, 'ReaderDQL');
    const triggerDlq = new sqs.Queue(this, 'TriggerDLQ');
    readerDlq.addToResourcePolicy(new iam.PolicyStatement({
      actions: ['sqs:*'],
      resources: [readerDlq.queueArn],
      principals: [iam.Role.fromRoleArn(this, "ReaderRoleArn", cdk.Fn.ref(deps.function.moodboardKinesisReader.LambdaExecutionRoleArn))],
    }))

    triggerDlq.addToResourcePolicy(new iam.PolicyStatement({
      actions: ['sqs:*'],
      resources: [triggerDlq.queueArn],
      principals: [iam.Role.fromRoleArn(this, "TriggerRoleArn", cdk.Fn.ref(deps.function.moodboardKinesisTrigger.LambdaExecutionRoleArn))],
    }))

  }
}
