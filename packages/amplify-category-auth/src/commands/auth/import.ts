import { $TSContext } from '@aws-amplify/amplify-cli-core';
import { projectHasAuth } from '../../provider-utils/awscloudformation/utils/project-has-auth';
import { getSupportedServices } from '../../provider-utils/supported-services';
import * as path from 'path';
import { printAuthExistsWarning } from '../../provider-utils/awscloudformation/utils/print-auth-exists-warning';

const category = 'auth';

export const run = async (context: $TSContext) => {
  if (projectHasAuth()) {
    printAuthExistsWarning(context);
    return undefined;
  }
  const servicesMetadata = getSupportedServices();

  const serviceSelection = await context.amplify.serviceSelectionPrompt(context, category, servicesMetadata);
  const providerController = await import(path.join('..', '..', 'provider-utils', serviceSelection.providerName));

  return providerController.importResource(context, serviceSelection);
};
