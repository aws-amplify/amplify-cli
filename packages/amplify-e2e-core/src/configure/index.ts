import { nspawn as spawn, getCLIPath, singleSelect } from '..';

type AmplifyConfiguration = {
  accessKeyId: string;
  secretAccessKey: string;
  profileName?: string;
  region?: string;
};

const defaultSettings = {
  profileName: 'amplify-integ-test-user',
  region: 'us-east-2',
  userName: '\r',
};

export const amplifyRegions = [
  'us-east-1',
  'us-east-2',
  'us-west-2',
  'eu-west-1',
  'eu-west-2',
  'eu-central-1',
  'ap-northeast-1',
  'ap-northeast-2',
  'ap-southeast-1',
  'ap-southeast-2',
  'ap-south-1',
  'ca-central-1',
];

const configurationOptions = ['Project information', 'AWS Profile setting', 'Advanced: Container-based deployments'];
const profileOptions = ['No', 'Update AWS Profile', 'Remove AWS Profile'];
const authenticationOptions = ['AWS profile', 'AWS access keys'];

const MANDATORY_PARAMS = ['accessKeyId', 'secretAccessKey', 'region'];

export function amplifyConfigure(settings: AmplifyConfiguration): Promise<void> {
  const s = { ...defaultSettings, ...settings };
  const missingParam = MANDATORY_PARAMS.filter(p => !Object.keys(s).includes(p));
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
}

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
