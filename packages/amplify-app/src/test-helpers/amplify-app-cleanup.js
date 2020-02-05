const rimraf = require('rimraf');
const nexpect = require('nexpect');

function amplifyDelete() {
  return new Promise((resolve, reject) => {
    nexpect
      .spawn(getCLIPath(), ['delete'])
      .wait('Are you sure you want to continue?')
      .sendline('\r')
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
  rimraf.sync('package.json');
  rimraf.sync('package-lock.json');
  rimraf.sync('.graphqlconfig.yml');
}

module.exports = { deleteAmplifyAppFiles, amplifyDelete };
