import * as fs from 'fs-extra';
import * as path from 'path';
import { nspawn as spawn, getCLIPath, createNewProjectDir, KEY_DOWN_ARROW, readJsonFile, getNpxPath } from '..';
import _ from 'lodash';
import { getBackendAmplifyMeta } from '../utils';
import * as execa from 'execa';

export function enableContainerHosting(cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['configure', 'project'], { cwd, stripColors: true })
      .wait('Which setting do you want to configure?')
      .sendKeyDown(2)
      .sendCarriageReturn()
      .wait('Do you want to enable container-based deployments?')
      .sendConfirmYes()
      .run((err: Error) => {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
}

export function addDevContainerHosting(cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['add', 'hosting'], { cwd, stripColors: true })
      .wait('Select the plugin module to execute')
      .sendKeyDown(2)
      .sendCarriageReturn()
      .wait('Provide your web app endpoint (e.g. app.example.com or www.example.com):')
      .sendLine('www.test-amplify-app.com')
      .wait('Do you want to automatically protect your web app using Amazon Cognito Hosted UI')
      .sendConfirmNo()
      .run((err: Error) => {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
}

export function addPRODHosting(cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['add', 'hosting'], { cwd, stripColors: true })
      .wait('Select the plugin module to execute')
      .send(KEY_DOWN_ARROW)
      .sendCarriageReturn()
      .wait('hosting bucket name')
      .sendCarriageReturn()
      .run((err: Error) => {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
}

export const amplifyPushWithUpdate = async (cwd: string): Promise<void> => {
  return spawn(getCLIPath(), ['push'], { cwd, stripColors: true })
    .wait('Are you sure you want to continue?')
    .sendCarriageReturn()
    .runAsync();
};

export const amplifyPublishWithUpdate = async (cwd: string): Promise<void> => {
  return spawn(getCLIPath(), ['publish'], { cwd, stripColors: true })
    .wait('Are you sure you want to continue?')
    .sendCarriageReturn()
    .runAsync();
};

export function amplifyPublishWithoutUpdate(cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['publish'], { cwd, stripColors: true })
      .wait('Do you still want to publish the frontend')
      .sendConfirmYes()
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
 * executes publish command with yes flag
 */
export const amplifyPublishWithoutUpdateWithYesFlag = async (cwd: string): Promise<void> => {
  const chain = spawn(getCLIPath(), ['publish', '-y'], { cwd, stripColors: true });
  return chain.runAsync();
};

export function removeHosting(cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['remove', 'hosting'], { cwd, stripColors: true })
      .wait('Choose the resource you would want to remove')
      .sendCarriageReturn()
      .wait('Are you sure you want to delete the resource?')
      .sendCarriageReturn()
      .wait('Successfully removed resource')
      .run((err: Error) => {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
}

export async function createReactTestProject(): Promise<string> {
  const projRoot = await createNewProjectDir('hosting');
  const projectName = path.basename(projRoot);
  const projectDir = path.dirname(projRoot);

  execa.sync(getNpxPath(), ['create-react-app', projectName, '--scripts-version', '5.0.1', '--use-npm'], { cwd: projectDir });

  return projRoot;
}

export function resetBuildCommand(projectDir: string, newBuildCommand: string): string {
  const projectConfigFilePath = path.join(projectDir, 'amplify', '.config', 'project-config.json');
  const projectConfig = readJsonFile(projectConfigFilePath);
  const currentBuildCommand = projectConfig.javascript.config.BuildCommand;
  projectConfig.javascript.config.BuildCommand = newBuildCommand;
  fs.writeFileSync(projectConfigFilePath, JSON.stringify(projectConfig, null, 4));
  return currentBuildCommand;
}

export function extractHostingBucketInfo(projectDir: string) {
  const meta = getBackendAmplifyMeta(projectDir);
  return _.get(meta, ['hosting', 'S3AndCloudFront', 'output', 'HostingBucketName']);
}
