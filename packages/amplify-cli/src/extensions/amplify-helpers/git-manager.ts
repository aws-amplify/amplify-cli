import * as fs from 'fs-extra';
import * as os from 'os';
import { LocalLogDirectory } from 'amplify-cli-logger';

const amplifyMark = '#amplify-do-not-edit-begin';
const amplifyEndMark = '#amplify-do-not-edit-end';
const deprecatedAmplifyMark = '#amplify';
const amplifyMarkRegExp = new RegExp(`^${amplifyMark}`);
const amplifyEndMarkRegExp = new RegExp(`^${amplifyEndMark}`);
const deprecatedAmplifyMarkRegExp = new RegExp(`^${deprecatedAmplifyMark}`);

export function insertAmplifyIgnore(gitIgnoreFilePath: string): void {
  if (fs.existsSync(gitIgnoreFilePath)) {
    rebuildAmplifyIgnore(gitIgnoreFilePath);

    fs.appendFileSync(gitIgnoreFilePath, getGitIgnoreAppendString());
  } else {
    fs.writeFileSync(gitIgnoreFilePath, getGitIgnoreAppendString().trim());
  }
}

function rebuildAmplifyIgnore(gitIgnoreFilePath: string): void {
  if (fs.existsSync(gitIgnoreFilePath)) {
    let newGitIgnoreString = '';
    const gitIgnoreStringArray = fs.readFileSync(gitIgnoreFilePath, 'utf8').split(os.EOL);

    let isInRemoval = false;

    for (let i = 0; i < gitIgnoreStringArray.length; i++) {
      const newLine = gitIgnoreStringArray[i].trim();

      if (isInRemoval) {
        if (amplifyEndMarkRegExp.test(newLine) || newLine.length === 0) {
          isInRemoval = false;
        }
      } else if (amplifyMarkRegExp.test(newLine) || deprecatedAmplifyMarkRegExp.test(newLine)) {
        isInRemoval = true;
      } else {
        newGitIgnoreString += newLine + os.EOL;
      }
    }

    newGitIgnoreString = newGitIgnoreString.trim();

    fs.writeFileSync(gitIgnoreFilePath, newGitIgnoreString);
  }
}

function getGitIgnoreAppendString() {
  const ignoreList = [
    'amplify/\\#current-cloud-backend',
    'amplify/.config/local-*',
    `amplify/${LocalLogDirectory}`,
    'amplify/mock-data',
    'amplify/backend/amplify-meta.json',
    'amplify/backend/awscloudformation',
    'amplify/backend/.temp',
    'build/',
    'dist/',
    'node_modules/',
    'aws-exports.js',
    'awsconfiguration.json',
    'amplifyconfiguration.json',
    'amplifyconfiguration.dart',
    'amplify-build-config.json',
    'amplify-gradle-config.json',
    'amplifytools.xcconfig',
    '.secret-*',
    '**.sample',
  ];

  const toAppend = `${os.EOL + os.EOL + amplifyMark + os.EOL}${ignoreList.join(os.EOL)}${os.EOL + amplifyEndMark + os.EOL}`;

  return toAppend;
}
