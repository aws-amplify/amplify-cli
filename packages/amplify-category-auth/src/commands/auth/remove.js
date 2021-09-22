const { BannerMessage, FeatureFlags, pathManager } = require('amplify-cli-core');
const { printer } = require('amplify-prompts');
const fs = require('fs');
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
      printer.info(messages.dependenciesExists);
    }

    const existingAuth = meta.auth || {};
    if (Object.keys(existingAuth).length > 0) {
      const services = Object.keys(existingAuth);
      for (const service of services) {
        const serviceMeta = existingAuth[service];
        if (serviceMeta.service === 'Cognito' && !FeatureFlags.getBoolean('auth.forceAliasAttributes')) {
          const authAttributes = JSON.parse(
            fs.readFileSync(pathManager.getResourceParametersFilePath(pathManager.findProjectRoot(), 'auth', service)).toString(),
          );
          if (authAttributes.aliasAttributes && authAttributes.aliasAttributes.length > 0) {
            const authRemoveWarning = await BannerMessage.getMessage('AMPLIFY_REMOVE_AUTH_ALIAS_ATTRIBUTES_WARNING');
            printer.warn(authRemoveWarning);
          }
        }
      }
    }

    return amplify.removeResource(context, category, resourceName).catch(async err => {
      printer.info(err.stack);
      printer.error('There was an error removing the auth resource');
      await context.usageData.emitError(err);
      process.exitCode = 1;
    });
  },
};
