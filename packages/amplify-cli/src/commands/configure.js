const analyzeProject = require('../lib/config-steps/c0-analyzeProject');
const configFrontendHandler = require('../lib/config-steps/c1-configFrontendHandler');
const configProviders = require('../lib/config-steps/c2-configProviders');
const configureNewUser = require('../lib/configure-new-user');
const onFailure = require('../lib/config-steps/c9-onFailure');
const onSuccess = require('../lib/config-steps/c9-onSuccess');

module.exports = {
  name: 'configure',
  run: async (context) => {
    if (!context.parameters.first) {
      return configureNewUser.run(context);
    }

    if (context.parameters.first === 'project') {
      constructExeInfo(context);
      return analyzeProject.run(context)
        .then(configFrontendHandler.run)
        .then(configProviders.run)
        .then(onSuccess.run)
        .catch(onFailure.run);
    }
  },
};

function constructExeInfo(context) {
  const inputParams = {};
  Object.keys(context.parameters.options).forEach((key) => {
    key = normalizeKey(key);
    inputParams[key] = JSON.parse(context.parameters.options[key]);
  });
  context.exeInfo = {
    inputParams,
  };
}

function normalizeKey(key) {
  if (key === 'y') {
    key = 'yes';
  }
  if (key === 'aws') {
    key = 'awscloudformation';
  }
  return key;
}
