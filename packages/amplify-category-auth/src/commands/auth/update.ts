import { $TSContext, BannerMessage, FeatureFlags, pathManager, stateManager } from 'amplify-cli-core';
import { printer } from 'amplify-prompts';
import * as fs from 'fs-extra';
import _ from 'lodash';
import { category } from '../..';
import { messages } from '../../provider-utils/awscloudformation/assets/string-maps';
import { AuthInputState } from '../../provider-utils/awscloudformation/auth-inputs-manager/auth-input-state';
import * as providerController from '../../provider-utils/awscloudformation/index';
import { checkAuthResourceMigration } from '../../provider-utils/awscloudformation/utils/check-for-auth-migration';
import { getSupportedServices } from '../../provider-utils/supported-services';
import { getAuthResourceName } from '../../utils/getAuthResourceName';

export const name = 'update';
export const alias = ['update'];

export const run = async (context: $TSContext) => {
  const { amplify } = context;
  const servicesMetadata = getSupportedServices();
  const stateMeta = stateManager.getMeta();
  const existingAuth = stateMeta.auth ?? {};
  if (_.isEmpty(existingAuth)) {
    return printer.warn('Project does not contain auth resources. Add auth using `amplify add auth`.');
  } else {
    const services = Object.keys(existingAuth);
    for (const service of services) {
      const serviceMeta = existingAuth[service];
      if (serviceMeta.service === 'Cognito' && serviceMeta.mobileHubMigrated === true) {
        printer.error('Auth is migrated from Mobile Hub and cannot be updated with Amplify CLI.');
        return context;
      } else if (serviceMeta.service === 'Cognito' && serviceMeta.serviceType === 'imported') {
        printer.error('Updating imported Auth resource is not supported.');
        return context;
      } else if (serviceMeta.service === 'Cognito' && !FeatureFlags.getBoolean('auth.forceAliasAttributes')) {
        const authAttributes = JSON.parse(
          fs.readFileSync(pathManager.getResourceParametersFilePath(undefined, 'auth', service)).toString(),
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

  printer.info('Please note that certain attributes may not be overwritten if you choose to use defaults settings.');
  const dependentResources = Object.keys(stateMeta).some(e => {
    return ['analytics', 'api', 'storage', 'function'].includes(e) && Object.keys(stateMeta[e]).length > 0;
  });
  if (dependentResources) {
    printer.info(messages.dependenciesExists);
  }
  const resourceName = await getAuthResourceName(context);
  await checkAuthResourceMigration(context, resourceName);
  const cliState = new AuthInputState(resourceName);
  context.updatingAuth = await cliState.loadResourceParameters(context, cliState.getCLIInputPayload());

  try {
    const result = await amplify.serviceSelectionPrompt(context, category, getSupportedServices());
    const options = {
      service: result.service,
      providerPlugin: result.providerName,
      resourceName,
    };
    if (!providerController) {
      printer.error('Provider not configured for this category');
      return;
    }
    const updateResourceResponse = await providerController.updateResource(context, options);
    printer.success(`Successfully updated resource ${name} locally`);
    printer.blankLine();
    printer.success('Some next steps:');
    printer.info('"amplify push" will build all your local backend resources and provision it in the cloud');
    printer.info(
      '"amplify publish" will build all your local backend and frontend resources (if you have hosting category added) and provision it in the cloud',
    );
    printer.blankLine();
    return updateResourceResponse;
  } catch (err) {
    printer.info(err.stack);
    printer.error('There was an error adding the auth resource');
    context.usageData.emitError(err);
    process.exitCode = 1;
  }
};
