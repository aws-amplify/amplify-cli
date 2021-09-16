const fs = require('fs');
const { printer } = require('amplify-prompts');
const { FeatureFlags, pathManager, BannerMessage } = require('amplify-cli-core');
const { messages } = require('../../provider-utils/awscloudformation/assets/string-maps');

const subcommand = 'remove';
const category = 'auth';

module.exports = {
  name: subcommand,
  run: async context => {
    const { amplify, parameters } = context;
    const resourceName = parameters.first;

    const meta = amplify.getProjectDetails().amplifyMeta;
    const dependentResources = Object.keys(meta).some(e => {
      //eslint-disable-line
      return ['analytics', 'api', 'storage', 'function'].includes(e) && Object.keys(meta[e]).length > 0;
    });

    if (dependentResources) {
      context.print.info(messages.dependenciesExists);
    }

    const existingAuth = meta.auth || {};
    if (Object.keys(existingAuth).length > 0) {
      const services = Object.keys(existingAuth);
      for (let i = 0; i < services.length; i++) {
        const serviceMeta = existingAuth[services[i]];
        if (serviceMeta.service === 'Cognito' && !FeatureFlags.getBoolean('auth.forceAliasAttributes')) {
          const authAttributes = JSON.parse(
            fs.readFileSync(pathManager.getResourceParametersFilePath(pathManager.findProjectRoot(), 'auth', services[i])).toString(),
          );
          if (authAttributes.aliasAttributes && authAttributes.aliasAttributes.length > 0) {
            const authRemoveWarning = await BannerMessage.getMessage('AMPLIFY_REMOVE_AUTH_ALIAS_ATTRIBUTES_WARNING');
            printer.warn(authRemoveWarning);
          }
        }
      }
    }

    return amplify.removeResource(context, category, resourceName).catch(err => {
      context.print.info(err.stack);
      context.print.error('There was an error removing the auth resource');
      context.usageData.emitError(err);
      process.exitCode = 1;
    });
  },
};
