import { category } from '../../../constants';

export const categoryName = category;
export const chooseServiceMessage = 'Select which capability you want to add:';
export const chooseServiceChoices = [
  'Lambda function (serverless function)',
  'Lambda layer (shared code & resource used across functions)',
];
export const functionParametersFileName = 'function-parameters.json';
export const parametersFileName = 'parameters.json';
export const provider = 'awscloudformation';

export enum ServiceNames {
  LambdaFunction = 'LambdaFunction',
  LambdaLayer = 'LambdaLayer',
}

export enum CronExpressionsMode {
  Minutes = 'Minutes',
  Hourly = 'Hourly',
  Daily = 'Daily',
  Weekly = 'Weekly',
  Monthly = 'Monthly',
  Yearly = 'Yearly',
  Custom = 'Custom AWS cron expression',
}
