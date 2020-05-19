export const chooseServiceMessage = 'Select which capability you want to add:';
export const functionParametersFileName = 'function-parameters.json';
export const parametersFileName = 'parameters.json';
export const provider = 'awscloudformation';

export const enum ServiceName {
  LambdaFunction = 'LambdaFunction',
  LambdaLayer = 'LambdaLayer',
}

export const enum CronExpressionsMode {
  Minutes = 'Minutes',
  Hourly = 'Hourly',
  Daily = 'Daily',
  Weekly = 'Weekly',
  Monthly = 'Monthly',
  Yearly = 'Yearly',
  Custom = 'Custom AWS cron expression',
}
