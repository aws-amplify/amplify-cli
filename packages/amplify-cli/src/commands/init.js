const analyzeProject = require('../lib/init-steps/s0-analyzeProject');
const initFrontendHandler = require('../lib/init-steps/s1-initFrontendHandler');
const initProviders = require('../lib/init-steps/s2-initProviders');
const onFailure = require('../lib/init-steps/s9-onFailure');
const onSuccess = require('../lib/init-steps/s9-onSuccess');

module.exports = {
  name: 'init',
  run: async (context) => {
    constructExeInfo(context);
    analyzeProject.run(context)
      .then(initFrontendHandler.run)
      .then(initProviders.run)
      .then(onSuccess.run)
      .catch(onFailure.run);
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
