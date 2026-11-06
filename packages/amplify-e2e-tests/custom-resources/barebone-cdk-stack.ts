import * as cdk from 'aws-cdk-lib';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subs from 'aws-cdk-lib/aws-sns-subscriptions';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

// eslint-disable-next-line import/no-extraneous-dependencies
import * as AmplifyHelpers from '@aws-amplify/cli-extensibility-helper';

export class cdkStack extends cdk.Stack {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(scope: Construct, id: string, props?: cdk.StackProps, amplifyResourceProps?: AmplifyHelpers.AmplifyResourceProps) {
    super(scope, id, props);
    /* Do not remove - Amplify CLI automatically injects the current deployment environment in this input parameter */
    new cdk.CfnParameter(this, 'env', {
      type: 'String',
      description: 'Current Amplify CLI env name',
    });
    /* AWS CDK code goes here - learn more: https://docs.aws.amazon.com/cdk/latest/guide/home.html */

    ec2.Vpc.fromLookup(this, 'VPC', {
      isDefault: true,
    });

    const queue = new sqs.Queue(this, 'sqs-queue');
    // 👇 create sns topic
    const topic = new sns.Topic(this, 'sns-topic');

    // 👇 subscribe queue to topic
    topic.addSubscription(new subs.SqsSubscription(queue));

    // creation of resources inside the VPC
  }
}
