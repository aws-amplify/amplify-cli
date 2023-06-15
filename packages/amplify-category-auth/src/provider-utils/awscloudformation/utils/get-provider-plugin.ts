import { $TSContext } from '@aws-amplify/amplify-cli-core';
import { getSupportedServices } from '../../supported-services';
import { ProviderUtils } from '../import/types';

export const getProviderPlugin = (context: $TSContext): ProviderUtils => {
  const serviceMetaData = getSupportedServices().Cognito;
  const { provider } = serviceMetaData;

  return context.amplify.getPluginInstance(context, provider);
};
