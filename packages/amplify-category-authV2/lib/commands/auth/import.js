'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.run = void 0;
const project_has_auth_1 = require('../../provider-utils/awscloudformation/utils/project-has-auth');
const category = 'auth';
const run = async context => {
  if (project_has_auth_1.projectHasAuth(context)) {
    return;
  }
  const servicesMetadata = require('../../provider-utils/supported-services').supportedServices;
  const serviceSelection = await context.amplify.serviceSelectionPrompt(context, category, servicesMetadata);
  const providerController = require(`../../provider-utils/${serviceSelection.providerName}`);
  return providerController.importResource(context, serviceSelection);
};
exports.run = run;
//# sourceMappingURL=import.js.map
