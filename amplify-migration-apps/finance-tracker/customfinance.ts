import * as cdk from 'aws-cdk-lib';
import * as AmplifyHelpers from '@aws-amplify/cli-extensibility-helper';
import { Construct } from 'constructs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';

export class cdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps, amplifyResourceProps?: AmplifyHelpers.AmplifyResourceProps) {
    super(scope, id, props);

    new cdk.CfnParameter(this, 'env', {
      type: 'String',
      description: 'Current Amplify CLI env name',
    });

    const amplifyProjectInfo = AmplifyHelpers.getProjectInfo();

    // 1. SNS Topic for Budget Alerts
    const budgetAlertTopic = new sns.Topic(this, 'BudgetAlertTopic', {
      displayName: 'Fin Tracker Budget Alerts',
    });

    budgetAlertTopic.addSubscription(
      new subscriptions.EmailSubscription('sanjana.ravikumar.az@gmail.com')
    );

    new cdk.CfnOutput(this, 'BudgetAlertTopicArn', {
      value: budgetAlertTopic.topicArn,
      description: 'SNS Topic ARN for budget alerts',
      exportName: `${amplifyProjectInfo.projectName}-BudgetAlertTopicArn-${cdk.Fn.ref('env')}`,
    });

    // 2. SNS Topic for Monthly Reports
    const monthlyReportTopic = new sns.Topic(this, 'MonthlyReportTopic', {
      displayName: 'Finance Tracker Monthly Reports',
    });

    monthlyReportTopic.addSubscription(
      new subscriptions.EmailSubscription('sanjana.ravikumar.az@gmail.com')
    );

    new cdk.CfnOutput(this, 'MonthlyReportTopicArn', {
      value: monthlyReportTopic.topicArn,
      description: 'SNS Topic ARN for monthly reports',
      exportName: `${amplifyProjectInfo.projectName}-MonthlyReportTopicArn-${cdk.Fn.ref('env')}`,
    });

    cdk.Tags.of(this).add('Project', 'FinanceTracker');
    cdk.Tags.of(this).add('Environment', cdk.Fn.ref('env'));
    cdk.Tags.of(this).add('ManagedBy', 'Amplify');
  }
}
