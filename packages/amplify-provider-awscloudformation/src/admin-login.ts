import ora from 'ora';
import { $TSContext, open } from 'amplify-cli-core';

import { adminVerifyUrl, adminBackendMap, isAmplifyAdminApp } from './utils/admin-helpers';
import { AdminLoginServer } from './utils/admin-login-server';

export async function adminLoginFlow(context: $TSContext, appId: string, envName?: string, region?: string) {
  envName = envName || context.amplify.getEnvInfo().envName;
  if (!region) {
    const { isAdminApp, region: _region } = await isAmplifyAdminApp(appId);
    if (!isAdminApp) {
      throw new Error(`Admin UI not enabled for appId: ${appId}`);
    }
    region = _region;
  }

  const url = adminVerifyUrl(appId, envName, region);
  context.print.info(`Opening link: ${url}`);
  await open(url, { wait: false }).catch(e => {
    context.print.error(`Failed to open web browser: ${e.message || e}`);
    return;
  });
  const spinner = ora('Continue in browser to log in…\n').start();
  try {
    // spawn express server locally to get credentials
    const originUrl = adminBackendMap[region].amplifyAdminUrl;
    const adminLoginServer = new AdminLoginServer(appId, originUrl, context.print);
    await new Promise<void>(resolve =>
      adminLoginServer.startServer(() => {
        adminLoginServer.shutdown();
        spinner.succeed('Successfully received Amplify Admin tokens.');
        resolve();
      }),
    );
  } catch (e) {
    spinner.stop();
    context.print.error(`Failed to authenticate with Amplify Admin: ${e.message || e}`);
  }
}
