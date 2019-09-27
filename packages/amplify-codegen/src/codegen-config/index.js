const AmplifyCodeGenConfig = require('./AmplifyCodeGenConfig');

let config = null;

function loadConfig(context, withoutInit = false) {
  if (!config) {
    config = new AmplifyCodeGenConfig(context, withoutInit);
  }
  return config;
}

module.exports = loadConfig;
