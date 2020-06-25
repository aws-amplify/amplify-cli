const analyzeProject = require('../config-steps/c0-analyzeProject');
const configFrontendHandler = require('../config-steps/c1-configFrontend');
const configProviders = require('../config-steps/c2-configProviders');
const configureNewUser = require('../configure-new-user');
const onFailure = require('../config-steps/c9-onFailure');
const onSuccess = require('../config-steps/c9-onSuccess');
const { normalizeInputParams } = require('../input-params-manager');

module.exports = {
  name: 'configure',
  run: async context => {
    if (!context.parameters.first) {
      await configureNewUser.run(context);
    }

    if (context.parameters.first === 'project') {
      constructExeInfo(context);
      await analyzeProject
        .run(context)
        .then(configFrontendHandler.run)
        .then(configProviders.run)
        .then(onSuccess.run)
        .catch(onFailure.run);
    }
  },
};

function constructExeInfo(context) {
  context.exeInfo = context.amplify.getProjectDetails();
  context.exeInfo.inputParams = normalizeInputParams(context);
}
