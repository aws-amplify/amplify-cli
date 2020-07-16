import fs from 'fs-extra';
import path from 'path';
import { nspawn as spawn, getCLIPath, createNewProjectDir, KEY_DOWN_ARROW, readJsonFile } from '../../src';
import { spawnSync } from 'child_process';

export function addDEVHosting(cwd: string) {
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

export function addPRODHosting(cwd: string) {
  return new Promise((resolve, reject) => {
    // Cloudfront distrubution takes a long time. Bumping up the timeout
    spawn(getCLIPath(), ['add', 'hosting'], { cwd, stripColors: true, noOutputTimeout: 30 * 60 * 1000 })
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

export function amplifyPushWithUpdate(cwd: string) {
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

export function amplifyPublishWithoutUpdate(cwd: string) {
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

export function removeHosting(cwd: string) {
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
