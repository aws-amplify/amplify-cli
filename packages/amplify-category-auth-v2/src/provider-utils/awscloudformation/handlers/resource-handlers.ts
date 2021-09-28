import { ServiceQuestionsResult } from '../service-walkthrough-types/cognito-user-input-types';
import { getAddAuthDefaultsApplier, getUpdateAuthDefaultsApplier } from '../utils/auth-defaults-appliers';
import {
  getResourceSynthesizer,
  getResourceUpdater,
  removeDeprecatedProps,
  updateUserPoolGroups,
  createUserPoolGroups,
} from '../utils/synthesize-resources';
import { getPostAddAuthMetaUpdater, getPostUpdateAuthMetaUpdater } from '../utils/amplify-meta-updaters';
import { getPostAddAuthMessagePrinter, getPostUpdateAuthMessagePrinter, printSMSSandboxWarning } from '../utils/message-printer';
import { supportedServices } from '../../supported-services';
import { doesConfigurationIncludeSMS } from '../utils/auth-sms-workflow-helper';
import { AuthInputState } from '../auth-inputs-manager/auth-input-state';
import { category, ENV_SPECIFIC_PARAMS, privateKeys } from '../constants';
import { generateAuthStackTemplate } from '../utils/generate-auth-stack-template';
import { authProviders } from '../assets/string-maps';
import { CognitoCLIInputs } from '../service-walkthrough-types/awsCognito-user-input-types';
import { getAuthResourceName } from '../../../utils/getAuthResourceName';
import { printer, prompter } from 'amplify-prompts';
import { migrateResourceToSupportOverride } from '../utils/migrate-override-resource';

/**
 * Factory function that returns a CognitoCLIInputs consumer that handles all of the resource generation logic.
 * The consumer returns the resourceName of the generated resource.
 * @param context The amplify context
 */
export const getAddAuthHandler = (context: any) => async (request: ServiceQuestionsResult) => {
  const serviceMetadata = supportedServices[request.serviceName];
  const { cfnFilename, defaultValuesFilename, provider } = serviceMetadata;

  let projectName = context.amplify.getProjectConfig().projectName.toLowerCase();
  const disallowedChars = /[^A-Za-z0-9]+/g;
  projectName = projectName.replace(disallowedChars, '');

  const requestWithDefaults = await getAddAuthDefaultsApplier(context, defaultValuesFilename, projectName)(request);

  // replace secret keys from cli inputs to be stored in deployment secrets

  let sharedParams = Object.assign({}, requestWithDefaults) as any;
  privateKeys.forEach(p => delete sharedParams[p]);
  sharedParams = removeDeprecatedProps(sharedParams);
  // extracting env-specific params from parameters object
  let envSpecificParams: any = {};
  const cliInputs = { ...sharedParams };
  ENV_SPECIFIC_PARAMS.forEach(paramName => {
    if (paramName in request) {
      envSpecificParams[paramName] = cliInputs[paramName];
      delete cliInputs[paramName];
    }
  });

  const cognitoCLIInputs: CognitoCLIInputs = {
    version: '1',
    cognitoConfig: cliInputs,
  };

  context.amplify.saveEnvResourceParameters(context, category, cognitoCLIInputs.cognitoConfig.resourceName, envSpecificParams);

  // move this function outside of AddHandler
  try {
    const cliState = new AuthInputState(cognitoCLIInputs.cognitoConfig.resourceName);
    // saving cli-inputs except secrets
    const answer = await cliState.saveCLIInputPayload(cognitoCLIInputs);
    // cdk transformation in this function
    // start auth transform here
    await generateAuthStackTemplate(context, cognitoCLIInputs.cognitoConfig.resourceName);
    // remoe this when api and functions transform are done
    await getResourceSynthesizer(context, requestWithDefaults);

    getPostAddAuthMetaUpdater(context, { service: cognitoCLIInputs.cognitoConfig.serviceName, providerName: provider })(
      cliInputs.resourceName,
    );
    getPostAddAuthMessagePrinter(context.print)(cognitoCLIInputs.cognitoConfig.resourceName);

    if (doesConfigurationIncludeSMS(request)) {
      await printSMSSandboxWarning(context.print);
    }
  } catch (err) {
    printer.info(err.stack);
    printer.error('There was an error adding the auth resource');
    context.usageData.emitError(err);
    process.exitCode = 1;
  }
  return cognitoCLIInputs.cognitoConfig.resourceName;
};

export const getUpdateAuthHandler = (context: any) => async (request: ServiceQuestionsResult) => {
  const { cfnFilename, defaultValuesFilename, provider } = supportedServices[request.serviceName];
  let prevCliInputs: CognitoCLIInputs;
  const authResourceName = await getAuthResourceName(context);
  try {
    const cliState = new AuthInputState(authResourceName);
    prevCliInputs = cliState.getCLIInputPayload();
  } catch (err) {
    printer.warn('Cli-inputs.json doesnt exist');
    const isMigrate = await prompter.confirmContinue(`Do you want to migrate this ${authResourceName} to support overrides?`);
    if (isMigrate) {
      migrateResourceToSupportOverride(context, authResourceName);
      // fetch cli Inputs again
      const cliState = new AuthInputState(authResourceName);
      prevCliInputs = cliState.getCLIInputPayload();
    }
  }
  const requestWithDefaults = await getUpdateAuthDefaultsApplier(context, defaultValuesFilename, prevCliInputs!.cognitoConfig)(request);
  const resources = context.amplify.getProjectDetails().amplifyMeta;
  if (resources.auth.userPoolGroups) {
    await updateUserPoolGroups(context, requestWithDefaults.resourceName!, requestWithDefaults.userPoolGroupList);
  } else {
    await createUserPoolGroups(context, requestWithDefaults.resourceName!, requestWithDefaults.userPoolGroupList);
  }
  if (
    (!requestWithDefaults.updateFlow && !requestWithDefaults.thirdPartyAuth) ||
    (requestWithDefaults.updateFlow === 'manual' && !requestWithDefaults.thirdPartyAuth)
  ) {
    delete requestWithDefaults.selectedParties;
    requestWithDefaults.authProviders = [];
    authProviders.forEach(a => delete (requestWithDefaults as any)[a.answerHashKey]);
    if (requestWithDefaults.googleIos) {
      delete requestWithDefaults.googleIos;
    }
    if (requestWithDefaults.googleAndroid) {
      delete requestWithDefaults.googleAndroid;
    }
    if (requestWithDefaults.audiences) {
      delete requestWithDefaults.audiences;
    }
  }

  if (requestWithDefaults.useDefault === 'default' || requestWithDefaults.hostedUI === false) {
    delete requestWithDefaults.oAuthMetadata;
    delete requestWithDefaults.hostedUIProviderMeta;
    delete requestWithDefaults.hostedUIProviderCreds;
    delete requestWithDefaults.hostedUIDomainName;
    delete requestWithDefaults.authProvidersUserPool;
  }

  let sharedParams = Object.assign({}, requestWithDefaults) as any;
  privateKeys.forEach(p => delete sharedParams[p]);
  sharedParams = removeDeprecatedProps(sharedParams);
  // extracting env-specific params from parameters object
  let envSpecificParams: any = {};
  const cliInputs = { ...sharedParams };
  ENV_SPECIFIC_PARAMS.forEach(paramName => {
    if (paramName in request) {
      envSpecificParams[paramName] = cliInputs[paramName];
      delete cliInputs[paramName];
    }
  });
  context.amplify.saveEnvResourceParameters(context, category, request.resourceName, envSpecificParams);

  // saving updated request here
  /**
   * 1) update cli-inputs manager (get cli-inputs , save cli-inputs)
   * 2) Save service question Result to cli-inputs.json
   */

  const cognitoCLIInputs: CognitoCLIInputs = {
    version: '1',
    cognitoConfig: cliInputs,
  };
  try {
    const cliState = new AuthInputState(cognitoCLIInputs.cognitoConfig.resourceName);
    // saving cli-inputs except secrets
    await cliState.saveCLIInputPayload(cognitoCLIInputs);
    // remoe this when api and functions transform are done
    await getResourceUpdater(context, cfnFilename, provider)(requestWithDefaults);
    if (request.updateFlow !== 'updateUserPoolGroups' && request.updateFlow !== 'updateAdminQueries') {
      await generateAuthStackTemplate(context, cognitoCLIInputs.cognitoConfig.resourceName);
    }

    await getPostUpdateAuthMetaUpdater(context)(cognitoCLIInputs.cognitoConfig.resourceName);
    await getPostUpdateAuthMessagePrinter(context.print)(cognitoCLIInputs.cognitoConfig.resourceName);

    if (doesConfigurationIncludeSMS(requestWithDefaults)) {
      await printSMSSandboxWarning(context.print);
    }
  } catch (err) {
    printer.info(err.stack);
    printer.error('There was an error updating the auth resource');
    context.usageData.emitError(err);
    process.exitCode = 1;
  }
  return cognitoCLIInputs.cognitoConfig.resourceName;
};
