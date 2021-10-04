import { messages } from '../../provider-utils/awscloudformation/assets/string-maps';
import { getAuthResourceName } from '../../utils/getAuthResourceName';
import { category, generateAuthStackTemplate } from '../..';
import { $TSContext, stateManager } from 'amplify-cli-core';
import { printer, prompter } from 'amplify-prompts';
import { AuthInputState } from '../../provider-utils/awscloudformation/auth-inputs-manager/auth-input-state';
import _ from 'lodash';
import { migrateResourceToSupportOverride } from '../../provider-utils/awscloudformation/utils/migrate-override-resource';
import { CognitoCLIInputs } from '../../provider-utils/awscloudformation/service-walkthrough-types/awsCognito-user-input-types';

export const name = 'update';
export const alias = ['update'];

export const run = async (context: $TSContext) => {
  const { amplify } = context;
  const servicesMetadata = (await import('../../provider-utils/supported-services')).supportedServices;
  const stateMeta = stateManager.getMeta();
  const existingAuth = stateMeta.auth;
  if (!existingAuth) {
    return printer.warn('Auth has not yet been added to this project.');
  } else {
    const services = Object.keys(existingAuth);
    for (const service of services) {
      const serviceMeta = existingAuth[service];
      if (serviceMeta.service === 'Cognito' && serviceMeta.mobileHubMigrated === true) {
        printer.error('Auth is migrated from Mobile Hub and cannot be updated with Amplify CLI.');
        return context;
      } else if (serviceMeta.service === 'Cognito' && serviceMeta.serviceType === 'imported') {
        printer.error('Updating of imported Auth resources is not supported.');
        return context;
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
  let prevCLIInputs: CognitoCLIInputs;
  try {
    const cliState = new AuthInputState(resourceName);
    prevCLIInputs = cliState.getCLIInputPayload();
  } catch (err) {
    printer.warn('Cli-inputs.json doesnt exist');
    // put spinner here
    const isMigrate = await prompter.confirmContinue(`Do you want to migrate this ${resourceName} to support overrides?`);
    if (isMigrate) {
      // generate cli-inputs for migration from parameters.json
      migrateResourceToSupportOverride(resourceName);
      // fetch cli Inputs again
      const cliState = new AuthInputState(resourceName);
      prevCLIInputs = cliState.getCLIInputPayload();
      await generateAuthStackTemplate(context, prevCLIInputs.cognitoConfig.resourceName);
    }
  }
  const cliState = new AuthInputState(resourceName);
  context.updatingAuth = await cliState.loadResourceParameters(context, cliState.getCLIInputPayload());

  try {
    const result = await amplify.serviceSelectionPrompt(context, category, servicesMetadata);
    const options = {
      service: result.service,
      providerPlugin: result.providerName,
      resourceName,
    };
    const providerController = await import(`../../provider-utils/${result.providerName}/index`);
    if (!providerController) {
      printer.error('Provider not configured for this category');
      return;
    }
    const updateRsourceResponse = await providerController.updateResource(context, options);
    printer.success(`Successfully updated resource ${name} locally`);
    printer.info('');
    printer.success('Some next steps:');
    printer.info('"amplify push" will build all your local backend resources and provision it in the cloud');
    printer.info(
      '"amplify publish" will build all your local backend and frontend resources (if you have hosting category added) and provision it in the cloud',
    );
    printer.info('');
    return updateRsourceResponse;
  } catch (err) {
    printer.info(err.stack);
    printer.error('There was an error adding the auth resource');
    context.usageData.emitError(err);
    process.exitCode = 1;
  }
};
