const os = require('os');

function getGitIgnoreBlob() {
  const ignoreList = [
    'amplify/\\#current-cloud-backend',
    'amplify/.config/local-*',
    'amplify/backend/amplify-meta.json',
    'amplify/backend/awscloudformation',
    'build/',
    'dist/',
    'node_modules/',
    'aws-exports.js',
    'awsconfiguration.json',
    'amplifyconfiguration.json',
  ];

  const toAppend = `${os.EOL + os.EOL}${ignoreList.join(os.EOL)}`;

  return toAppend;
}

module.exports = {
  getGitIgnoreBlob,
};
