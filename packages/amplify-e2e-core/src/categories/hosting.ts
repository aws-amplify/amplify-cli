import * as fs from 'fs-extra';
import * as path from 'path';
import { nspawn as spawn, getCLIPath, createNewProjectDir, KEY_DOWN_ARROW, readJsonFile } from '..';
import _ from 'lodash';
import { spawnSync } from 'child_process';
import { getBackendAmplifyMeta } from '../utils';

export function addDEVHosting(cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['add', 'hosting'], { cwd, stripColors: true })
      .wait('Select the plugin module to execute')
      .send(KEY_DOWN_ARROW)
      .sendCarriageReturn()
      .wait('Select the environment setup:')
      .sendCarriageReturn()
      .wait('hosting bucket name')
      .sendCarriageReturn()
      .wait('index doc for the website')
      .sendCarriageReturn()
      .wait('error doc for the website')
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

export function addPRODHosting(cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['add', 'hosting'], { cwd, stripColors: true })
      .wait('Select the plugin module to execute')
      .send(KEY_DOWN_ARROW)
      .sendCarriageReturn()
      .wait('Select the environment setup:')
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

export function removePRODCloudFront(cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['update', 'hosting'], { cwd, stripColors: true })
      .wait('Specify the section to configure')
      .send(KEY_DOWN_ARROW)
      .sendCarriageReturn()
      .wait('Remove CloudFront from hosting')
      .send('y')
      .sendCarriageReturn()
      .wait('index doc for the website')
      .sendCarriageReturn()
      .wait('error doc for the website')
      .sendCarriageReturn()
      .wait('Specify the section to configure')
      .send(KEY_DOWN_ARROW)
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

export function amplifyPushWithUpdate(cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['push'], { cwd, stripColors: true })
      .wait('Are you sure you want to continue?')
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

export function amplifyPublishWithoutUpdate(cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['publish'], { cwd, stripColors: true }).run((err: Error) => {
      if (!err) {
        resolve();
      } else {
        reject(err);
      }
    });
  });
}

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

  spawnSync('npx', ['create-react-app', projectName], { cwd: projectDir });

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
