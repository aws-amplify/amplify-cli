const moment = require('moment');
const awsmobileConstant = require('./constants');

function makeid(n) {
  if (!n) {
    n = 5;
  }
  let text = '';
  const possible = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

  for (let i = 0; i < n; i += 1) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }

  return text;
}

function generateAWSConfigFileName(projectName) {
  return `${projectName}-${makeid()}.json`;
}

function generateIAMUserName() {
  return `AWSMobileCLI-${makeid()}`;
}

function generateBackendParentStackName(projectName) {
  return `${projectName}-${moment().format(awsmobileConstant.DateTimeFormatStringCompact)}`;
}

function generateDeviceFarmTestRunName() {
  return Date.now().toString();
}

function generateCloudFrontInvalidationReference() {
  return Date.now().toString();
}

function generateTempName(seedName) {
  return seedName + makeid();
}

function generateGraphqlAPIName(projectInfo) {
  return projectInfo.BackendProjectName;
}

module.exports = {
  generateAWSConfigFileName,
  generateIAMUserName,
  generateBackendParentStackName,
  generateDeviceFarmTestRunName,
  generateCloudFrontInvalidationReference,
  generateTempName,
  generateGraphqlAPIName,
  makeid,
};
