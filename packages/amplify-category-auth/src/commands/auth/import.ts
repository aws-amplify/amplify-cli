import { $TSContext } from 'amplify-cli-core';
import { projectHasAuth } from '../../provider-utils/awscloudformation/utils/project-has-auth';
import { supportedServices } from '../../provider-utils/supported-services';
import { importResource } from '../../provider-utils/awscloudformation';

const category = 'auth';

export const run = async (context: $TSContext) => {
  if (projectHasAuth(context)) {
    return;
  }

  const serviceSelection = await context.amplify.serviceSelectionPrompt(context, category, supportedServices);
  return importResource(context, serviceSelection, undefined);
};
