import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
const branchName = process.env.AWS_BRANCH ?? "sandbox";
const projectName = "financetracker";
export class Customfinance extends Construct {
    public readonly budgetAlertTopic: sns.Topic;
    public readonly monthlyReportTopic: sns.Topic;
    constructor(scope: Construct, id: string) {
        super(scope, id);
        // 1. SNS Topic for Budget Alerts
        this.budgetAlertTopic = new sns.Topic(this, 'BudgetAlertTopic', {
            displayName: 'Fin Tracker Budget Alerts',
        });
        this.budgetAlertTopic.addSubscription(new subscriptions.EmailSubscription('example@gmail.com'));
        new cdk.CfnOutput(this, 'BudgetAlertTopicArn', {
            value: this.budgetAlertTopic.topicArn,
            description: 'SNS Topic ARN for budget alerts',
            exportName: `${projectName}-BudgetAlertTopicArn-${branchName}`,
        });
        // 2. SNS Topic for Monthly Reports
        this.monthlyReportTopic = new sns.Topic(this, 'MonthlyReportTopic', {
            displayName: 'Finance Tracker Monthly Reports',
        });
        this.monthlyReportTopic.addSubscription(new subscriptions.EmailSubscription('example@gmail.com'));
        const queue1 = new sqs.Queue(this, 'Queue1');
        new cdk.CfnOutput(this, 'MonthlyReportTopicArn', {
            value: this.monthlyReportTopic.topicArn,
            description: 'SNS Topic ARN for monthly reports',
            exportName: `${projectName}-MonthlyReportTopicArn-${branchName}`,
        });
        // create references to the refactored queue to ensure pre-refactor resolution
        // works in this case.
        new lambda.Function(this, 'QueuesFunction', {
            runtime: lambda.Runtime.NODEJS_18_X,
            handler: 'index.handler',
            code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          return { statusCode: 200, body: JSON.stringify({ message: 'Hello World!' }) };
        };
      `),
            environment: {
                'QUEUE1_NAME': queue1.queueName,
            }
        });
        new cdk.CfnOutput(this, 'Queue1Name', {
            value: queue1.queueName,
        });
        cdk.Tags.of(this).add('Project', 'FinanceTracker');
        cdk.Tags.of(this).add('Environment', branchName);
        cdk.Tags.of(this).add('ManagedBy', 'Amplify');
    }
}
