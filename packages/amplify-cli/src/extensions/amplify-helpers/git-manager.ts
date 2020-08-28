import * as fs from 'fs-extra';
import * as os from 'os';
import { LocalLogDirectory } from 'amplify-cli-logger';

const amplifyMark = '#amplify';
const amplifyMarkRegExp = new RegExp(`^${amplifyMark}`);

export function insertAmplifyIgnore(gitIgnoreFilePath: string): void {
  if (fs.existsSync(gitIgnoreFilePath)) {
    removeAmplifyIgnore(gitIgnoreFilePath);

    fs.appendFileSync(gitIgnoreFilePath, getGitIgnoreAppendString());
  } else {
    fs.writeFileSync(gitIgnoreFilePath, getGitIgnoreAppendString().trim());
  }
}

function removeAmplifyIgnore(gitIgnoreFilePath: string): void {
  if (fs.existsSync(gitIgnoreFilePath)) {
    let newGitIgnoreString = '';
    const gitIgnoreStringArray = fs.readFileSync(gitIgnoreFilePath, 'utf8').split(os.EOL);

    let isInRemoval = false;

    for (let i = 0; i < gitIgnoreStringArray.length; i++) {
      const newLine = gitIgnoreStringArray[i].trim();

      if (isInRemoval) {
        if (newLine.length === 0) {
          isInRemoval = false;
        }
      } else if (amplifyMarkRegExp.test(newLine)) {
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
    `${LocalLogDirectory}/`,
    'amplify/mock-data',
    'amplify/backend/amplify-meta.json',
    'amplify/backend/awscloudformation',
    'build/',
    'dist/',
    'node_modules/',
    'aws-exports.js',
    'awsconfiguration.json',
    'amplifyconfiguration.json',
    'amplify-build-config.json',
    'amplify-gradle-config.json',
    'amplifytools.xcconfig',
  ];

  const toAppend = `${os.EOL + os.EOL + amplifyMark + os.EOL}${ignoreList.join(os.EOL)}`;

  return toAppend;
}
