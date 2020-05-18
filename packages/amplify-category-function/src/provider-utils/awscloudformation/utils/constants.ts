import { category } from '../../../constants';

export const categoryName = category;
export const chooseServiceChoices = {
  LambdaFunction: 'Lambda function (serverless function)',
  LambdaLayer: 'Lambda layer (shared code & resource used across functions)',
};
export const chooseServiceMessage = [
  'Select which capability you want to add:',
  'Select which capability you want to update:',
];
export const functionParametersFileName = 'function-parameters.json';
export const layerParametersFileName = 'layer-parameters.json'
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
