const { messages } = require('../../provider-utils/awscloudformation/assets/string-maps');
const { getAuthResourceName } = require('../../utils/getAuthResourceName');
const { transformUserPoolGroupSchema } = require('../../provider-utils/awscloudformation/utils/transform-user-pool-group');
const path = require('path');
const fs = require('fs');
const { category } = require('../..');
const { attachPrevParamsToContext } = require('../../provider-utils/awscloudformation/utils/attach-prev-params-to-context');
const { FeatureFlags, pathManager, BannerMessage } = require('amplify-cli-core');
const { printer } = require('amplify-prompts');
const { getSupportedServices } = require('../../provider-utils/supported-services');

const subcommand = 'update';
let options;

module.exports = {
  name: subcommand,
  alias: ['update'],
  run: async context => {
    const { amplify } = context;
    const servicesMetadata = getSupportedServices();
    const existingAuth = amplify.getProjectDetails().amplifyMeta.auth || {};

    if (!Object.keys(existingAuth).length > 0) {
      return context.print.warning('Auth has not yet been added to this project.');
    } else {
      const services = Object.keys(existingAuth);

      for (let i = 0; i < services.length; i++) {
        const serviceMeta = existingAuth[services[i]];

        if (serviceMeta.service === 'Cognito' && serviceMeta.mobileHubMigrated === true) {
          context.print.error('Auth is migrated from Mobile Hub and cannot be updated with Amplify CLI.');
          return context;
        } else if (serviceMeta.service === 'Cognito' && serviceMeta.serviceType === 'imported') {
          context.print.error('Updating of imported Auth resources is not supported.');
          return context;
        } else if (serviceMeta.service === 'Cognito' && !FeatureFlags.getBoolean('auth.forceAliasAttributes')) {
          const authAttributes = JSON.parse(
            fs.readFileSync(pathManager.getResourceParametersFilePath(undefined, 'auth', services[i])).toString(),
          );
          if (authAttributes.aliasAttributes && authAttributes.aliasAttributes.length > 0) {
            const authUpdateWarning = await BannerMessage.getMessage('AMPLIFY_UPDATE_AUTH_ALIAS_ATTRIBUTES_WARNING');
            if (authUpdateWarning) {
              printer.warn(authUpdateWarning);
            }
          }
        }
      }
    }

    context.print.info('Please note that certain attributes may not be overwritten if you choose to use defaults settings.');

    const meta = amplify.getProjectDetails().amplifyMeta;
    const dependentResources = Object.keys(meta).some(e => {
      //eslint-disable-line
      return ['analytics', 'api', 'storage', 'function'].includes(e) && Object.keys(meta[e]).length > 0;
    });

    if (dependentResources) {
      context.print.info(messages.dependenciesExists);
    }

    const resourceName = await getAuthResourceName(context);
    const providerPlugin = context.amplify.getPluginInstance(context, servicesMetadata.Cognito.provider);
    context.updatingAuth = providerPlugin.loadResourceParameters(context, 'auth', resourceName);

    return amplify
      .serviceSelectionPrompt(context, category, servicesMetadata)
      .then(result => {
        options = {
          service: result.service,
          providerPlugin: result.providerName,
          resourceName,
        };
        const providerController = require(`../../provider-utils/${result.providerName}/index`);
        if (!providerController) {
          context.print.error('Provider not configured for this category');
          return;
        }
        return providerController.updateResource(context, options);
      })
      .then(async name => {
        const { print } = context;
        print.success(`Successfully updated resource ${name} locally`);
        print.info('');
        print.success('Some next steps:');
        print.info('"amplify push" will build all your local backend resources and provision it in the cloud');
        print.info(
          '"amplify publish" will build all your local backend and frontend resources (if you have hosting category added) and provision it in the cloud',
        );
        print.info('');
      })
      .catch(err => {
        context.print.info(err.stack);
        context.print.error('There was an error adding the auth resource');
        context.usageData.emitError(err);
        process.exitCode = 1;
      });
  },
};
