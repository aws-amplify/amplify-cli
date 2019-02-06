const os = require('os');

function getGitIgnoreBlob() {
  const ignoreList = [
    'amplify/\\#current-cloud-backend',
    'amplify/.config/local-*',
    'amplify/backend/amplify-meta.json',
    'build/',
    'dist/',
    'node_modules/',
    'aws-exports.js',
    'awsconfiguration.json'];

  const toAppend = `${os.EOL + os.EOL
  }${ignoreList.join(os.EOL)}`;

  return toAppend;
}

module.exports = {
  getGitIgnoreBlob,
};
