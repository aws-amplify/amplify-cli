import ora from 'ora';
import { $TSContext, open } from 'amplify-cli-core';

import { adminVerifyUrl, adminBackendMap, isAmplifyAdminApp } from './utils/admin-helpers';
import { AdminLoginServer } from './utils/admin-login-server';

export async function adminLoginFlow(context: $TSContext, appId: string, envName?: string, region?: string) {
  envName = envName || context.amplify.getEnvInfo().envName;
  if (!region) {
    const { isAdminApp, region: _region } = await isAmplifyAdminApp(appId);
    if (!isAdminApp) {
      throw new Error(`Amplify Studio not enabled for appId: ${appId}`);
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
    // environment variable AMPLIFY_CLI_ADMINUI_BASE_URL is used to set the login url to http://localhost:3000 when developing against beta/gamma endpoints
    const originUrl = process.env.AMPLIFY_CLI_ADMINUI_BASE_URL ?? adminBackendMap[region]?.amplifyAdminUrl;
    const adminLoginServer = new AdminLoginServer(appId, originUrl, context.print);
    await new Promise<void>(resolve =>
      adminLoginServer.startServer(() => {
        adminLoginServer.shutdown();
        spinner.succeed('Successfully received Amplify Studio tokens.');
        resolve();
      }),
    );
  } catch (e) {
    spinner.stop();
    context.print.error(`Failed to authenticate with Amplify Studio: ${e.message || e}`);
  }
}
