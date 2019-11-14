import { Config } from './config';
import { promptMetrics } from './prompt-collect-metrics';
import { Context } from '../domain/context';
import * as path from 'path';

export async function configPrompt(context: Context): Promise<boolean> {
  const executabele = path.basename(context.input.argv[1]);
  const configPath = path.join('~', executabele, 'config.json');
  const config = Config.get(configPath);
  if (config.isMetricsPrompted) {
    return config.isMetricsEnabled;
  }

  const isEnabled = await promptMetrics(context);

  config.isMetricsEnabled = isEnabled;
  config.isMetricsPrompted = true;
  config.write(configPath);

  return isEnabled;
}
