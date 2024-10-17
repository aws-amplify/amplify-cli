import { getCLIPath, nspawn as spawn } from '@aws-amplify/amplify-e2e-core';
import { EOL } from 'os';

const defaultSettings = {
  name: EOL,
  // eslint-disable-next-line spellcheck/spell-checker
  envName: 'integtest',
  editor: EOL,
  appType: EOL,
  framework: EOL,
  srcDir: EOL,
  distDir: EOL,
  buildCmd: EOL,
  startCmd: EOL,
  useProfile: EOL,
  profileName: EOL,
  region: process.env.CLI_REGION,
  local: false,
  disableAmplifyAppCreation: true,
  disableCIDetection: false,
  providerConfig: undefined,
  permissionsBoundaryArn: undefined,
};

export function initJSProjectWithProfileV12(cwd: string, settings?: Partial<typeof defaultSettings>): Promise<void> {
  const s = { ...defaultSettings, ...settings };
  let env;

  if (s.disableAmplifyAppCreation === true) {
    env = {
      CLI_DEV_INTERNAL_DISABLE_AMPLIFY_APP_CREATION: '1',
    };
  }

  const cliArgs = ['init'];
  const providerConfigSpecified = !!s.providerConfig && typeof s.providerConfig === 'object';
  if (providerConfigSpecified) {
    cliArgs.push('--providers', JSON.stringify(s.providerConfig));
  }

  if (s.permissionsBoundaryArn) {
    cliArgs.push('--permissions-boundary', s.permissionsBoundaryArn);
  }

  if (s?.name?.length > 20) console.warn('Project names should not be longer than 20 characters. This may cause tests to break.');

  const chain = spawn(getCLIPath(), cliArgs, {
    cwd,
    stripColors: true,
    env,
    disableCIDetection: s.disableCIDetection,
  })
    .wait('Enter a name for the project')
    .sendLine(s.name)
    .wait('Initialize the project with the above configuration?')
    .sendConfirmNo()
    .wait('Enter a name for the environment')
    .sendLine(s.envName)
    .wait('Choose your default editor:')
    .sendLine(s.editor)
    .wait("Choose the type of app that you're building")
    .sendLine(s.appType)
    .wait('What javascript framework are you using')
    .sendLine(s.framework)
    .wait('Source Directory Path:')
    .sendLine(s.srcDir)
    .wait('Distribution Directory Path:')
    .sendLine(s.distDir)
    .wait('Build Command:')
    .sendLine(s.buildCmd)
    .wait('Start Command:')
    .sendCarriageReturn();

  if (!providerConfigSpecified) {
    chain
      .wait('Using default provider  awscloudformation')
      .wait('Select the authentication method you want to use:')
      .sendCarriageReturn()
      .wait('Please choose the profile you want to use')
      .sendLine(s.profileName);
  }
  return chain
    .wait(/Help improve Amplify CLI by sharing non( |-)sensitive( | project )configurations on failures/)
    .sendYes()
    .wait(/Try "amplify add api" to create a backend API and then "amplify (push|publish)" to deploy everything/)
    .runAsync();
}

export function initIosProjectWithProfileV12(cwd: string, settings: Record<string, unknown>): Promise<void> {
  const s = { ...defaultSettings, ...settings };

  let env;

  if (s.disableAmplifyAppCreation === true) {
    env = {
      CLI_DEV_INTERNAL_DISABLE_AMPLIFY_APP_CREATION: '1',
    };
  }

  return spawn(getCLIPath(), ['init'], {
    cwd,
    stripColors: true,
    env,
  })
    .wait('Do you want to continue with Amplify Gen 1?')
    .sendYes()
    .wait('Why would you like to use Amplify Gen 1?')
    .sendCarriageReturn()
    .wait('Enter a name for the project')
    .sendLine(s.name)
    .wait('Initialize the project with the above configuration?')
    .sendConfirmNo()
    .wait('Enter a name for the environment')
    .sendLine(s.envName)
    .wait('Choose your default editor:')
    .sendLine(s.editor)
    .wait("Choose the type of app that you're building")
    .sendKeyDown(3)
    .sendCarriageReturn()
    .wait('Select the authentication method you want to use:')
    .sendCarriageReturn()
    .wait('Please choose the profile you want to use')
    .sendLine(s.profileName)
    .wait(/Help improve Amplify CLI by sharing non( |-)sensitive( | project )configurations on failures/)
    .sendYes()
    .wait(/Try "amplify add api" to create a backend API and then "amplify (push|publish)" to deploy everything/)
    .runAsync();
}

export function initAndroidProjectWithProfileV12(cwd: string, settings: Partial<typeof defaultSettings>): Promise<void> {
  const s = { ...defaultSettings, ...settings };

  let env;

  if (s.disableAmplifyAppCreation) {
    env = {
      CLI_DEV_INTERNAL_DISABLE_AMPLIFY_APP_CREATION: '1',
    };
  }

  return spawn(getCLIPath(), ['init'], {
    cwd,
    stripColors: true,
    env,
  })
    .wait('Enter a name for the project')
    .sendLine(s.name)
    .wait('Initialize the project with the above configuration?')
    .sendConfirmNo()
    .wait('Enter a name for the environment')
    .sendLine(s.envName)
    .wait('Choose your default editor:')
    .sendLine(s.editor)
    .wait("Choose the type of app that you're building")
    .sendKeyDown(1)
    .sendCarriageReturn()
    .wait('Where is your Res directory')
    .sendCarriageReturn()
    .wait('Select the authentication method you want to use:')
    .sendCarriageReturn()
    .wait('Please choose the profile you want to use')
    .sendLine(s.profileName)
    .wait(/Help improve Amplify CLI by sharing non( |-)sensitive( | project )configurations on failures/)
    .sendYes()
    .wait(/Try "amplify add api" to create a backend API and then "amplify (push|publish)" to deploy everything/)
    .runAsync();
}
