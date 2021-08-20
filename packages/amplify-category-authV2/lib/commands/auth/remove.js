'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.run = exports.name = void 0;
exports.name = 'remove';
const category = 'auth';
const amplify_cli_core_1 = require('amplify-cli-core');
const string_maps_1 = require('../../provider-utils/awscloudformation/assets/string-maps');
const run = async context => {
  const { amplify, parameters } = context;
  const resourceName = parameters.first;
  const meta = amplify_cli_core_1.stateManager.getMeta();
  const dependentResources = Object.keys(meta).some(e => {
    return ['analytics', 'api', 'storage', 'function'].includes(e) && Object.keys(meta[e]).length > 0;
  });
  if (dependentResources) {
    context.print.info(string_maps_1.messages.dependenciesExists);
  }
  try {
    return await amplify.removeResource(context, category, resourceName);
  } catch (err) {
    context.print.info(err.stack);
    context.print.error('There was an error removing the auth resource');
    context.usageData.emitError(err);
    process.exitCode = 1;
  }
};
exports.run = run;
//# sourceMappingURL=remove.js.map
