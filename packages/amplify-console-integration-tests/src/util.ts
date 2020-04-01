import * as fs from 'fs-extra';

export { getCLIPath, isCI, npmInstall, createNewProjectDir } from 'amplify-e2e-core';

export function deleteProjectDir(projectDirpath: string) {
  return fs.removeSync(projectDirpath);
}

export function getProfileName() {
  return 'console-integration-test-user';
}

function stripBOM(content: string) {
  // tslint:disable-next-line
  if (content.charCodeAt(0) === 0xfeff) {
    content = content.slice(1);
  }
  return content;
}

export function readJsonFileSync(jsonFilePath: string, encoding: string = 'utf8'): any {
  return JSON.parse(stripBOM(fs.readFileSync(jsonFilePath, encoding)));
}
