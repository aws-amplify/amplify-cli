const AmplifyCodeGenConfig = require('./AmplifyCodeGenConfig');

let config = null;

function loadConfig(context) {
  if (!config) {
    config = new AmplifyCodeGenConfig(context);
  }
  return config;
}

module.exports = loadConfig;
