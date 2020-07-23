const analyzeProject = require('../config-steps/c0-analyzeProject');
const configFrontendHandler = require('../config-steps/c1-configFrontend');
const configProviders = require('../config-steps/c2-configProviders');
const configureNewUser = require('../configure-new-user');
const onFailure = require('../config-steps/c9-onFailure');
const onSuccess = require('../config-steps/c9-onSuccess');
const { normalizeInputParams } = require('../input-params-manager');
import { write } from '../app-config';

module.exports = {
  name: 'configure',
  run: async context => {
    if (context.parameters.options['usage-data-off']) {
      write(context, { usageDataConfig: { isUsageTrackingEnabled: false } });
      context.print.success('Usage Data has been turned off');
      return;
    }
    if (context.parameters.options['usage-data-on']) {
      write(context, { usageDataConfig: { isUsageTrackingEnabled: true } });
      context.print.success('Usage Data has been turned on');
      return;
    }

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
