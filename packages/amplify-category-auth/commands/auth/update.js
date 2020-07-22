const { messages } = require('../../provider-utils/awscloudformation/assets/string-maps');
const { getAuthResourceName } = require('../../utils/getAuthResourceName');
const { transformUserPoolGroupSchema } = require('../../utils/transform-user-pool-group');
const path = require('path');

const subcommand = 'update';
const category = 'auth';
let options;

module.exports = {
  name: subcommand,
  alias: ['update'],
  run: async context => {
    const { amplify } = context;
    const servicesMetadata = amplify.readJsonFile(`${__dirname}/../../provider-utils/supported-services.json`);
    const existingAuth = amplify.getProjectDetails().amplifyMeta.auth || {};

    if (!Object.keys(existingAuth).length > 0) {
      return context.print.warning('Auth has not yet been added to this project.');
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
        return providerController.updateResource(context, category, options);
      })
      .then(async name => {
        // eslint-disable-line no-shadow
        const resourceDirPath = path.join(amplify.pathManager.getBackendDirPath(), 'auth', name, 'parameters.json');
        const authParameters = amplify.readJsonFile(resourceDirPath);
        if (authParameters.dependsOn) {
          amplify.updateamplifyMetaAfterResourceUpdate(category, name, 'dependsOn', authParameters.dependsOn);
        }

        let customAuthConfigured = false;
        if (authParameters.triggers) {
          const triggers = JSON.parse(authParameters.triggers);
          customAuthConfigured =
            triggers.DefineAuthChallenge &&
            triggers.DefineAuthChallenge.length > 0 &&
            triggers.CreateAuthChallenge &&
            triggers.CreateAuthChallenge.length > 0 &&
            triggers.VerifyAuthChallengeResponse &&
            triggers.VerifyAuthChallengeResponse.length > 0;
        }
        amplify.updateamplifyMetaAfterResourceUpdate(category, resourceName, 'customAuth', customAuthConfigured);

        // Update Identity Pool dependency attributes on userpool groups
        const allResources = context.amplify.getProjectMeta();
        if (allResources.auth && allResources.auth.userPoolGroups) {
          let attributes = ['UserPoolId', 'AppClientIDWeb', 'AppClientID'];
          if (authParameters.identityPoolName) {
            attributes.push('IdentityPoolId');
          }
          const userPoolGroupDependsOn = [
            {
              category: 'auth',
              resourceName,
              attributes,
            },
          ];

          amplify.updateamplifyMetaAfterResourceUpdate('auth', 'userPoolGroups', 'dependsOn', userPoolGroupDependsOn);
          await transformUserPoolGroupSchema(context);
        }

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
      });
  },
};
