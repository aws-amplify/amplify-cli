module.exports = {
  name: 'configure',
  run: async (context) => {
    const analyzeProject = require('../lib/config-steps/c0-analyzeProject');
    const configFrontendHandler = require('../lib/config-steps/c1-configFrontendHandler');
    const configProviders = require('../lib/config-steps/c2-configProviders');
    const configureNewUser = require('../lib/configure-new-user');
    const onFailure = require('../lib/config-steps/c9-onFailure');
    const onSuccess = require('../lib/config-steps/c9-onSuccess');

    if (!context.parameters.first) {
      return configureNewUser.run(context);
    }

    if (context.parameters.first === 'project') {
      return analyzeProject.run(context)
        .then(configFrontendHandler.run)
        .then(configProviders.run)
        .then(onSuccess.run)
        .catch(onFailure.run);
    }
  },
};

