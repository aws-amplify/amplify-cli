import { getNpxPath, nspawn as spawn, getSocialProviders } from '@aws-amplify/amplify-e2e-core';

export async function toggleSandboxSecrets(cwd: string, identifier: string, option: string) {
  const socialProviders = getSocialProviders(true);
  const secretsToSet = {
    FACEBOOK_CLIENT_ID: socialProviders.FACEBOOK_APP_ID,
    FACEBOOK_CLIENT_SECRET: socialProviders.FACEBOOK_APP_SECRET,
    GOOGLE_CLIENT_ID: socialProviders.GOOGLE_APP_ID,
    GOOGLE_CLIENT_SECRET: socialProviders.GOOGLE_APP_SECRET,
    LOGINWITHAMAZON_CLIENT_ID: socialProviders.AMAZON_APP_ID,
    LOGINWITHAMAZON_CLIENT_SECRET: socialProviders.AMAZON_APP_SECRET,
    SIWA_CLIENT_ID: socialProviders.APPLE_APP_ID,
    SIWA_KEY_ID: socialProviders.APPLE_KEY_ID,
    SIWA_TEAM_ID: socialProviders.APPLE_TEAM_ID,
    SIWA_PRIVATE_KEY: socialProviders.APPLE_PRIVATE_KEY,
  };

  for (const [secretName, secretValue] of Object.entries(secretsToSet)) {
    if (secretValue) {
      const spawnProcess = await spawn(getNpxPath(), ['ampx', 'sandbox', 'secret', option, secretName, '--identifier', identifier], {
        cwd,
        stripColors: true,
        env: { ...process.env, npm_config_user_agent: 'npm' },
      });

      if (option === 'set') {
        await spawnProcess
          .wait('Enter secret value')
          .sendLine(secretValue)
          .wait(/Successfully created */)
          .runAsync();
      } else {
        await spawnProcess.wait(/Successfully removed */).runAsync();
      }
    }
  }
}
