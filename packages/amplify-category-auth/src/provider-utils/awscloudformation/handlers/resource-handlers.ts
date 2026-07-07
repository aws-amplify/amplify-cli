import { $TSAny, $TSObject, stateManager } from '@aws-amplify/amplify-cli-core';
import { printer } from '@aws-amplify/amplify-prompts';
import { ensureEnvParamManager } from '@aws-amplify/amplify-environment-parameters';
import { getSupportedServices } from '../../supported-services';
import { authProviders } from '../assets/string-maps';
import { AuthInputState } from '../auth-inputs-manager/auth-input-state';
import { category, ENV_SPECIFIC_PARAMS, privateKeys } from '../constants';
import { CognitoCLIInputs, CognitoConfiguration } from '../service-walkthrough-types/awsCognito-user-input-types';
import { ServiceQuestionHeadlessResult } from '../service-walkthrough-types/cognito-user-input-types';
import { getPostAddAuthMetaUpdater, getPostUpdateAuthMetaUpdater } from '../utils/amplify-meta-updaters';
import { getAddAuthDefaultsApplier, getUpdateAuthDefaultsApplier } from '../utils/auth-defaults-appliers';
import { doesConfigurationIncludeSMS } from '../utils/auth-sms-workflow-helper';
import { generateAuthStackTemplate } from '../utils/generate-auth-stack-template';
import { getPostAddAuthMessagePrinter, getPostUpdateAuthMessagePrinter, printSMSSandboxWarning } from '../utils/message-printer';
import {
  createUserPoolGroups,
  getResourceSynthesizer,
  getResourceUpdater,
  removeDeprecatedProps,
  updateUserPoolGroups,
} from '../utils/synthesize-resources';
import { AuthContext } from '../../../context';

/**
 * Factory function that returns a CognitoCLIInputs consumer that handles all of the resource generation logic.
 * The consumer returns the resourceName of the generated resource.
 * @param context The amplify context
 */
export const getAddAuthHandler = (context: AuthContext) => async (request: ServiceQuestionHeadlessResult | CognitoConfiguration) => {
  const serviceMetadata = getSupportedServices()[request.serviceName];
  const { defaultValuesFilename, provider } = serviceMetadata;

  let projectName = context.amplify.getProjectConfig().projectName.toLowerCase();
  const disallowedChars = /[^A-Za-z0-9]+/g;
  projectName = projectName.replace(disallowedChars, '');

  const requestWithDefaults = await getAddAuthDefaultsApplier(context, defaultValuesFilename, projectName)(request);

  // replace secret keys from cli inputs to be stored in deployment secrets

  let sharedParams = { ...requestWithDefaults } as $TSAny;
  privateKeys.forEach((p) => delete sharedParams[p]);
  sharedParams = removeDeprecatedProps(sharedParams);
  // extracting env-specific params from parameters object
  const envSpecificParams: $TSObject = {};
  const cliInputs = { ...sharedParams };
  ENV_SPECIFIC_PARAMS.forEach((paramName) => {
    if (paramName in request) {
      envSpecificParams[paramName] = cliInputs[paramName];
      delete cliInputs[paramName];
    }
  });

  const cognitoCLIInputs: CognitoCLIInputs = {
    version: '1',
    cognitoConfig: cliInputs,
  };

  await ensureEnvParamManager();
  context.amplify.saveEnvResourceParameters(context, category, cognitoCLIInputs.cognitoConfig.resourceName, envSpecificParams);

  // move this function outside of AddHandler
  try {
    const cliState = new AuthInputState(context, cognitoCLIInputs.cognitoConfig.resourceName);
    // saving cli-inputs except secrets
    await cliState.saveCLIInputPayload(cognitoCLIInputs);
    // cdk transformation in this function
    // start auth transform here
    await generateAuthStackTemplate(context, cognitoCLIInputs.cognitoConfig.resourceName);
    // remove this when api and functions transform are done
    await getResourceSynthesizer(context, requestWithDefaults);

    getPostAddAuthMetaUpdater(context, { service: cognitoCLIInputs.cognitoConfig.serviceName, providerName: provider })(
      cliInputs.resourceName,
    );
    getPostAddAuthMessagePrinter(cognitoCLIInputs.cognitoConfig.resourceName);

    if (doesConfigurationIncludeSMS(request)) {
      await printSMSSandboxWarning();
    }
  } catch (err: $TSAny) {
    printer.info(err.stack);
    printer.error('There was an error adding the auth resource');
    void context.usageData.emitError(err);
    process.exitCode = 1;
  }
  return cognitoCLIInputs.cognitoConfig.resourceName;
};

/**
 * Factory function that returns a CognitoConfiguration consumer and handles updates to the auth resource
 */
export const getUpdateAuthHandler = (context: AuthContext) => async (request: ServiceQuestionHeadlessResult | CognitoConfiguration) => {
  const { defaultValuesFilename } = getSupportedServices()[request.serviceName];
  const requestWithDefaults = await getUpdateAuthDefaultsApplier(
    context,
    defaultValuesFilename,
    context.updatingAuth as CognitoConfiguration,
  )(request);
  const resources = stateManager.getMeta();
  if (resources.auth.userPoolGroups) {
    await updateUserPoolGroups(context, requestWithDefaults.resourceName, requestWithDefaults.userPoolGroupList);
  } else {
    await createUserPoolGroups(context, requestWithDefaults.resourceName, requestWithDefaults.userPoolGroupList);
  }
  if (
    (!requestWithDefaults.updateFlow && !requestWithDefaults.thirdPartyAuth) ||
    (requestWithDefaults.updateFlow === 'manual' && !requestWithDefaults.thirdPartyAuth)
  ) {
    delete requestWithDefaults.selectedParties;
    requestWithDefaults.authProviders = [];
    authProviders.forEach((a) => delete (requestWithDefaults as $TSAny)[a.answerHashKey]);
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

  let sharedParams = { ...requestWithDefaults } as $TSAny;
  privateKeys.forEach((p) => delete sharedParams[p]);
  sharedParams = removeDeprecatedProps(sharedParams);
  // extracting env-specific params from parameters object
  const envSpecificParams: $TSAny = {};
  const cliInputs = { ...sharedParams };
  ENV_SPECIFIC_PARAMS.forEach((paramName) => {
    if (paramName in cliInputs) {
      envSpecificParams[paramName] = cliInputs[paramName];
      delete cliInputs[paramName];
    }
  });
  context.amplify.saveEnvResourceParameters(context, category, requestWithDefaults.resourceName, envSpecificParams);

  // handling triggers to be saved correctly in cli-inputs
  await getResourceUpdater(context, cliInputs);
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
    const cliState = new AuthInputState(context, cognitoCLIInputs.cognitoConfig.resourceName);
    const { triggers } = cognitoCLIInputs.cognitoConfig;
    // convert triggers to JSON as overridden in defaults
    if (triggers && typeof triggers === 'string') {
      cognitoCLIInputs.cognitoConfig.triggers = JSON.parse(triggers);
    }
    // saving cli-inputs except secrets
    await cliState.saveCLIInputPayload(cognitoCLIInputs);
    // remove this when api and functions transform are done
    if (request.updateFlow !== 'updateAdminQueries') {
      await generateAuthStackTemplate(context, cognitoCLIInputs.cognitoConfig.resourceName);
    }

    await getPostUpdateAuthMetaUpdater(context)(cognitoCLIInputs.cognitoConfig.resourceName);
    await getPostUpdateAuthMessagePrinter()(cognitoCLIInputs.cognitoConfig.resourceName);

    if (doesConfigurationIncludeSMS(cliInputs)) {
      await printSMSSandboxWarning();
    }
  } catch (err: $TSAny) {
    printer.info(err.stack);
    printer.error('There was an error updating the auth resource');
    void context.usageData.emitError(err);
    process.exitCode = 1;
  }
  return cognitoCLIInputs.cognitoConfig.resourceName;
};
