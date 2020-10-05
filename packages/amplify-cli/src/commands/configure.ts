import open from 'open';
import { pathManager } from 'amplify-cli-core';
import { analyzeProject } from '../config-steps/c0-analyzeProject';
import { configFrontendHandler } from '../config-steps/c1-configFrontend';
import { configProviders } from '../config-steps/c2-configProviders';
import { configureNewUser } from '../configure-new-user';
import { onFailure } from '../config-steps/c9-onFailure';
import { onSuccess } from '../config-steps/c9-onSuccess';
import { normalizeInputParams } from '../input-params-manager';
import { write } from '../app-config';
import { Context } from '../domain/context';
import { AdminLoginServer } from '../app-config/adminLoginServer';

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

  if (context.parameters.options.appId) {
    const { appId } = context.parameters.options;
    //const URL = `https://amplifyadmin.amplifyapp.com/verify/${appId}`;
    const URL = 'http://localhost:3000';
    context.print.info(`Opening link: ${URL}`);
    await open(URL, { wait: false }).catch(e => {
      console.error('Failed to open web browser');
    });
    // spawn express server locally to get credentials from redirect
    // const spinner = ora('Starting localhost:4242\n').start();
    const adminLoginServer = new AdminLoginServer(appId, () => {
      // spinner.stop();
      adminLoginServer.shutdown();
    });
    // await on results, stop spinner
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
      context.usageData.emitError(e);
      onFailure(e);
      process.exitCode = 1;
    }
  }
};

function constructExeInfo(context: Context) {
  context.exeInfo = context.amplify.getProjectDetails();
  context.exeInfo.inputParams = normalizeInputParams(context);
}
