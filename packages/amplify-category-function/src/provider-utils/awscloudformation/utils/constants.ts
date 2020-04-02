import { category } from '../../../constants';

export const categoryName = category;
export const serviceName = 'Lambda';
export const functionParametersFileName = 'function-parameters.json';
export const parametersFileName = 'parameters.json';
export const provider = 'awscloudformation';
export enum CronExpressionsMode {
  Minutes = 'Minutes',
  Hourly = 'Hourly',
  Daily = 'Daily',
  Weekly = 'Weekly',
  Monthly = 'Monthly',
  Yearly = 'Yearly',
  Custom = 'Custom AWS cron expression',
}
