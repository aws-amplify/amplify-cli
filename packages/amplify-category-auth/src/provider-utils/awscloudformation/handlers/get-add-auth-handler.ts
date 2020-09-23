import { ServiceQuestionsResult } from '../service-walkthrough-types';
import { getAddAuthDefaultsApplier } from '../utils/add-auth-defaults-applier';
import { getResourceSynthesizer } from '../utils/synthesize-resources';
import { getPostAddAuthMetaUpdater } from '../utils/post-add-auth-meta-update';
import { getPostAddAuthMessagePrinter } from '../utils/post-add-auth-message-printer';

/**
 * Factory function that returns a ServiceQuestionsResult consumer that handles all of the resource generation logic.
 * The consumer returns the resourceName of the generated resource.
 * @param context The amplify context
 */
export const getAddAuthHandler = (context: any) => async (request: ServiceQuestionsResult) => {
  const serviceMetadata = require('../../supported-services').supportedServices[request.serviceName];
  const { cfnFilename, defaultValuesFilename, provider } = serviceMetadata;
  let projectName = context.amplify.getProjectConfig().projectName.toLowerCase();
  const disallowedChars = /[^A-Za-z0-9]+/g;
  projectName = projectName.replace(disallowedChars, '');
  const requestWithDefaults = await getAddAuthDefaultsApplier(context, defaultValuesFilename, projectName)(request);
  await getResourceSynthesizer(
    context,
    cfnFilename,
    provider,
  )(requestWithDefaults)
    .then(req => req.resourceName!)
    .then(getPostAddAuthMetaUpdater(context, { service: requestWithDefaults.serviceName, providerName: provider }))
    .then(getPostAddAuthMessagePrinter(context))
    .catch(err => {
      context.print.info(err.stack);
      context.print.error('There was an error adding the auth resource');
      context.usageData.emitError(err);
      process.exitCode = 1;
    });
  return requestWithDefaults.resourceName!;
};
