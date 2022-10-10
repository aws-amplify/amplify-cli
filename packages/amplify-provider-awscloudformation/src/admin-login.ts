import ora from 'ora';
import util from 'util';
import readline from 'readline';
import { Writable } from 'stream';
import {
  $TSContext, AmplifyError, AMPLIFY_DOCS_URL, open,
} from 'amplify-cli-core';
import { printer } from 'amplify-prompts';
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
      throw new AmplifyError('AmplifyStudioNotEnabledError', {
        message: `Amplify Studio not enabled for appId: ${appId}`,
        link: `${AMPLIFY_DOCS_URL}/console/adminui/start/#to-get-started-from-an-existing-amplify-app`,
      });
    }
    region = _region; // eslint-disable-line
  }

  const url = adminVerifyUrl(appId, envName, region);
  printer.info(`Opening link: ${url}`);
  await open(url, { wait: false }).catch(e => {
    printer.error(`Failed to open web browser: ${e?.message || e}`);
  });
  const spinner = ora('Confirm login in the browser or manually paste in your CLI login key:\n').start();

  try {
    // spawn express server locally to get credentials
    // environment variable AMPLIFY_CLI_ADMINUI_BASE_URL is used to set the login url to http://localhost:3000 when developing against beta/gamma endpoints
    const originUrl = process.env.AMPLIFY_CLI_ADMINUI_BASE_URL ?? adminBackendMap[region]?.amplifyAdminUrl;
    const adminLoginServer = new AdminLoginServer(appId, originUrl, printer);

    const getTokenViaServer = (): [Promise<void>, () => void] => {
      let finished = false;
      let cancel = (): void => { finished = true; };
      const promise = new Promise<void>((resolve, reject) => {
        adminLoginServer.startServer(() => {
          adminLoginServer.shutdown();
          printer.success('Successfully received Amplify Studio tokens.');
          finished = true;
          resolve();
        });
        cancel = () => {
          if (finished) {
            return;
          }
          finished = true;
          adminLoginServer.shutdown();
          reject();
        };
      });

      return [promise, cancel];
    };

    const getTokenViaPrompt = (): [Promise<void>, () => void] => {
      let finished = false;
      let cancel = (): void => { finished = true; };
      const promise = new Promise<void>((resolve, reject) => {
        // Input is hidden when the user pastes their authorization code into the CLI
        const hiddenStdout: Writable | { muted: boolean} = new Writable({
          write: (__, ___, callback) => {
            callback();
          },
        });

        const rl = readline.createInterface({
          input: process.stdin,
          output: hiddenStdout,
          terminal: true,
        });

        const question = util.promisify(rl.question).bind(rl);
        // No need to emit a question since the ora spinner has already printed a prompt
        question('')
          .then(async (tokenBase64: string) => {
            if (finished) {
              resolve();
              return;
            }
            try {
              const tokenJson = JSON.parse(Buffer.from(tokenBase64, 'base64').toString()) as unknown as AdminAuthPayload;
              await adminLoginServer.storeTokens(tokenJson, appId);
            } catch (e) {
              printer.error('Provided token was invalid.');
              rl.close();
              reject(new Error('Provided token was invalid.'));
              return;
            }
            finished = true;
            rl.close();
            resolve();
          });

        cancel = () => {
          if (finished) {
            return;
          }
          finished = true;
          rl.close();
          reject();
        };
      });
      return [promise, cancel];
    };

    const [promiseGetTokenViaPrompt, cancelGetTokenViaPrompt] = getTokenViaPrompt();
    const [promiseGetTokenViaServer, cancelGetTokenViaServer] = getTokenViaServer();

    // After the first promise completes, we need to manually clean up the unused promise.
    await Promise.race([promiseGetTokenViaServer, promiseGetTokenViaPrompt])
      .finally(() => {
        cancelGetTokenViaServer();
        cancelGetTokenViaPrompt();
      });
    spinner.succeed('Successfully received Amplify Studio tokens.');
  } catch (e) {
    spinner.stop();
    printer.error(`Failed to authenticate with Amplify Studio: ${e?.message || e}`);
  }
};
