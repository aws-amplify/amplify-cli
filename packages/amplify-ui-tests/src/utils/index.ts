import { join } from 'path';
import { mkdirSync, readFileSync } from 'fs';
import * as rimraf from 'rimraf';
import { config } from 'dotenv';
import { writeFile } from 'fs';
export { default as getProjectMeta } from './projectMeta'

// run dotenv config to update env variable
config();

export function getCLIPath() {
  return join(__dirname, '..', '..', '..', 'amplify-cli', 'bin', 'amplify');
}

export function getAwsCLIPath() {
  return 'aws';
}

export function createNewProjectDir(root?: string): string {
  if (!root) {
    root = join(
      __dirname,
      '../../../../..',
      `amplify-integ-${Math.round(Math.random() * 100)}-test-${Math.round(Math.random() * 1000)}`
    );
  }
  mkdirSync(root);
  return root;
}

export function deleteProjectDir(root: string) {
  return rimraf.sync(root);
}

export function isCI(): Boolean {
  return process.env.CI ? true : false;
}

export function getEnvVars(): { } {
  return { ...process.env };
}

export function getSampleRootPath() : string {
  //return join(__dirname, '../../../../..', 'amplify-js-samples-staging')
  return join(__dirname, '../../../../..', 'photo-albums')
}

export function getUITestConfig() {
  return JSON.parse(readFileSync(join(__dirname, '../../test.json'), 'utf8'));
}

export function createTestMetaFile(destRoot: string, settings: any) {
  let testEnv: any = {
    baseUrl: 'http://localhost:' + settings.port,
    video: false,
    env: {
      COGNITO_SIGN_IN_USERNAME: settings.username,
      COGNITO_SIGN_IN_PASSWORD: settings.password,
      COGNITO_SIGN_IN_EMAIL: settings.email,
      COGNITO_SIGN_IN_PHONE_NUMBER: settings.phone
    },
    testFiles: settings.testFiles
  };
  if (isCI()) {
    testEnv = {...testEnv,
      videosFolder: "/root/videos/" + settings.name,
      screenshotsFolder: "/root/screenshots/" + settings.name,
      video: true
    };
  }
  const outputPath = join(destRoot, 'cypress.json');
  writeFile(outputPath, JSON.stringify(testEnv), function(err: Error) {
    if (err) {
      console.log(err);
    }
  });
}

