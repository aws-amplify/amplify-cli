import * as path from 'path';
import * as fs from 'fs-extra';
import * as moment from 'moment';

export function createNewProjectDir(mark?: string): string {
  const timeStamp = moment().format('YYYYMMDDHHmmss');
  const testProjectDirName = mark ? `console-integ-${mark}-${timeStamp}` : `console-integ-${timeStamp}`;
  const projectDirpath = path.normalize(path.join(__dirname, '../../..', testProjectDirName));
  fs.mkdirSync(projectDirpath);
  return projectDirpath;
}

export function deleteProjectDir(projectDirpath: string) {
  return fs.removeSync(projectDirpath);
}

export function getCLIPath() {
  if (isCI()) {
    return 'amplify';
  }
  return path.normalize(path.join(__dirname, '../../amplify-cli/bin/amplify'));
}

export function getProfileName() {
  return 'amplify-integ-test-user';
}

export function isCI(): Boolean {
  return process.env.CI ? true : false;
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
