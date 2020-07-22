import { category } from '../../../constants';

export const categoryName = category;

export const chooseServiceMessageAdd = 'Select which capability you want to add:';
export const chooseServiceMessageUpdate = 'Select which capability you want to update:';
export const functionParametersFileName = 'function-parameters.json';
export const layerParametersFileName = 'layer-parameters.json';
export const parametersFileName = 'parameters.json';
export const provider = 'awscloudformation';

export const enum ServiceName {
  LambdaFunction = 'Lambda',
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
