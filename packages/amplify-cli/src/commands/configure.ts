import { $TSContext, AmplifyFault } from '@aws-amplify/amplify-cli-core';
import { analyzeProject } from '../config-steps/c0-analyzeProject';
import { configFrontendHandler } from '../config-steps/c1-configFrontend';
import { configProviders } from '../config-steps/c2-configProviders';
import { configureNewUser } from '../configure-new-user';
import { onFailure } from '../config-steps/c9-onFailure';
import { onSuccess } from '../config-steps/c9-onSuccess';
import { normalizeInputParams } from '../input-params-manager';
import { write } from '../app-config';
import { Context } from '../domain/context';

export const run = async (context: Context) => {
  if (context.parameters.options['usage-data-off']) {
    write(context, { usageDataConfig: { isUsageTrackingEnabled: false } });
    context.print.success('Usage Data has been turned off');
    return;
  }
  if (context.parameters.options['usage-data-on']) {
    write(context, { usageDataConfig: { isUsageTrackingEnabled: true } });
    context.print.success('Usage Data has been turned on');
    return;
  }

  const { appId, envName }: { appId: string; envName: string } = context?.parameters?.options || {};
  if (appId && envName) {
    try {
      const providerPlugin = await import(context.amplify.getProviderPlugins(context).awscloudformation);
      await providerPlugin.adminLoginFlow(context, appId, envName);
    } catch (e) {
      throw new AmplifyFault(
        'AuthenticationFault',
        {
          message: `Failed to authenticate: ${(e as Error).message || 'Unknown error occurred.'}`,
        },
        e as Error,
      );
    }
    return;
  }

  if (!context.parameters.first) {
    await configureNewUser(context);
  }

  if (context.parameters.first === 'project') {
    constructExeInfo(context);

    try {
      await analyzeProject(context);
      await configFrontendHandler(context);
      await configProviders(context);
      await onSuccess(context);
    } catch (e) {
      onFailure(e);
      throw e;
    }
  }
};

function constructExeInfo(context: Context) {
  context.exeInfo = context.amplify.getProjectDetails();
  context.exeInfo.inputParams = normalizeInputParams(context as unknown as $TSContext);
}
