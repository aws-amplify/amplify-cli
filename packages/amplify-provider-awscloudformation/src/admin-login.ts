import open from 'open';
import ora from 'ora';
import { $TSContext } from 'amplify-cli-core';

import { amplifyAdminUrl, originUrl } from './utils/admin-helpers';
import { AdminLoginServer } from './utils/admin-login-server';

export async function adminLoginFlow(context: $TSContext, appId: string, envName: string) {
  const URL = amplifyAdminUrl(appId, envName);
  context.print.info(`Opening link: ${URL}`);
  await open(URL, { wait: false }).catch(e => {
    context.print.error('Failed to open web browser.');
    return;
  });
  const spinner = ora('Continue in browser to log in…\n').start();
  try {
    // spawn express server locally to get credentials from redirect
    const adminLoginServer = new AdminLoginServer(appId, originUrl);
    await new Promise(resolve =>
      adminLoginServer.startServer(() => {
        adminLoginServer.shutdown();
        spinner.stop();
        context.print.info('Successfully received Amplify Admin tokens.');
        resolve();
      }),
    );
  } catch (e) {
    spinner.stop();
    context.print.error(e);
  }
}
