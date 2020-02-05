const rimraf = require('rimraf');
const nexpect = require('nexpect');
const path = require('path');

function getCLIPath() {
  return path.join(__dirname, '..', '..', '..', 'amplify-cli', 'bin', 'amplify');
}

function amplifyDelete() {
  return new Promise((resolve, reject) => {
    nexpect
      .spawn(getCLIPath(), ['delete'])
      .wait('Are you sure you want to continue?')
      .sendline('\r')
      .sendline('')
      .wait('Project deleted locally.')
      .run(function(err) {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
}

function deleteAmplifyAppFiles() {
  rimraf.sync('amplify');
  rimraf.sync('src');
  rimraf.sync('amplify-build-config.json');
  rimraf.sync('amplify-gradle-config.json');
  rimraf.sync('amplifyxc.config');
  rimraf.sync('amplifyconfiguration.json');
  rimraf.sync('awsconfiguration.json');
  rimraf.sync('package.json');
  rimraf.sync('package-lock.json');
  rimraf.sync('.graphqlconfig.yml');
}

module.exports = { deleteAmplifyAppFiles, amplifyDelete };
