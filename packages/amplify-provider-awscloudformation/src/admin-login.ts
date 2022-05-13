import { $TSContext, open } from 'amplify-cli-core';
import { prompter, printer } from 'amplify-prompts';
import { adminVerifyUrl, adminBackendMap, isAmplifyAdminApp } from './utils/admin-helpers';  // eslint-disable-line
import { AdminLoginServer } from './utils/admin-login-server';
import { AdminAuthPayload } from './utils/auth-types';

/**
 * Launches browser and promises to receive authentication from browser
 */
export const adminLoginFlow = async (context: $TSContext, appId: string, envName?: string, region?: string): Promise<void> => {
  envName = envName || context.amplify.getEnvInfo().envName;  // eslint-disable-line
  if (!region) {
    const { isAdminApp, region: _region } = await isAmplifyAdminApp(appId);
    if (!isAdminApp) {
      throw new Error(`Amplify Studio not enabled for appId: ${appId}`);
    }
    region = _region; // eslint-disable-line
  }

  const url = adminVerifyUrl(appId, envName, region);
  printer.info(`Opening link: ${url}`);
  await open(url, { wait: false }).catch(e => {
    printer.error(`Failed to open web browser: ${e.message || e}`);
  });
  try {
    // spawn express server locally to get credentials
    // environment variable AMPLIFY_CLI_ADMINUI_BASE_URL is used to set the login url to http://localhost:3000 when developing against beta/gamma endpoints
    const originUrl = process.env.AMPLIFY_CLI_ADMINUI_BASE_URL ?? adminBackendMap[region]?.amplifyAdminUrl;
    const adminLoginServer = new AdminLoginServer(appId, originUrl, printer);
    const getTokenViaServer = new Promise<void>(resolve => {
      adminLoginServer.startServer(() => {
        adminLoginServer.shutdown();
        printer.success('Successfully received Amplify Studio tokens.');
        resolve();
      });
    });

    const getTokenViaPrompt = new Promise<void>((resolve, reject) => {
      prompter.input('Confirm login in the browser or manually paste in your CLI login key:', { hidden: true })
        .then(async (tokenBase64: string) => {
          try {
            const tokenJson = JSON.parse(Buffer.from(tokenBase64, 'base64').toString()) as unknown as AdminAuthPayload;
            await adminLoginServer.storeTokens(tokenJson, appId);
          } catch (e) {
            printer.error('Provided token was invalid.');
            return reject();
          }
          printer.success('Successfully received Amplify Studio tokens.');
          return resolve();
        });
    });
    return Promise.race([getTokenViaPrompt, getTokenViaServer]);
  } catch (e) {
    printer.error(`Failed to authenticate with Amplify Studio: ${e.message || e}`);
  }
};
