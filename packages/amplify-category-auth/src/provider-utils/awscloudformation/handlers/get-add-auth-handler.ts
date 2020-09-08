import { ServiceQuestionsResult } from '../service-walkthrough-types';
import { getAddAuthDefaultsApplier } from '../utils/add-auth-defaults-applier';
import { getResourceSynthesizer } from '../utils/synthesize-resources';
import { getPostAddAuthMetaUpdater } from '../utils/post-add-auth-meta-update';
import { getPostAddAuthMessagePrinter } from '../utils/post-add-auth-message-printer';

/**
 * Factory function that returns a ServiceQuestionsResult consumer that handles all of the resource generation logic
 * @param context The amplify context
 */
export const getAddAuthHandler = (context: any) => async (request: ServiceQuestionsResult) => {
  const serviceMetadata = require('../../supported-services').supportedServices[request.serviceName];
  const { cfnFilename, defaultValuesFilename, provider } = serviceMetadata;
  let projectName = context.amplify.getProjectConfig().projectName.toLowerCase();
  const disallowedChars = /[^A-Za-z0-9]+/g;
  projectName = projectName.replace(disallowedChars, '');
  return getAddAuthDefaultsApplier(
    defaultValuesFilename,
    projectName,
  )(request)
    .then(getResourceSynthesizer(context, cfnFilename, provider))
    .then(request => request.resourceName!)
    .then(getPostAddAuthMetaUpdater(context, { service: request.serviceName, providerName: provider }))
    .then(getPostAddAuthMessagePrinter(context))
    .catch(err => {
      context.print.info(err.stack);
      context.print.error('There was an error adding the auth resource');
      context.usageData.emitError(err);
    });
};
