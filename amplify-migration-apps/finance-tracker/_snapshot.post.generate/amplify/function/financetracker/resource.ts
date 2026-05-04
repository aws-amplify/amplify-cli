import { defineFunction } from '@aws-amplify/backend';

const branchName = process.env.AWS_BRANCH ?? 'sandbox';

export const financetracker = defineFunction({
  entry: './index.js',
  name: `financetracker-${branchName}`,
  timeoutSeconds: 25,
  memoryMB: 128,
  environment: {
    BUDGET_ALERT_TOPIC_ARN:
      'arn:aws:sns:us-east-1:123456789012:amplify-financetracker-x-x-customcustomfinance-x-BudgetAlertTopicF20DF526-R5tDxQli7ASH',
    MONTHLY_REPORT_TOPIC_ARN:
      'arn:aws:sns:us-east-1:123456789012:amplify-financetracker-x-x-customcustomfinance-x-MonthlyReportTopic8D223100-riowtcOhtvf1',
    ENV: `${branchName}`,
    REGION: 'us-east-1',
  },
  runtime: 22,
});
