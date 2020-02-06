const nexpect = require('nexpect');
const path = require('path');

function getCLIPath() {
  return path.join(__dirname, '..', '..', '..', '..', 'amplify-cli', 'bin', 'amplify');
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

module.exports = { amplifyDelete };
