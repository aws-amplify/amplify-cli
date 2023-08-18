import { $TSContext } from '@aws-amplify/amplify-cli-core';
import { printer } from '@aws-amplify/amplify-prompts';
import { analyzeProject } from '../config-steps/c0-analyzeProject';
import { configFrontendHandler } from '../config-steps/c1-configFrontend';
import { configProviders } from '../config-steps/c2-configProviders';
import { configureNewUser } from '../configure-new-user';
import { onFailure } from '../config-steps/c9-onFailure';
import { onSuccess } from '../config-steps/c9-onSuccess';
import { normalizeInputParams } from '../input-params-manager';
import { write } from '../app-config';
import { DebugConfig } from '../app-config/debug-config';
import { Context } from '../domain/context';

export const run = async (context: Context) => {
  if (context.parameters.options['usage-data-off']) {
    write(context, { usageDataConfig: { isUsageTrackingEnabled: false } });
    printer.success('Usage Data has been turned off');
    return;
  }

  if (context.parameters.options['usage-data-on']) {
    write(context, { usageDataConfig: { isUsageTrackingEnabled: true } });
    printer.success('Usage Data has been turned on');
    return;
  }

  if (context.parameters.options['share-project-config-off']) {
    DebugConfig.Instance.setAndWriteShareProject(false);
    printer.success('Share Project Config has been turned off');
    return;
  }

  if (context.parameters.options['share-project-config-on']) {
    DebugConfig.Instance.setAndWriteShareProject(true);
    printer.success('Share Project Config has been turned on');
    return;
  }

  const { appId, envName }: { appId: string; envName: string } = context?.parameters?.options || {};
  if (appId && envName) {
    try {
      const providerPlugin = await import(context.amplify.getProviderPlugins(context).awscloudformation);
      await providerPlugin.adminLoginFlow(context, appId, envName);
    } catch (e) {
      printer.error(`Failed to authenticate: ${e.message || 'Unknown error occurred.'}`);
      await context.usageData.emitError(e);
      process.exit(1);
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
      void context.usageData.emitError(e);
      onFailure(e);
      process.exitCode = 1;
    }
  }
};

function constructExeInfo(context: Context) {
  context.exeInfo = context.amplify.getProjectDetails();
  context.exeInfo.inputParams = normalizeInputParams(context as unknown as $TSContext);
}
