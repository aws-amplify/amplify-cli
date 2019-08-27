const fs = require('fs-extra');
const os = require('os');

const amplifyMark = '#amplify';
const amplifyMarkRegExp = new RegExp(`^${amplifyMark}`);

function insertAmplifyIgnore(gitIgnoreFilePath) {
  if (fs.existsSync(gitIgnoreFilePath)) {
    removeAmplifyIgnore(gitIgnoreFilePath);
    fs.appendFileSync(gitIgnoreFilePath, getGitIgnoreAppendString());
  } else {
    fs.writeFileSync(gitIgnoreFilePath, getGitIgnoreAppendString().trim());
  }
}

function removeAmplifyIgnore(gitIgnoreFilePath) {
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
    'amplify/mock-data',
    'amplify/backend/amplify-meta.json',
    'amplify/backend/awscloudformation',
    'build/',
    'dist/',
    'node_modules/',
    'aws-exports.js',
    'awsconfiguration.json'];

  const toAppend = `${os.EOL + os.EOL + amplifyMark + os.EOL}${ignoreList.join(os.EOL)}`;

  return toAppend;
}

module.exports = {
  insertAmplifyIgnore,
  removeAmplifyIgnore,
};
