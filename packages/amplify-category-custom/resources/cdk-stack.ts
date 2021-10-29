import * as cdk from '@aws-cdk/core';
/*import * as iam from '@aws-cdk/aws-iam';
import * as sns from '@aws-cdk/aws-sns';
import * as subs from '@aws-cdk/aws-sns-subscriptions';
import * as sqs from '@aws-cdk/aws-sqs';
*/

export class cdkStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    /* AWS CDK Code goes here - Learn more: https://docs.aws.amazon.com/cdk/latest/guide/home.html */

    /* Example 1: Set up an SQS queue with an SNS topic 

    const queue = new sqs.Queue(this, 'sqs-queue');

    // 👇 create sns topic
    const topic = new sns.Topic(this, 'sns-topic');

    // 👇 subscribe queue to topic
    topic.addSubscription(new subs.SqsSubscription(queue));

    new cdk.CfnOutput(this, 'snsTopicArn', {
      value: topic.topicArn,
      description: 'The arn of the SNS topic',
    });
    */

    /* Example 2: Adding IAM role to the custom stack 
    const role = new iam.Role(this, 'CustomRole', {
      assumedBy: new iam.AccountRootPrincipal(),
    }); 
    */

    /* Example 3: Adding policy to the IAM role
    role.addToPolicy(
      new iam.PolicyStatement({
        actions: ['*'],
        resources: [topic.topicArn],
      }),
    );
    */
  }
}
