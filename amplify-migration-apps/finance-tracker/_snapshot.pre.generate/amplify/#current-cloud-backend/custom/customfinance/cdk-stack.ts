import * as cdk from 'aws-cdk-lib';
import * as AmplifyHelpers from '@aws-amplify/cli-extensibility-helper';
import { Construct } from 'constructs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';

export class cdkStack extends cdk.Stack {
  public readonly budgetAlertTopic: sns.Topic;
  public readonly monthlyReportTopic: sns.Topic;

  constructor(scope: Construct, id: string, props?: cdk.StackProps, amplifyResourceProps?: AmplifyHelpers.AmplifyResourceProps) {
    super(scope, id, props);

    new cdk.CfnParameter(this, 'env', {
      type: 'String',
      description: 'Current Amplify CLI env name',
    });

    const amplifyProjectInfo = AmplifyHelpers.getProjectInfo();

    // 1. SNS Topic for Budget Alerts
    this.budgetAlertTopic = new sns.Topic(this, 'BudgetAlertTopic', {
      displayName: 'Fin Tracker Budget Alerts',
    });

    this.budgetAlertTopic.addSubscription(
      new subscriptions.EmailSubscription('example@gmail.com')
    );

    new cdk.CfnOutput(this, 'BudgetAlertTopicArn', {
      value: this.budgetAlertTopic.topicArn,
      description: 'SNS Topic ARN for budget alerts',
      exportName: `${amplifyProjectInfo.projectName}-BudgetAlertTopicArn-${cdk.Fn.ref('env')}`,
    });

    // 2. SNS Topic for Monthly Reports
    this.monthlyReportTopic = new sns.Topic(this, 'MonthlyReportTopic', {
      displayName: 'Finance Tracker Monthly Reports',
    });

    this.monthlyReportTopic.addSubscription(
      new subscriptions.EmailSubscription('example@gmail.com')
    );

    new sqs.Queue(this, 'Queue1');
    new sqs.Queue(this, 'Queue2');

    new cdk.CfnOutput(this, 'MonthlyReportTopicArn', {
      value: this.monthlyReportTopic.topicArn,
      description: 'SNS Topic ARN for monthly reports',
      exportName: `${amplifyProjectInfo.projectName}-MonthlyReportTopicArn-${cdk.Fn.ref('env')}`,
    });

    cdk.Tags.of(this).add('Project', 'FinanceTracker');
    cdk.Tags.of(this).add('Environment', cdk.Fn.ref('env'));
    cdk.Tags.of(this).add('ManagedBy', 'Amplify');
  }
}
