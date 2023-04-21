import { ensureEnvParamManager } from '@aws-amplify/amplify-environment-parameters';
import {
  $TSContext,
  AmplifyCategories,
  AmplifyFault,
  AmplifySupportedService,
  BannerMessage,
  FeatureFlags,
  stateManager,
} from '@aws-amplify/amplify-cli-core';
import { printer } from '@aws-amplify/amplify-prompts';
import _ from 'lodash';
import { category } from '../..';
import { AuthContext } from '../../context';
import { messages } from '../../provider-utils/awscloudformation/assets/string-maps';
import * as providerController from '../../provider-utils/awscloudformation/index';
import { checkAuthResourceMigration } from '../../provider-utils/awscloudformation/utils/check-for-auth-migration';
import { getSupportedServices } from '../../provider-utils/supported-services';
import { getAuthResourceName } from '../../utils/getAuthResourceName';

export const name = 'update';
export const alias = ['update'];

/**
 * entry point to update auth resource
 */
export const run = async (context: AuthContext): Promise<string | $TSContext | undefined> => {
  const { amplify } = context;
  const servicesMetadata = getSupportedServices();
  const meta = stateManager.getMeta();
  const existingAuth = meta.auth ?? {};
  if (_.isEmpty(existingAuth)) {
    printer.warn('Project does not contain auth resources. Add auth using `amplify add auth`.');
    return undefined;
  }
  const authResources = Object.keys(existingAuth);
  for (const authResourceName of authResources) {
    const serviceMeta = existingAuth[authResourceName];
    if (serviceMeta.service === AmplifySupportedService.COGNITO && serviceMeta.mobileHubMigrated === true) {
      printer.error('Auth is migrated from Mobile Hub and cannot be updated with Amplify CLI.');
      return context;
    }
    if (serviceMeta.service === AmplifySupportedService.COGNITO && serviceMeta.serviceType === 'imported') {
      printer.error('Updating imported Auth resource is not supported.');
      return context;
    }
    if (serviceMeta.service === AmplifySupportedService.COGNITO && !FeatureFlags.getBoolean('auth.forceAliasAttributes')) {
      const authAttributes = stateManager.getResourceParametersJson(undefined, AmplifyCategories.AUTH, authResourceName);
      if (authAttributes.aliasAttributes && authAttributes.aliasAttributes.length > 0) {
        const authUpdateWarning = await BannerMessage.getMessage('AMPLIFY_UPDATE_AUTH_ALIAS_ATTRIBUTES_WARNING');
        if (authUpdateWarning) {
          printer.warn(authUpdateWarning);
        }
      }
    }
  }

  printer.info('Please note that certain attributes may not be overwritten if you choose to use defaults settings.');
  const dependentResources = Object.keys(meta).some(
    (e) => ['analytics', 'api', 'storage', 'function'].includes(e) && Object.keys(meta[e]).length > 0,
  );
  if (dependentResources) {
    printer.info(messages.dependenciesExists);
  }
  const resourceName = await getAuthResourceName(context);
  await checkAuthResourceMigration(context, resourceName, true);
  const providerPlugin = context.amplify.getPluginInstance(context, servicesMetadata.Cognito.provider);
  await ensureEnvParamManager();
  context.updatingAuth = providerPlugin.loadResourceParameters(context, 'auth', resourceName);

  try {
    const result = await amplify.serviceSelectionPrompt(context, category, getSupportedServices());
    const options = {
      service: result.service,
      providerPlugin: result.providerName,
      resourceName,
    };
    if (!providerController) {
      printer.error('Provider not configured for this category');
      return undefined;
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
    throw new AmplifyFault(
      'ResourceUpdateFault',
      {
        message: 'There was an error updating the auth resource',
      },
      err as Error,
    );
  }
};
