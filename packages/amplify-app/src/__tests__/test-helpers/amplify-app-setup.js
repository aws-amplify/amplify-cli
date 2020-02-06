const nexpect = require('nexpect');
const path = require('path');

function getAmplifyAppPath() {
  return path.join(__dirname, '..', '..', '..', 'bin', 'amplify-app');
}

function amplifyAppAndroid() {
  return new Promise((resolve, reject) => {
    nexpect.spawn(getAmplifyAppPath(), ['--platform', 'android']).run(function(err) {
      if (!err) {
        resolve();
      } else {
        reject(err);
      }
    });
  });
}

function amplifyAppIos() {
  return new Promise((resolve, reject) => {
    nexpect.spawn(getAmplifyAppPath(), ['--platform', 'ios']).run(function(err) {
      if (!err) {
        resolve();
      } else {
        reject(err);
      }
    });
  });
}

function amplifyAppAngular() {
  return new Promise((resolve, reject) => {
    nexpect
      .spawn(getAmplifyAppPath())
      .wait('What type of app are you building')
      .sendline('\r')
      .wait('What javascript framework are you using')
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

function amplifyAppReact() {
  return new Promise((resolve, reject) => {
    nexpect
      .spawn(getAmplifyAppPath())
      .wait('What type of app are you building')
      .sendline('\r')
      .wait('What javascript framework are you using')
      .sendline('jjj\r')
      .run(function(err) {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
}

function amplifyModelgen() {
  return new Promise((resolve, reject) => {
    nexpect.spawn('npm', ['run', 'amplify-modelgen']).run(function(err) {
      if (!err) {
        resolve();
      } else {
        reject(err);
      }
    });
  });
}

function amplifyPush() {
  return new Promise((resolve, reject) => {
    nexpect.spawn('npm', ['run', 'amplify-push']).run(function(err) {
      if (!err) {
        resolve();
      } else {
        reject(err);
      }
    });
  });
}

module.exports = { amplifyAppAngular, amplifyAppReact, amplifyModelgen, amplifyPush, amplifyAppAndroid, amplifyAppIos };
