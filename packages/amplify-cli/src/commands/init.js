const preInitSetup = require('../lib/init-steps/preInitSetup');
const postInitSetup = require('../lib/init-steps/postInitSetup');
const analyzeProject = require('../lib/init-steps/s0-analyzeProject');
const initFrontendHandler = require('../lib/init-steps/s1-initFrontend');
const initProviders = require('../lib/init-steps/s2-initProviders');
const onFailure = require('../lib/init-steps/s9-onFailure');
const onSuccess = require('../lib/init-steps/s9-onSuccess');
const { constructInputParams } = require('../lib/amplify-service-helper');

module.exports = {
  name: 'init',
  run: async context => {
    constructExeInfo(context);
    await preInitSetup
      .run(context)
      .then(analyzeProject.run)
      .then(initFrontendHandler.run)
      .then(initProviders.run)
      .then(onSuccess.run)
      .catch(onFailure.run);
    await postInitSetup.run(context).catch(onFailure.run);
  },
};

function constructExeInfo(context) {
  context.exeInfo = {
    inputParams: constructInputParams(context),
  };
}
