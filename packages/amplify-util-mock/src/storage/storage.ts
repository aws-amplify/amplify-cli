import { AmplifyStorageSimulator } from 'amplify-storage-simulator';
import * as path from 'path';
import * as fs from 'fs-extra';
import { getAmplifyMeta, getMockDataDirectory } from '../utils';
import { ConfigOverrideManager } from '../utils/config-override';
import { getInvoker } from 'amplify-category-function';
import { loadLambdaConfig } from '../utils/lambda/load-lambda-config';
import { $TSAny, $TSContext, JSONUtilities } from 'amplify-cli-core';

const port = 20005; // port for S3

/**
 * @returns Name of S3 resource or undefined
 */
async function invokeS3GetResourceName(context) {
  const s3ResourceName = await context.amplify.invokePluginMethod(context, 'storage', undefined, 's3GetResourceName', [context]);
  return s3ResourceName;
}

/**
 * Return the cli-inputs.json
 * @param context
 * @param s3ResourceName
 * @returns
 */
async function invokeS3GetUserInputs(context, s3ResourceName) {
  const s3UserInputs = await context.amplify.invokePluginMethod(context, 'storage', undefined, 's3GetUserInput', [context, s3ResourceName]);
  return s3UserInputs;
}

export class StorageTest {
  private storageName: string;
  private storageSimulator: AmplifyStorageSimulator;
  private configOverrideManager: ConfigOverrideManager;
  private storageRegion: string;
  private bucketName: string;

  async start(context) {
    // loading s3 resource config form parameters.json
    const meta = context.amplify.getProjectDetails().amplifyMeta;
    const existingStorage = meta.storage;
    this.storageRegion = meta.providers.awscloudformation.Region;
    if (existingStorage === undefined || Object.keys(existingStorage).length === 0) {
      return context.print.warning('Storage has not yet been added to this project.');
    }
    const backendPath = context.amplify.pathManager.getBackendDirPath();
    const resourceName = Object.keys(existingStorage)[0];
    const parametersFilePath = path.join(backendPath, 'storage', resourceName, 'parameters.json');

    const localEnvFilePath = context.amplify.pathManager.getLocalEnvFilePath();
    const localEnvInfo = context.amplify.readJsonFile(localEnvFilePath);

    const s3ResourceName = await invokeS3GetResourceName(context);
    const s3UserInputs = await invokeS3GetUserInputs(context, s3ResourceName);
    this.bucketName = `${s3UserInputs.bucketName}-${localEnvInfo.envName}`;
    const route = path.join('/', this.bucketName);
    const localDirS3 = this.createLocalStorage(context, `${s3UserInputs.bucketName}`);

    try {
      context.amplify.addCleanUpTask(async context => {
        await this.stop();
      });
      this.configOverrideManager = await ConfigOverrideManager.getInstance(context);
      this.storageName = await this.getStorage(context);
      const storageConfig = { port, route, localDirS3 };
      this.storageSimulator = new AmplifyStorageSimulator(storageConfig);
      await this.storageSimulator.start();
      console.log('Mock Storage endpoint is running at', this.storageSimulator.url);
      await this.generateTestFrontendExports(context);
    } catch (e) {
      console.error('Failed to start Mock Storage server', e);
    }
    return undefined;
  }

  async stop() {
    await this.storageSimulator.stop();
  }

  // to fire s3 triggers attached on the bucket
  async trigger(context: $TSContext) {
    const region = this.storageRegion;
    this.storageSimulator.getServer.on('event', (eventObj: any) => {
      const meta = context.amplify.getProjectDetails().amplifyMeta;
      const existingStorage = meta.storage;
      const backendPath = context.amplify.pathManager.getBackendDirPath();
      const resourceName = Object.keys(existingStorage)[0];
      const CFNFilePath = path.join(backendPath, 'storage', resourceName, 'build', 'cloudformation-template.json');
      const storageParams = JSONUtilities.readJson<$TSAny>(CFNFilePath);
      const lambdaConfig =
        storageParams.Resources.S3Bucket.Properties.NotificationConfiguration &&
        storageParams.Resources.S3Bucket.Properties.NotificationConfiguration.LambdaConfigurations;
      //no trigger case
      if (lambdaConfig === undefined) {
        return;
      }
      // loop over lambda config to check for trigger based on prefix
      let triggerName;
      for (const obj of lambdaConfig) {
        let prefix_arr = obj.Filter;
        if (prefix_arr === undefined) {
          const eventName = String(eventObj.Records[0].event.eventName).split(':')[0];
          if (eventName === 'ObjectRemoved' || eventName === 'ObjectCreated') {
            triggerName = String(obj.Function.Ref)
              .split('function')[1]
              .split('Arn')[0];
            break;
          }
        } else {
          const keyName = String(eventObj.Records[0].s3.object.key);
          prefix_arr = obj.Filter.S3Key.Rules;
          for (const rules of prefix_arr) {
            let node;
            if (typeof rules.Value === 'object') {
              node = String(Object.values(rules.Value)[0][1][0] + String(region) + ':');
            }

            if (typeof rules.Value === 'string') {
              node = String(rules.Value);
            }

            if (rules.Name === 'prefix' && keyName.startsWith(node)) {
              triggerName = String(obj.Function.Ref)
                .split('function')[1]
                .split('Arn')[0];
              break;
            }
            if (rules.Name === 'suffix' && keyName.endsWith(node)) {
              triggerName = String(obj.Function.Ref)
                .split('function')[1]
                .split('Arn')[0];
              break;
            }
          }
        }
        if (triggerName !== undefined) {
          break;
        }
      }

      if (triggerName === undefined) {
        return;
      }
      loadLambdaConfig(context, triggerName)
        .then(config => {
          return getInvoker(context, { handler: config.handler, resourceName: triggerName, envVars: config.environment });
        })
        .then(invoker => {
          return invoker({ event: eventObj });
        })
        .catch(err => {
          context.print.error('Error executing lambda trigger');
          context.print.error(err);
        });
    });
  }

  private async generateTestFrontendExports(context) {
    await this.generateFrontendExports(context, {
      endpoint: this.storageSimulator.url,
      name: this.storageName,
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
  ) {
    const currentMeta = await getAmplifyMeta(context);
    const override = currentMeta.storage || {};
    if (localStorageDetails) {
      const storageMeta = override[localStorageDetails.name] || { output: {} };
      override[localStorageDetails.name] = {
        service: 'S3',
        ...storageMeta,
        output: {
          ...storageMeta.output,
          BucketName: this.bucketName,
          Region: this.storageRegion,
        },
        testMode: localStorageDetails.testMode,
        lastPushTimeStamp: new Date(),
      };
    }
    this.configOverrideManager.addOverride('storage', override);
    await this.configOverrideManager.generateOverriddenFrontendExports(context);
  }

  private async getStorage(context) {
    const currentMeta = await getAmplifyMeta(context);
    const { storage: tmp = {} } = currentMeta;
    let name = null;
    Object.entries(tmp).some((entry: any) => {
      if (entry[1].service === 'S3') {
        name = entry[0];
        return true;
      }
      return undefined;
    });
    return name;
  }

  // create local storage for S3 on disk which is fixes as the test folder
  private createLocalStorage(context, resourceName: string) {
    const directoryPath = path.join(getMockDataDirectory(context), 'S3'); // get bucket through parameters remove afterwards
    fs.ensureDirSync(directoryPath);

    const localPath = path.join(directoryPath, resourceName);
    fs.ensureDirSync(localPath);
    return localPath;
  }

  get getSimulatorObject() {
    return this.storageSimulator;
  }
}
