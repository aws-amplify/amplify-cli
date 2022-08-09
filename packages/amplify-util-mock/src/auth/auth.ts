/* eslint-disable @typescript-eslint/no-explicit-any */
import * as path from 'path';
import * as fs from 'fs-extra';
import { AmplifyAuthSimulator } from '../../../amplify-auth-simulator';
import { getAmplifyMeta, getMockDataDirectory } from '../utils';
import { ConfigOverrideManager } from '../utils/config-override';

const port = 20009; // port for Auth

const getAuth = async (context:any):Promise<string> => {
  const currentMeta = await getAmplifyMeta(context);
  const { auth: tmp = {} } = currentMeta;
  let name = null;
  Object.entries(tmp).some((entry: any):boolean => {
    if (entry[1].service === 'Cognito') {
      // eslint-disable-next-line prefer-destructuring
      name = entry[0];
      return true;
    }
    return false;
  });
  return name;
};
/**
 * Auth mock test object
 */
export class AuthTest {
  private authName: string;
  private authSimulator: AmplifyAuthSimulator;
  private configOverrideManager: ConfigOverrideManager;
  private authRegion: string;
  private bucketName: string;

  /**
   * Start the auth simulator
   */
  async start(context:any) :Promise<void> {
    // loading s3 resource config form parameters.json
    const meta = context.amplify.getProjectDetails().amplifyMeta;
    const existingCognito = meta.auth;
    this.authRegion = meta.providers.awscloudformation.Region;
    if (existingCognito === undefined || Object.keys(existingCognito).length === 0) {
      context.print.warning('Auth has not yet been added to this project.');
      return;
    }

    const localEnvFilePath = context.amplify.pathManager.getLocalEnvFilePath();
    const localEnvInfo = context.amplify.readJsonFile(localEnvFilePath);

    this.bucketName = `auth-${localEnvInfo.envName}`;
    const route = path.join('/', 'auth');
    const localDir = createLocalStorage(context, `${this.bucketName}`);

    try {
      context.amplify.addCleanUpTask(async () => {
        await this.stop();
      });
      this.configOverrideManager = await ConfigOverrideManager.getInstance(context);
      this.authName = await getAuth(context);
      const authConfig = { port, route, localDir };
      this.authSimulator = new AmplifyAuthSimulator(authConfig);
      await this.authSimulator.start();
      console.log('Mock Auth endpoint is running at', this.authSimulator.url);
      await this.generateTestFrontendExports(context);
    } catch (e) {
      console.error('Failed to start Mock Auth server', e);
    }
  }

  /**
   * Stops the auth simulator
   */
  async stop():Promise<void> {
    await this.authSimulator.stop();
  }

  private async generateTestFrontendExports(context):Promise<void> {
    await this.generateFrontendExports(context, {
      endpoint: this.authSimulator.url,
      name: this.authName,
      testMode: true,
    });
  }

  // generate aws-exports.js
  private async generateFrontendExports(
    context: any,
    localStorageDetails?: {
      endpoint: string;
      name: string;
      testMode: boolean;
    },
  ):Promise<void> {
    const currentMeta = await getAmplifyMeta(context);
    const override = currentMeta.auth || {};
    if (localStorageDetails) {
      const authMeta = override[localStorageDetails.name] || { output: {} };
      override[localStorageDetails.name] = {
        service: 'Cognito',
        ...authMeta,
        output: {
          ...authMeta.output,
          endpoint: localStorageDetails.endpoint,
        },
        testMode: localStorageDetails.testMode,
        lastPushTimeStamp: new Date(),
      };
    }

    this.configOverrideManager.addOverride('auth', override);

    await this.configOverrideManager.generateOverriddenFrontendExports(context);
  }

  // create local storage for S3 on disk which is fixes as the test folder

  /**
   * Returns the auth simulator object
   */
  get getSimulatorObject() :AmplifyAuthSimulator {
    return this.authSimulator;
  }
}
const createLocalStorage = (context, resourceName: string):string => {
  const directoryPath = path.join(getMockDataDirectory(context), 'auth'); // get bucket through parameters remove afterwards
  fs.ensureDirSync(directoryPath);

  const localPath = path.join(directoryPath, resourceName);
  fs.ensureDirSync(localPath);
  return localPath;
};
