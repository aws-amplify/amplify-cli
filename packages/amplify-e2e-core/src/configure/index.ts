import { nspawn as spawn, getCLIPath, singleSelect } from '..';
import { EOL } from 'os';

type AmplifyConfiguration = {
  accessKeyId: string;
  secretAccessKey: string;
  profileName?: string;
  region?: string;
};

type CommandFlags = 'usage-data-on' | 'usage-data-off' | 'share-project-config-on' | 'share-project-config-off';

const commandFlagsReturnMessage: { [key in CommandFlags]: string } = {
  'usage-data-on': 'Usage Data has been turned on',
  'usage-data-off': 'Usage Data has been turned off',
  'share-project-config-on': 'Share Project Config has been turned on',
  'share-project-config-off': 'Share Project Config has been turned off',
};

const defaultSettings = {
  profileName: 'amplify-integ-test-user',
  region: 'us-east-2',
  userName: EOL,
};

export const amplifyRegions = [
  'us-east-1',
  'us-east-2',
  'us-west-1',
  'us-west-2',
  'eu-north-1',
  'eu-south-1',
  'eu-west-1',
  'eu-west-2',
  'eu-west-3',
  'eu-central-1',
  'ap-east-1',
  'ap-northeast-1',
  'ap-northeast-2',
  'ap-northeast-3',
  'ap-southeast-1',
  'ap-southeast-2',
  'ap-south-1',
  'ca-central-1',
  'me-south-1',
  'sa-east-1',
];

const configurationOptions = ['Project information', 'AWS Profile setting', 'Advanced: Container-based deployments'];
const profileOptions = ['No', 'Update AWS Profile', 'Remove AWS Profile'];
const authenticationOptions = ['AWS profile', 'AWS access keys'];

const MANDATORY_PARAMS = ['accessKeyId', 'secretAccessKey', 'region'];

export function amplifyConfigure(cwd: string | null, settings: AmplifyConfiguration | CommandFlags | null): Promise<void> {
  if (typeof settings === 'string') {
    return spawn(getCLIPath(), ['configure', `--${settings}`], { cwd, stripColors: true })
      .wait(commandFlagsReturnMessage[settings])
      .runAsync();
  } else {
    const allSettings = { ...defaultSettings, ...settings };
    const missingParam = MANDATORY_PARAMS.filter((p) => !Object.keys(allSettings).includes(p));
    if (missingParam.length) {
      throw new Error(`mandatory params ${missingParam.join(' ')} are missing`);
    }

    return new Promise((resolve, reject) => {
      const chain = spawn(getCLIPath(), ['configure'], { cwd, stripColors: true })
        .wait('Sign in to your AWS administrator account:')
        .wait('Press Enter to continue')
        .sendCarriageReturn()
        .wait('Specify the AWS Region');

      singleSelect(chain, allSettings.region, amplifyRegions);

      chain
        .wait('Press Enter to continue')
        .sendCarriageReturn()
        .wait('accessKeyId')
        .pauseRecording()
        .sendLine(allSettings.accessKeyId)
        .wait('secretAccessKey')
        .sendLine(allSettings.secretAccessKey)
        .resumeRecording()
        .wait('Profile Name:')
        .sendLine(allSettings.profileName)
        .wait('Successfully set up the new user.')
        .run((err: Error) => {
          if (!err) {
            resolve();
          } else {
            reject(err);
          }
        });
    });
  }
}

export const amplifyConfigureBeforeOrAtV10_7 = (settings: AmplifyConfiguration): Promise<void> => {
  const s = { ...defaultSettings, ...settings };
  const missingParam = MANDATORY_PARAMS.filter((p) => !Object.keys(s).includes(p));
  if (missingParam.length) {
    throw new Error(`mandatory params ${missingParam.join(' ')} are missing`);
  }

  return new Promise((resolve, reject) => {
    const chain = spawn(getCLIPath(), ['configure'], { stripColors: true })
      .wait('Sign in to your AWS administrator account:')
      .wait('Press Enter to continue')
      .sendCarriageReturn()
      .wait('Specify the AWS Region');

    singleSelect(chain, s.region, amplifyRegions);

    chain
      .wait('user name:')
      .sendCarriageReturn()
      .wait('Press Enter to continue')
      .sendCarriageReturn()
      .wait('accessKeyId')
      .pauseRecording()
      .sendLine(s.accessKeyId)
      .wait('secretAccessKey')
      .sendLine(s.secretAccessKey)
      .resumeRecording()
      .wait('Profile Name:')
      .sendLine(s.profileName)
      .wait('Successfully set up the new user.')
      .run((err: Error) => {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
};

// TODO amplify admin enabled case
export function amplifyConfigureProject(settings: {
  cwd: string;
  enableContainers?: boolean;
  configLevel?: string;
  profileOption?: string;
  authenticationOption?: string;
  region?: string;
}): Promise<void> {
  const {
    cwd,
    enableContainers = false,
    profileOption = profileOptions[0],
    authenticationOption,
    configLevel = 'project',
    region = defaultSettings.region,
  } = settings;

  return new Promise((resolve, reject) => {
    const chain = spawn(getCLIPath(), ['configure', 'project'], { cwd, stripColors: true }).wait('Which setting do you want to configure?');

    if (enableContainers) {
      singleSelect(chain, configurationOptions[2], configurationOptions);
      chain.wait('Do you want to enable container-based deployments?').sendConfirmYes();
    } else {
      singleSelect(chain, configurationOptions[1], configurationOptions);

      if (configLevel === 'project') {
        chain.wait('Do you want to update or remove the project level AWS profile?');
        singleSelect(chain, profileOption, profileOptions);
      } else {
        chain.wait('Do you want to set the project level configuration').sendConfirmYes();
      }

      if (profileOption === profileOptions[1] || configLevel === 'general') {
        chain.wait('Select the authentication method you want to use:');
        singleSelect(chain, authenticationOption, authenticationOptions);

        if (authenticationOption === authenticationOptions[0]) {
          chain.wait('Please choose the profile you want to use').sendCarriageReturn(); // Default profile
        } else if (authenticationOption === authenticationOptions[1]) {
          chain.wait('accessKeyId:').sendLine(process.env.AWS_ACCESS_KEY_ID);
          chain.wait('secretAccessKey:').sendLine(process.env.AWS_SECRET_ACCESS_KEY);
          chain.wait('region:');
          singleSelect(chain, region, amplifyRegions);
        }
      }
    }

    chain.wait('Successfully made configuration changes to your project.').run((err: Error) => {
      if (!err) {
        resolve();
      } else {
        reject(err);
      }
    });
  });
}
