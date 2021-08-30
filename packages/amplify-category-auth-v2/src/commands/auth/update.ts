import { messages } from '../../provider-utils/awscloudformation/assets/string-maps';
import { getAuthResourceName } from '../../utils/getAuthResourceName';
import { category } from '../..';
import { $TSContext, stateManager } from 'amplify-cli-core';

export const name = 'update';
export const alias = ['update'];

export const run = async (context: $TSContext) => {
  const { amplify } = context;
  const servicesMetadata = (await import('../../provider-utils/supported-services')).supportedServices;
  const existingAuth = stateManager.getMeta().auth;
  if (!existingAuth) {
    return context.print.warning('Auth has not yet been added to this project.');
  } else {
    const services = Object.keys(existingAuth);
    for (const service of services) {
      const serviceMeta = existingAuth[service];
      if (serviceMeta.service === 'Cognito' && serviceMeta.mobileHubMigrated === true) {
        context.print.error('Auth is migrated from Mobile Hub and cannot be updated with Amplify CLI.');
        return context;
      } else if (serviceMeta.service === 'Cognito' && serviceMeta.serviceType === 'imported') {
        context.print.error('Updating of imported Auth resources is not supported.');
        return context;
      }
    }
  }

  context.print.info('Please note that certain attributes may not be overwritten if you choose to use defaults settings.');
  const meta = stateManager.getMeta();
  const dependentResources = Object.keys(meta).some(e => {
    return ['analytics', 'api', 'storage', 'function'].includes(e) && Object.keys(meta[e]).length > 0;
  });
  if (dependentResources) {
    context.print.info(messages.dependenciesExists);
  }
  const resourceName = await getAuthResourceName(context);
  const providerPlugin = context.amplify.getPluginInstance(context, servicesMetadata.Cognito.provider);
  // TODO: free context from updating auth
  context.updatingAuth = providerPlugin.loadResourceParameters(context, 'auth', resourceName);
  try {
    const result = await amplify.serviceSelectionPrompt(context, category, servicesMetadata);
    const options = {
      service: result.service,
      providerPlugin: result.providerName,
      resourceName,
    };
    const providerController = await import(`../../provider-utils/${result.providerName}/index`);
    if (!providerController) {
      context.print.error('Provider not configured for this category');
      return;
    }
    const updateRsourceResponse = await providerController.updateResource(context, options);
    const { print } = context;
    print.success(`Successfully updated resource ${name} locally`);
    print.info('');
    print.success('Some next steps:');
    print.info('"amplify push" will build all your local backend resources and provision it in the cloud');
    print.info(
      '"amplify publish" will build all your local backend and frontend resources (if you have hosting category added) and provision it in the cloud',
    );
    print.info('');
    return updateRsourceResponse;
  } catch (err) {
    context.print.info(err.stack);
    context.print.error('There was an error adding the auth resource');
    context.usageData.emitError(err);
    process.exitCode = 1;
  }
};
