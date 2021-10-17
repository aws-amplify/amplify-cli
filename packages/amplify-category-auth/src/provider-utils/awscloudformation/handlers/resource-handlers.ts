import { ServiceQuestionsResult } from '../service-walkthrough-types';
import { getAddAuthDefaultsApplier, getUpdateAuthDefaultsApplier } from '../utils/auth-defaults-appliers';
import { getResourceSynthesizer, getResourceUpdater } from '../utils/synthesize-resources';
import { getPostAddAuthMetaUpdater, getPostUpdateAuthMetaUpdater } from '../utils/amplify-meta-updaters';
import { getPostAddAuthMessagePrinter, getPostUpdateAuthMessagePrinter, printSMSSandboxWarning } from '../utils/message-printer';
import { getSupportedServices } from '../../supported-services';
import { doesConfigurationIncludeSMS } from '../utils/auth-sms-workflow-helper';

/**
 * Factory function that returns a ServiceQuestionsResult consumer that handles all of the resource generation logic.
 * The consumer returns the resourceName of the generated resource.
 * @param context The amplify context
 */
export const getAddAuthHandler = (context: any, skipNextSteps: boolean = false) => async (request: ServiceQuestionsResult) => {
  const serviceMetadata = getSupportedServices()[request.serviceName];
  const { cfnFilename, defaultValuesFilename, provider } = serviceMetadata;

  let projectName = context.amplify.getProjectConfig().projectName.toLowerCase();
  const disallowedChars = /[^A-Za-z0-9]+/g;
  projectName = projectName.replace(disallowedChars, '');

  const requestWithDefaults = await getAddAuthDefaultsApplier(context, defaultValuesFilename, projectName)(request);

  try {
    await getResourceSynthesizer(context, cfnFilename, provider)(requestWithDefaults);
    await getPostAddAuthMetaUpdater(context, { service: requestWithDefaults.serviceName, providerName: provider })(
      requestWithDefaults.resourceName!,
    );
    await getPostAddAuthMessagePrinter(context.print)(requestWithDefaults.resourceName!, skipNextSteps);

    if (doesConfigurationIncludeSMS(request)) {
      await printSMSSandboxWarning(context.print);
    }
  } catch (err) {
    context.print.info(err.stack);
    context.print.error('There was an error adding the auth resource');
    context.usageData.emitError(err);
    process.exitCode = 1;
  }
  return requestWithDefaults.resourceName!;
};

export const getUpdateAuthHandler = (context: any) => async (request: ServiceQuestionsResult) => {
  const { cfnFilename, defaultValuesFilename, provider } = getSupportedServices()[request.serviceName];
  const requestWithDefaults = await getUpdateAuthDefaultsApplier(context, defaultValuesFilename, context.updatingAuth)(request);
  try {
    await getResourceUpdater(context, cfnFilename, provider)(requestWithDefaults);
    await getPostUpdateAuthMetaUpdater(context)(requestWithDefaults.resourceName!);
    await getPostUpdateAuthMessagePrinter(context.print)(requestWithDefaults.resourceName!);

    if (doesConfigurationIncludeSMS(requestWithDefaults)) {
      await printSMSSandboxWarning(context.print);
    }
  } catch (err) {
    context.print.info(err.stack);
    context.print.error('There was an error updating the auth resource');
    context.usageData.emitError(err);
    process.exitCode = 1;
  }
  return requestWithDefaults.resourceName!;
};
