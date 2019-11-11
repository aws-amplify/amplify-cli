import { Context } from '../domain/context';

export async function promptMetrics(context: Context): Promise<boolean> {
  const { amplify } = context;
  return await amplify.confirmPrompt.run(
    'Crash reporting and metrics collection helps us improve AWS Amplify. Do you consent to collection of usage?'
  );
}
