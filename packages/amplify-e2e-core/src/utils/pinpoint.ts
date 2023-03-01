import { Pinpoint } from 'aws-sdk';
import _ from 'lodash';
import { EOL } from 'os';
import { getCLIPath, nspawn as spawn, singleSelect, amplifyRegions, addCircleCITags, KEY_DOWN_ARROW } from '..';

const settings = {
  name: EOL,
  envName: 'test',
  editor: EOL,
  appType: EOL,
  framework: EOL,
  srcDir: EOL,
  distDir: EOL,
  buildCmd: EOL,
  startCmd: EOL,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  sessionToken: process.env.AWS_SESSION_TOKEN,
  region: process.env.CLI_REGION,
  pinpointResourceName: 'testpinpoint',
};

const defaultPinpointRegion = 'us-east-1';
const serviceRegionMap = {
  'us-east-1': 'us-east-1',
  'us-east-2': 'us-east-1',
  'sa-east-1': 'us-east-1',
  'ca-central-1': 'ca-central-1',
  'us-west-1': 'us-west-2',
  'us-west-2': 'us-west-2',
  'cn-north-1': 'us-west-2',
  'cn-northwest-1': 'us-west-2',
  'ap-south-1': 'ap-south-1',
  'ap-northeast-3': 'us-west-2',
  'ap-northeast-2': 'ap-northeast-2',
  'ap-southeast-1': 'ap-southeast-1',
  'ap-southeast-2': 'ap-southeast-2',
  'ap-northeast-1': 'ap-northeast-1',
  'eu-central-1': 'eu-central-1',
  'eu-north-1': 'eu-central-1',
  'eu-south-1': 'eu-central-1',
  'eu-west-1': 'eu-west-1',
  'eu-west-2': 'eu-west-2',
  'eu-west-3': 'eu-west-1',
  'me-south-1': 'ap-south-1',
};

/**
 * checks to see if the pinpoint app exists
 */
export async function pinpointAppExist(pinpointProjectId: string): Promise<boolean> {
  let result = false;

  const pinpointClient = new Pinpoint({
    accessKeyId: settings.accessKeyId,
    secretAccessKey: settings.secretAccessKey,
    sessionToken: settings.sessionToken,
    region: _.get(serviceRegionMap, settings.region, defaultPinpointRegion),
  });

  try {
    const response = await pinpointClient
      .getApp({
        ApplicationId: pinpointProjectId,
      })
      .promise();
    if (response.ApplicationResponse.Id === pinpointProjectId) {
      result = true;
    }
  } catch (err) {
    if (err.code === 'NotFoundException') {
      result = false;
    } else {
      throw err;
    }
  }

  return result;
}

/**
 * initializes a project to test pinpoint
 */
export function initProjectForPinpoint(cwd: string): Promise<void> {
  addCircleCITags(cwd);

  return new Promise((resolve, reject) => {
    const chain = spawn(getCLIPath(), ['init'], {
      cwd,
      stripColors: true,
      env: {
        CLI_DEV_INTERNAL_DISABLE_AMPLIFY_APP_CREATION: '1',
      },
    })
      .wait('Enter a name for the project')
      .sendLine(settings.name)
      .wait('Initialize the project with the above configuration?')
      .sendConfirmNo()
      .wait('Enter a name for the environment')
      .sendLine(settings.envName)
      .wait('Choose your default editor:')
      .sendLine(settings.editor)
      .wait("Choose the type of app that you're building")
      .sendLine(settings.appType)
      .wait('What javascript framework are you using')
      .sendLine(settings.framework)
      .wait('Source Directory Path:')
      .sendLine(settings.srcDir)
      .wait('Distribution Directory Path:')
      .sendLine(settings.distDir)
      .wait('Build Command:')
      .sendLine(settings.buildCmd)
      .wait('Start Command:')
      .sendCarriageReturn()
      .wait('Using default provider  awscloudformation')
      .wait('Select the authentication method you want to use:')
      .send(KEY_DOWN_ARROW)
      .sendCarriageReturn()
      .pauseRecording()
      .wait('accessKeyId')
      .sendLine(settings.accessKeyId)
      .wait('secretAccessKey')
      .sendLine(settings.secretAccessKey)
      .resumeRecording()
      .wait('region');

    singleSelect(chain, settings.region, amplifyRegions);
    chain
      .wait('Help improve Amplify CLI by sharing non sensitive configurations on failures')
      .sendYes()
      .wait(/Try "amplify add api" to create a backend API and then "amplify (push|publish)" to deploy everything/)
      .run((err: Error) => {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
}

/**
 * adds a pinpoint resource, you may specific a name for the resource
 */
export function addPinpointAnalytics(cwd: string, testingWithLatestCodebase = true, pinPointResourceName?: string): Promise<string> {
  const resourceName = pinPointResourceName || settings.pinpointResourceName;
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(testingWithLatestCodebase), ['add', 'analytics'], { cwd, stripColors: true })
      .wait('Select an Analytics provider')
      .sendCarriageReturn()
      .wait('Provide your pinpoint resource name:')
      .sendLine(resourceName)
      .wait('Apps need authorization to send analytics events. Do you want to allow guests')
      .sendConfirmNo()
      .wait(`Successfully added resource ${resourceName} locally`)
      .sendEof()
      .run((err: Error) => {
        if (!err) {
          resolve(resourceName);
        } else {
          reject(err);
        }
      });
  });
}

/**
 * calls amplify push and verifies that the pinpoint resource succeeds
 */
export const pushToCloud = async (cwd: string): Promise<void> => {
  return spawn(getCLIPath(), ['push'], { cwd, stripColors: true })
    .wait('Are you sure you want to continue')
    .sendCarriageReturn()
    .wait('Pinpoint URL to track events')
    .runAsync();
};

/**
 * delete the project
 */
export const amplifyDelete = async (cwd: string): Promise<void> => {
  return spawn(getCLIPath(), ['delete'], { cwd, stripColors: true })
    .wait('Are you sure you want to continue?')
    .sendYes()
    .wait('Project deleted in the cloud')
    .wait('Project deleted locally.')
    .runAsync();
};
