import { $TSContext, ServiceSelection, stateManager } from 'amplify-cli-core';
import {
  AuthParameters,
  AuthSelections,
  BackendConfiguration,
  EnvSpecificResourceParameters,
  ImportAnswers,
  ImportAuthHeadlessParameters,
  ImportParameters,
  MetaConfiguration,
  MetaOutput,
  OAuthResult,
  ProviderUtils,
  ResourceParameters,
} from './types';
import { CognitoIdentityProvider, IdentityPool } from 'aws-sdk/clients/cognitoidentity';
import { ICognitoUserPoolService, IIdentityPoolService } from 'amplify-util-import';
import {
  IdentityProviderType,
  UserPoolClientType,
  UserPoolDescriptionType,
  UserPoolType,
} from 'aws-sdk/clients/cognitoidentityserviceprovider';

import Enquirer from 'enquirer';
import _ from 'lodash';
import { importMessages } from './messages';
import { v4 as uuid } from 'uuid';
import { hostedUIProviders, coreAttributes } from '../assets/string-maps';

// Currently the CLI only supports the output generation of these providers
const supportedIdentityProviders = ['COGNITO', 'Facebook', 'Google', 'LoginWithAmazon', 'SignInWithApple'];

export const importResource = async (
  context: $TSContext,
  serviceSelection: ServiceSelection,
  previousResourceParameters: ResourceParameters | undefined,
  providerPluginInstance?: ProviderUtils,
  printSuccessMessage: boolean = true,
): Promise<{ envSpecificParameters: EnvSpecificResourceParameters } | undefined> => {
  // Load provider
  const providerPlugin = providerPluginInstance || require(serviceSelection.provider);
  const providerUtils = providerPlugin as ProviderUtils;

  const importServiceWalkthroughResult = await importServiceWalkthrough(
    context,
    serviceSelection.providerName,
    providerUtils,
    previousResourceParameters,
  );

  if (!importServiceWalkthroughResult) {
    return;
  }

  const { questionParameters, answers, projectType } = importServiceWalkthroughResult;

  // If there was a previousAuthSelection then we dont want to update env params, instead return it.
  const persistEnvParameters = !previousResourceParameters;

  const { envSpecificParameters } = await updateStateFiles(context, questionParameters, answers, projectType, persistEnvParameters);

  if (printSuccessMessage) {
    printSuccess(context, answers.authSelections!, answers.userPool!, answers.identityPool);
  }

  return {
    envSpecificParameters,
  };
};

const printSuccess = (context: $TSContext, authSelections: AuthSelections, userPool: UserPoolType, identityPool?: IdentityPool) => {
  context.print.info('');
  if (authSelections === 'userPoolOnly') {
    context.print.info(importMessages.UserPoolOnlySuccess(userPool.Name!));
  } else {
    context.print.info(importMessages.UserPoolAndIdentityPoolSuccess(userPool.Name!, identityPool!.IdentityPoolName));
  }
  context.print.info('');
  context.print.info('Next steps:');
  context.print.info('');
  context.print.info(`- This resource will be available for GraphQL APIs ('amplify add api')`);
  context.print.info('- Use Amplify libraries to add signup, signin, signout capabilities to your client');
  context.print.info('  application.');
  context.print.info('  - iOS: https://docs.amplify.aws/lib/auth/getting-started/q/platform/ios');
  context.print.info('  - Android: https://docs.amplify.aws/lib/auth/getting-started/q/platform/android');
  context.print.info('  - JavaScript: https://docs.amplify.aws/lib/auth/getting-started/q/platform/js');
};

const importServiceWalkthrough = async (
  context: $TSContext,
  providerName: string,
  providerUtils: ProviderUtils,
  previousResourceParameters: ResourceParameters | undefined,
): Promise<{ questionParameters: ImportParameters; answers: ImportAnswers; projectType: string | undefined } | undefined> => {
  const cognito = await providerUtils.createCognitoUserPoolService(context);
  const identity = await providerUtils.createIdentityPoolService(context);
  const amplifyMeta = stateManager.getMeta();
  const { Region } = amplifyMeta.providers[providerName];

  // Get list of user pools to see if there is anything to import
  const userPoolList = await cognito.listUserPools();

  // Return it no userpools found in the project's region
  if (_.isEmpty(userPoolList)) {
    context.print.info(importMessages.NoUserPoolsInRegion(Region));
    return;
  }

  const questionParameters: ImportParameters = createParameters(providerName, userPoolList);

  // Save the region as we need to store it in resource parameters
  questionParameters.region = Region;

  const projectConfig = context.amplify.getProjectConfig();
  const [shortId] = uuid().split('-');
  const projectName = projectConfig.projectName.toLowerCase().replace(/[^A-Za-z0-9_]+/g, '_');

  const defaultAnswers: ImportAnswers = {
    authSelections: previousResourceParameters?.authSelections || 'userPoolOnly',
    resourceName: previousResourceParameters?.resourceName || `${projectName}${shortId}`,
  };

  const answers: ImportAnswers = { ...defaultAnswers };
  let userPoolSelectionSucceeded = false; // We set this variable if app client selection goes right

  const enquirer = new Enquirer<ImportAnswers>(undefined, defaultAnswers);

  // If a previousAuthSelections is present we skip this question as the type cannot be changed
  // during re-prompts as that could cause incompatibilities in the new environment.
  if (!previousResourceParameters) {
    const authSelectionQuestion = {
      type: 'select',
      name: 'authSelections',
      message: 'What type of auth resource do you want to import?',
      choices: [
        { name: 'Cognito User Pool and Identity Pool', value: 'identityPoolAndUserPool' },
        { name: 'Cognito User Pool only', value: 'userPoolOnly' },
      ],
      result(value: string) {
        return (this as any).focused.value;
      },
      initial: 0,
    };

    const { authSelections } = await enquirer.prompt(authSelectionQuestion as any); // any case needed because async validation TS definition is not up to date
    answers.authSelections = authSelections!;
  }

  // User Pool selection

  // If there is 1 user pool only, before preselecting we have to validate it.
  if (questionParameters.userPoolList.length === 1) {
    const validationResult = await validateUserPool(
      cognito,
      identity,
      questionParameters,
      answers,
      questionParameters.userPoolList[0].value,
    );

    if (typeof validationResult === 'string') {
      context.print.info(importMessages.OneUserPoolNotValid(questionParameters.userPoolList[0].value));
      context.print.error(validationResult);
      return;
    }

    context.print.info(importMessages.OneUserPoolValid(questionParameters.userPoolList[0].value));

    answers.userPoolId = questionParameters.userPoolList[0].value;
    answers.userPool = await cognito.getUserPoolDetails(answers.userPoolId);
  } else {
    // If multiple pools found let the customer select one
    const userPoolQuestion = {
      type: 'autocomplete',
      name: 'userPoolId',
      message: importMessages.Questions.UserPoolSelection,
      required: true,
      choices: questionParameters.userPoolList,
      limit: 5,
      footer: importMessages.Questions.AutoCompleteFooter,
      result(value: string) {
        return (this as any).focused.value;
      },
      async validate(value: string) {
        return await validateUserPool(cognito, identity, questionParameters, answers, value);
      },
    };

    const { userPoolId } = await enquirer.prompt(userPoolQuestion as any); // any case needed because async validation TS definition is not up to date
    answers.userPoolId = userPoolId!;
    answers.userPool = await cognito.getUserPoolDetails(userPoolId!);
  }

  // We have to create a loop here, to handle OAuth configuration/misconfiguration nicely.
  // If the selected user pool has federation configured or the selected app clients are having Cognito federation enabled and
  // customer selects to import OAuth support, then selected app client settings must be matched. If the OAuth properties
  // are different we have to tell it to the customer and offer to select different app clients with matching properties.
  // NOTE: We are intentionally not matching app client properties upfront.
  let oauthLoopFinished = false;

  do {
    await selectAppClients(context, enquirer, questionParameters, answers);

    let proceedWithChecks = true;

    // Filter Identity Pool candidates further based on AppClient selection.
    if (answers.authSelections === 'identityPoolAndUserPool') {
      if (questionParameters.validatedIdentityPools && questionParameters.validatedIdentityPools!.length >= 1) {
        // No need to check to have 1 web and 1 native since prefiltering already done that check in ValidateUserPool
        questionParameters.validatedIdentityPools = questionParameters.validatedIdentityPools.filter(ipc =>
          ipc.providers.filter(p => p.ClientId === answers.appClientWebId || p.ClientId === answers.appClientNativeId),
        );
      } else {
        // There are no Identity Pool candidates print out a message and signal to skip further checks to get back into the loop.
        // This is a fail safe check as we already filtered the Identity Pools upon User Pool selection.
        context.print.error(importMessages.NoIdentityPoolsForSelectedAppClientsFound);

        // If validation failed for some reason and both app clients were auto picked then exit the loop
        // to not to get into an infinite one.
        if (questionParameters.bothAppClientsWereAutoSelected) {
          oauthLoopFinished = true;
        } else {
          context.print.info(importMessages.OAuth.SelectNewAppClients);
        }

        // reset values in answers
        answers.appClientWebId = undefined;
        answers.appClientWeb = undefined;
        answers.appClientNativeId = undefined;
        answers.appClientNative = undefined;

        // Signal to skip further checks to get back into the loop.
        proceedWithChecks = false;
      }
    }

    if (proceedWithChecks) {
      if (_.isEmpty(answers.appClientWeb?.SupportedIdentityProviders) && _.isEmpty(answers.appClientNative?.SupportedIdentityProviders)) {
        context.print.info(importMessages.NoOAuthConfigurationOnAppClients());

        oauthLoopFinished = true;
        userPoolSelectionSucceeded = true;
      } else {
        // Check OAuth config matching and enablement
        const oauthResult = await appClientsOAuthPropertiesMatching(context, answers.appClientWeb!, answers.appClientNative!);

        if (oauthResult.isValid) {
          // Store the results in the answer
          answers.oauthProviders = oauthResult.oauthProviders;
          answers.oauthProperties = oauthResult.oauthProperties;

          oauthLoopFinished = true;
          userPoolSelectionSucceeded = true;
        } else {
          // If validation failed for some reason and both app clients were auto picked then exit the loop
          // to not to get into an infinite one.
          if (questionParameters.bothAppClientsWereAutoSelected) {
            oauthLoopFinished = true;
          } else {
            context.print.info(importMessages.OAuth.SelectNewAppClients);
          }

          // If app clients are not matching then we show a message and asking if customer wants to select
          // other client applications, if not, then we exit the loop and import is aborted.

          // reset values in answers
          answers.appClientWebId = undefined;
          answers.appClientWeb = undefined;
          answers.appClientNativeId = undefined;
          answers.appClientNative = undefined;
        }
      }
    }
  } while (!oauthLoopFinished);

  // Return if the question loop was finished without successful selections.
  if (!userPoolSelectionSucceeded) {
    return;
  }

  // Select an Identity Pool if needed
  if (answers.authSelections === 'identityPoolAndUserPool') {
    if (questionParameters.validatedIdentityPools!.length === 1) {
      const identityPool = questionParameters.validatedIdentityPools![0].identityPool;

      context.print.info(importMessages.OneIdentityPoolValid(identityPool.IdentityPoolName, identityPool.IdentityPoolId));

      answers.identityPoolId = identityPool.IdentityPoolId;
      answers.identityPool = identityPool;
    } else {
      const identityPoolChoices = questionParameters
        .validatedIdentityPools!.map(ip => ({
          message: `${ip.identityPool!.IdentityPoolName} (${ip.identityPool.IdentityPoolId})`,
          value: ip.identityPool!.IdentityPoolId,
        }))
        .sort((a, b) => a.message.localeCompare(b.message));

      // If multiple Identity Pools found let the customer select one
      const identityPoolQuestion = {
        type: 'autocomplete',
        name: 'identityPoolId',
        message: importMessages.Questions.IdentityPoolSelection,
        required: true,
        choices: identityPoolChoices,
        result(value: string) {
          return (this as any).focused.value;
        },
        footer: importMessages.Questions.AutoCompleteFooter,
      };

      context.print.info(importMessages.MultipleIdentityPools);

      const { identityPoolId } = await enquirer.prompt(identityPoolQuestion as any); // any case needed because async validation TS definition is not up to date
      answers.identityPoolId = identityPoolId!;
      answers.identityPool = questionParameters.validatedIdentityPools
        ?.map(ip => ip.identityPool)
        .find(ip => ip.IdentityPoolId === identityPoolId);
    }

    // Get the auth and unauth roles assigned and all the required parameters from the selected Identity Pool.
    const { authRoleArn, authRoleName, unauthRoleArn, unauthRoleName } = await identity.getIdentityPoolRoles(answers.identityPoolId!);

    answers.authRoleArn = authRoleArn;
    answers.authRoleName = authRoleName;
    answers.unauthRoleArn = unauthRoleArn;
    answers.unauthRoleName = unauthRoleName;
  }

  if (answers.userPool.MfaConfiguration !== 'OFF') {
    // Use try catch in case if there is no MFA configuration for the user pool
    try {
      answers.mfaConfiguration = await cognito.getUserPoolMfaConfig(answers.userPoolId);
    } catch {}
  }

  if (answers.oauthProviders && answers.oauthProviders.length > 0) {
    answers.identityProviders = await cognito.listUserPoolIdentityProviders(answers.userPoolId);
  }

  // Import questions succeeded, create the create the required CLI resource state from the answers.
  const projectType: string = projectConfig.frontend;

  return {
    questionParameters,
    answers,
    projectType,
  };
};

const validateUserPool = async (
  cognito: ICognitoUserPoolService,
  identity: IIdentityPoolService,
  parameters: ImportParameters,
  answers: ImportAnswers,
  userPoolId: string,
): Promise<boolean | string> => {
  const userPoolClients = await cognito.listUserPoolClients(userPoolId);
  const webClients = userPoolClients.filter(c => !c.ClientSecret);
  const nativeClients = userPoolClients;

  // Check if the selected user pool has at least 1 web app client configured.
  if (webClients?.length < 1) {
    return importMessages.NoAtLeastOneAppClient('Web');
  }

  // If authSelections involves the selection of an Identity Pool as well then we have to look for an
  // IdentityPool that has the selected UserPool configured. This is an upfront validation for better DX
  // We can't validate until fully until AppClients are selected later.
  if (answers.authSelections === 'identityPoolAndUserPool') {
    const identityPools = await identity.listIdentityPoolDetails();

    const identityPoolCandidates = identityPools
      .filter(
        ip => ip.CognitoIdentityProviders && ip.CognitoIdentityProviders!.filter(a => a.ProviderName?.endsWith(userPoolId)).length > 0,
      )
      .map(ip => ({
        identityPool: ip,
        providers: ip.CognitoIdentityProviders!.filter(a => a.ProviderName?.endsWith(userPoolId)),
      }));

    var validatedIdentityPools: { identityPool: IdentityPool; providers: CognitoIdentityProvider[] }[] = [];

    for (const candidate of identityPoolCandidates) {
      const hasWebClientProvider =
        candidate.providers.filter(p => p.ClientId && webClients.map(c => c.ClientId).includes(p.ClientId!)).length > 0;
      const hasNativeClientProvider =
        candidate.providers.filter(p => p.ClientId && nativeClients.map(c => c.ClientId).includes(p.ClientId!)).length > 0;

      if (hasWebClientProvider && hasNativeClientProvider) {
        validatedIdentityPools.push(candidate);
      }
    }

    if (validatedIdentityPools.length === 0) {
      return importMessages.NoIdentityPoolsFoundWithSelectedUserPool;
    }

    parameters.validatedIdentityPools = validatedIdentityPools;
  }

  // Save into parameters, further quesions are using it
  if (parameters.webClients?.length === 0) {
    parameters.webClients!.push(...(webClients || []));
  }
  if (parameters.nativeClients?.length === 0) {
    parameters.nativeClients!.push(...(nativeClients || []));
  }

  return true;
};

const selectAppClients = async (
  context: $TSContext,
  enquirer: Enquirer<ImportAnswers>,
  questionParameters: ImportParameters,
  answers: ImportAnswers,
): Promise<void> => {
  let autoSelected = 0;
  let changeAppClientSelection = false;
  do {
    // Select web application clients
    if (questionParameters.webClients!.length === 1) {
      answers.appClientWeb = questionParameters.webClients![0];

      context.print.info(importMessages.SingleAppClientSelected('Web', answers.appClientWeb.ClientName!));

      autoSelected++;
    } else {
      const appClientChoices = questionParameters
        .webClients!.map(c => ({
          message: `${c.ClientName!} (${c.ClientId})`,
          value: c.ClientId,
        }))
        .sort((a, b) => a.message.localeCompare(b.message));

      const appClientSelectQuestion = {
        type: 'autocomplete',
        name: 'appClientWebId',
        message: importMessages.Questions.SelectAppClient('Web'),
        required: true,
        choices: appClientChoices,
        limit: 5,
        footer: importMessages.Questions.AutoCompleteFooter,
      };

      context.print.info(importMessages.MultipleAppClients('Web'));

      const { appClientWebId } = await enquirer.prompt(appClientSelectQuestion);
      answers.appClientWeb = questionParameters.webClients!.find(c => c.ClientId! === appClientWebId);
      answers.appClientWebId = undefined; // Only to be used by enquirer
    }

    // Select Native application client
    if (questionParameters.nativeClients!.length === 1) {
      answers.appClientNative = questionParameters.nativeClients![0];

      context.print.info(importMessages.SingleAppClientSelected('Native', answers.appClientNative.ClientName!));
      context.print.warning(importMessages.WarnAppClientReuse);
      autoSelected++;
    } else {
      const appClientChoices = questionParameters
        .nativeClients!.map(c => ({
          message: `${c.ClientName!} (${c.ClientId}) ${c.ClientSecret ? '(has app client secret)' : ''}`,
          value: c.ClientId,
        }))
        .sort((a, b) => a.message.localeCompare(b.message));

      const appClientSelectQuestion = {
        type: 'autocomplete',
        name: 'appClientNativeId',
        message: importMessages.Questions.SelectAppClient('Native'),
        required: true,
        choices: appClientChoices,
        limit: 5,
        footer: importMessages.Questions.AutoCompleteFooter,
      };

      context.print.info(importMessages.MultipleAppClients('Native'));

      const { appClientNativeId } = await enquirer.prompt(appClientSelectQuestion);
      answers.appClientNative = questionParameters.nativeClients!.find(c => c.ClientId! === appClientNativeId);
      answers.appClientNativeId = undefined; // Only to be used by enquirer

      changeAppClientSelection =
        answers.appClientNative === answers.appClientWeb
          ? await context.prompt.confirm(importMessages.ConfirmUseDifferentAppClient)
          : false;
    }
    questionParameters.bothAppClientsWereAutoSelected = autoSelected === 2;
  } while (changeAppClientSelection);
};

const appClientsOAuthPropertiesMatching = async (
  context: $TSContext,
  appClientWeb: UserPoolClientType,
  appClientNative: UserPoolClientType,
  printErrors: boolean = true,
): Promise<OAuthResult> => {
  // Here both clients having some federation configured, compare the OAuth specific properties,
  // since we can only import app clients with completely matching configuration, due
  // to how CLI and Client SDKs working now.

  // Compare the app client properties, they must match, otherwise show what is not matching. For convenience we show all the properties that are not matching,
  // not just the first mismatch.
  const callbackUrlMatching = isArraysEqual(appClientWeb.CallbackURLs!, appClientNative.CallbackURLs!);
  const logoutUrlsMatching = isArraysEqual(appClientWeb.LogoutURLs!, appClientNative.LogoutURLs!);
  const allowedOAuthFlowsMatching = isArraysEqual(appClientWeb.AllowedOAuthFlows!, appClientNative.AllowedOAuthFlows!);
  const allowedOAuthScopesMatching = isArraysEqual(appClientWeb.AllowedOAuthScopes!, appClientNative.AllowedOAuthScopes!);
  const allowedOAuthFlowsUserPoolClientMatching =
    appClientWeb.AllowedOAuthFlowsUserPoolClient === appClientNative.AllowedOAuthFlowsUserPoolClient;
  const supportedIdentityProvidersMatching = isArraysEqual(
    appClientWeb.SupportedIdentityProviders!,
    appClientNative.SupportedIdentityProviders!,
  );
  let propertiesMatching =
    supportedIdentityProvidersMatching &&
    callbackUrlMatching &&
    logoutUrlsMatching &&
    allowedOAuthFlowsMatching &&
    allowedOAuthScopesMatching &&
    allowedOAuthFlowsUserPoolClientMatching;

  // If we are in silent mode, just return without showing errors and differences
  if (!propertiesMatching && !printErrors) {
    return {
      isValid: false,
    };
  }

  if (!propertiesMatching) {
    context.print.error(importMessages.OAuth.SomePropertiesAreNotMatching);
    context.print.info('');

    if (!supportedIdentityProvidersMatching) {
      showValidationTable(
        context,
        importMessages.OAuth.ConfiguredIdentityProviders,
        appClientWeb,
        appClientNative,
        appClientWeb.SupportedIdentityProviders,
        appClientNative.SupportedIdentityProviders,
      );
    }

    if (!allowedOAuthFlowsUserPoolClientMatching) {
      showValidationTable(
        context,
        importMessages.OAuth.OAuthFlowEnabledForApplicationClient,
        appClientWeb,
        appClientNative,
        [appClientWeb.AllowedOAuthFlowsUserPoolClient?.toString() || ''],
        [appClientNative.AllowedOAuthFlowsUserPoolClient?.toString() || ''],
      );
    }

    if (!callbackUrlMatching) {
      showValidationTable(
        context,
        importMessages.OAuth.CallbackURLs,
        appClientWeb,
        appClientNative,
        appClientWeb.CallbackURLs,
        appClientNative.CallbackURLs,
      );
    }

    if (!logoutUrlsMatching) {
      showValidationTable(
        context,
        importMessages.OAuth.LogoutURLs,
        appClientWeb,
        appClientNative,
        appClientWeb.LogoutURLs,
        appClientNative.LogoutURLs,
      );
    }

    if (!allowedOAuthFlowsMatching) {
      showValidationTable(
        context,
        importMessages.OAuth.AllowedOAuthFlows,
        appClientWeb,
        appClientNative,
        appClientWeb.AllowedOAuthFlows,
        appClientNative.AllowedOAuthFlows,
      );
    }

    if (!allowedOAuthScopesMatching) {
      showValidationTable(
        context,
        importMessages.OAuth.AllowedOAuthScopes,
        appClientWeb,
        appClientNative,
        appClientWeb.AllowedOAuthScopes,
        appClientNative.AllowedOAuthScopes,
      );
    }

    return {
      isValid: false,
    };
  }

  // Don't return any OAuth properties if no OAuth providers were selected
  if (!appClientWeb.SupportedIdentityProviders || appClientWeb.SupportedIdentityProviders.length === 0) {
    return {
      isValid: true,
    };
  }

  const filteredProviders = appClientWeb.SupportedIdentityProviders!.filter(p => supportedIdentityProviders.includes(p));

  return {
    isValid: true,
    oauthProviders: filteredProviders || [],
    oauthProperties: {
      callbackURLs: appClientWeb.CallbackURLs,
      logoutURLs: appClientWeb.LogoutURLs,
      allowedOAuthFlows: appClientWeb.AllowedOAuthFlows,
      allowedOAuthScopes: appClientWeb.AllowedOAuthScopes,
      allowedOAuthFlowsUserPoolClient: appClientWeb.AllowedOAuthFlowsUserPoolClient,
    },
  };
};

const showValidationTable = (
  context: $TSContext,
  title: string,
  appClientWeb: UserPoolClientType,
  appClientNative: UserPoolClientType,
  webValues: string[] | undefined,
  nativeValues: string[] | undefined,
) => {
  const tableOptions = [[appClientWeb.ClientName!, appClientNative.ClientName!]];
  const webNames = [...(webValues || [])].sort();
  const nativeNames = [...(nativeValues || [])].sort();
  const rowsDiff = Math.abs(webNames.length - nativeNames.length);

  if (webNames.length < nativeNames.length) {
    webNames.push(..._.times(rowsDiff, () => ''));
  } else if (webNames.length > nativeNames.length) {
    nativeNames.push(..._.times(rowsDiff, () => ''));
  }

  // At this point both arrays are the same size
  for (let i = 0; i < webNames.length; i++) {
    tableOptions.push([webNames[i], nativeNames[i]]);
  }

  context.print.info(title);
  context.print.info('');
  context.print.table(tableOptions, { format: 'markdown' });
  context.print.info('');
};

const isArraysEqual = (left: string[], right: string[]): boolean => {
  const sortedLeft = [...(left || [])].sort();
  const sortedRight = [...(right || [])].sort();

  return _.isEqual(sortedLeft, sortedRight);
};

const updateStateFiles = async (
  context: $TSContext,
  questionParameters: ImportParameters,
  answers: ImportAnswers,
  projectType: string | undefined,
  updateEnvSpecificParameters: boolean,
): Promise<{
  backendConfiguration: BackendConfiguration;
  resourceParameters: ResourceParameters;
  metaConfiguration: MetaConfiguration;
  envSpecificParameters: EnvSpecificResourceParameters;
}> => {
  const backendConfiguration: BackendConfiguration = {
    service: 'Cognito',
    serviceType: 'imported',
    providerPlugin: questionParameters.providerName,
    dependsOn: [],
    customAuth: isCustomAuthConfigured(answers.userPool!),
  };

  const hasOAuthConfig =
    !!answers.oauthProviders &&
    answers.oauthProviders.length > 0 &&
    !!answers.oauthProperties &&
    !!answers.oauthProperties.allowedOAuthFlows &&
    answers.oauthProperties.allowedOAuthFlows.length > 0 &&
    !!answers.oauthProperties.allowedOAuthScopes &&
    answers.oauthProperties.allowedOAuthScopes.length > 0 &&
    !!answers.oauthProperties.callbackURLs &&
    answers.oauthProperties.callbackURLs.length > 0 &&
    !!answers.oauthProperties.logoutURLs &&
    answers.oauthProperties.logoutURLs.length > 0;

  // Create and persist parameters
  const resourceParameters: ResourceParameters = {
    authSelections: answers.authSelections!,
    resourceName: answers.resourceName!,
    serviceType: 'imported',
    region: questionParameters.region!,
  };

  const authResourceParameters: AuthParameters = {
    aliasAttributes: answers.userPool?.AliasAttributes,
    usernameAttributes: answers.userPool?.UsernameAttributes,
    authProvidersUserPool: answers.oauthProviders?.filter(provider => !!hostedUIProviders.find(it => it.value === provider)),
    requiredAttributes: (answers.userPool?.SchemaAttributes ?? [])
      .filter(att => att.Required && !!coreAttributes.find(it => it.value === att.Name))
      .map(att => att.Name!),
    passwordPolicyMinLength: answers.userPool?.Policies?.PasswordPolicy?.MinimumLength ?? 8,
    passwordPolicyCharacters: [
      ...(answers.userPool?.Policies?.PasswordPolicy?.RequireLowercase ? ['Requires Lowercase'] : []),
      ...(answers.userPool?.Policies?.PasswordPolicy?.RequireUppercase ? ['Requires Uppercase'] : []),
      ...(answers.userPool?.Policies?.PasswordPolicy?.RequireNumbers ? ['Requires Numbers'] : []),
      ...(answers.userPool?.Policies?.PasswordPolicy?.RequireSymbols ? ['Requires Symbols'] : []),
    ],
    mfaConfiguration: answers.userPool?.MfaConfiguration,
    autoVerifiedAttributes: answers.userPool?.AutoVerifiedAttributes,
    mfaTypes: [
      ...(answers.mfaConfiguration?.SmsMfaConfiguration ? ['SMS Text Message'] : []),
      ...(answers.mfaConfiguration?.SoftwareTokenMfaConfiguration ? ['TOTP'] : []),
    ],
  };

  stateManager.setResourceParametersJson(undefined, 'auth', answers.resourceName!, { ...resourceParameters, ...authResourceParameters });

  // Add resource data to amplify-meta file and backend-config, since backend-config requires less information
  // we have to do a separate update to it without duplicating the methods
  const metaConfiguration = _.clone(backendConfiguration) as MetaConfiguration;
  metaConfiguration.output = createMetaOutput(answers, hasOAuthConfig);

  context.amplify.updateamplifyMetaAfterResourceAdd('auth', answers.resourceName!, metaConfiguration, backendConfiguration, true);

  // Update team provider-info
  const envSpecificParameters: EnvSpecificResourceParameters = createEnvSpecificResourceParameters(answers, hasOAuthConfig, projectType);

  if (updateEnvSpecificParameters) {
    context.amplify.saveEnvResourceParameters(context, 'auth', answers.resourceName!, envSpecificParameters);
  }

  return {
    backendConfiguration,
    resourceParameters,
    metaConfiguration,
    envSpecificParameters,
  };
};

const createMetaOutput = (answers: ImportAnswers, hasOAuthConfig: boolean): MetaOutput => {
  const userPool = answers.userPool!;

  const output: MetaOutput = {
    UserPoolId: userPool.Id!,
    UserPoolName: userPool.Name!,
    AppClientID: answers.appClientNative!.ClientId,
    ...(answers.appClientNative!.ClientSecret ? { AppClientSecret: answers.appClientNative!.ClientSecret } : {}),
    AppClientIDWeb: answers.appClientWeb!.ClientId,
    HostedUIDomain: userPool.Domain,
  };

  if (answers.authSelections === 'identityPoolAndUserPool') {
    output.IdentityPoolId = answers.identityPoolId!;
    output.IdentityPoolName = answers.identityPool?.IdentityPoolName;

    if (answers.identityPool!.SupportedLoginProviders) {
      for (const key of Object.keys(answers.identityPool!.SupportedLoginProviders || {})) {
        switch (key) {
          case 'www.amazon.com':
            output.AmazonWebClient = answers.identityPool!.SupportedLoginProviders![key];
            break;
          case 'graph.facebook.com':
            output.FacebookWebClient = answers.identityPool!.SupportedLoginProviders![key];
            break;
          case 'accounts.google.com':
            output.GoogleWebClient = answers.identityPool!.SupportedLoginProviders![key];
            break;
          case 'appleid.apple.com':
            output.AppleWebClient = answers.identityPool!.SupportedLoginProviders![key];
            break;
          default:
            // We don't do anything with the providers that the CLI currently does not support.
            break;
        }
      }
    }
  }

  // SNS Role if there is SMS configuration on the user pool, use the separate MFA configuration object
  // not the one on the userPool itself
  if (userPool.MfaConfiguration !== 'OFF' && answers.mfaConfiguration?.SmsMfaConfiguration?.SmsConfiguration) {
    output.CreatedSNSRole = answers.mfaConfiguration.SmsMfaConfiguration.SmsConfiguration?.SnsCallerArn;
  }

  // Create OAuth configuration only if there are selected providers to import
  if (hasOAuthConfig) {
    const oauthMetadata = {
      AllowedOAuthFlows: answers.oauthProperties!.allowedOAuthFlows,
      AllowedOAuthScopes: answers.oauthProperties!.allowedOAuthScopes,
      CallbackURLs: answers.oauthProperties!.callbackURLs,
      LogoutURLs: answers.oauthProperties!.logoutURLs,
    };

    output.OAuthMetadata = JSON.stringify(oauthMetadata);
  }

  return output;
};

const createEnvSpecificResourceParameters = (
  answers: ImportAnswers,
  hasOAuthConfig: boolean,
  projectType: string | undefined,
): EnvSpecificResourceParameters => {
  const userPool = answers.userPool!;

  const envSpecificResourceParameters: EnvSpecificResourceParameters = {
    userPoolId: userPool.Id!,
    userPoolName: userPool.Name!,
    webClientId: answers.appClientWeb!.ClientId!,
    nativeClientId: answers.appClientNative!.ClientId!,
    identityPoolId: answers.identityPoolId,
    identityPoolName: answers.identityPool?.IdentityPoolName,
    allowUnauthenticatedIdentities: answers.identityPool?.AllowUnauthenticatedIdentities,
    authRoleArn: answers.authRoleArn,
    authRoleName: answers.authRoleName,
    unauthRoleArn: answers.unauthRoleArn,
    unauthRoleName: answers.unauthRoleName,
  };

  if (hasOAuthConfig) {
    envSpecificResourceParameters.hostedUIProviderCreds = createOAuthCredentials(answers.identityProviders!);
  }

  if (answers.authSelections === 'identityPoolAndUserPool' && answers.identityPool!.SupportedLoginProviders) {
    for (const key of Object.keys(answers.identityPool!.SupportedLoginProviders || {})) {
      switch (key) {
        case 'www.amazon.com':
          envSpecificResourceParameters.amazonAppId = answers.identityPool!.SupportedLoginProviders![key];
          break;
        case 'graph.facebook.com':
          envSpecificResourceParameters.facebookAppId = answers.identityPool!.SupportedLoginProviders![key];
          break;
        case 'appleid.apple.com':
          envSpecificResourceParameters.appleAppId = answers.identityPool!.SupportedLoginProviders![key];
          break;
        case 'accounts.google.com': {
          switch (projectType) {
            case 'javascript':
              envSpecificResourceParameters.googleClientId = answers.identityPool!.SupportedLoginProviders![key];
              break;
            case 'ios':
              envSpecificResourceParameters.googleIos = answers.identityPool!.SupportedLoginProviders![key];
              break;
            case 'android':
              envSpecificResourceParameters.googleAndroid = answers.identityPool!.SupportedLoginProviders![key];
              break;
          }
          break;
        }
        default:
          // We don't do anything with the providers that the CLI currently does not support.
          break;
      }
    }
  }

  return envSpecificResourceParameters;
};

const createOAuthCredentials = (identityProviders: IdentityProviderType[]): string => {
  const credentials = identityProviders.map(idp => {
    if (idp.ProviderName === 'SignInWithApple') {
      return {
        ProviderName: idp.ProviderName!,
        client_id: idp.ProviderDetails!.client_id,
        team_id: idp.ProviderDetails!.team_id,
        key_id: idp.ProviderDetails!.key_id,
        private_key: idp.ProviderDetails!.private_key,
      };
    } else {
      return {
        ProviderName: idp.ProviderName!,
        client_id: idp.ProviderDetails!.client_id,
        client_secret: idp.ProviderDetails!.client_secret,
      };
    }
  });

  return JSON.stringify(credentials);
};

const createParameters = (providerName: string, userPoolList: UserPoolDescriptionType[]): ImportParameters => {
  const questionParameters: ImportParameters = {
    providerName,
    userPoolList: userPoolList
      .map(up => ({
        message: `${up.Name} (${up.Id})`,
        value: up.Id!,
      }))
      .sort((a, b) => a.message.localeCompare(b.message)),
    webClients: [],
    nativeClients: [],
  };

  return questionParameters;
};

const isCustomAuthConfigured = (userPool: UserPoolType): boolean => {
  const customAuthConfigured =
    !!userPool &&
    !!userPool.LambdaConfig &&
    !!userPool.LambdaConfig.DefineAuthChallenge &&
    userPool.LambdaConfig.DefineAuthChallenge.length > 0 &&
    !!userPool.LambdaConfig.CreateAuthChallenge &&
    userPool.LambdaConfig.CreateAuthChallenge.length > 0 &&
    !!userPool.LambdaConfig.VerifyAuthChallengeResponse &&
    userPool.LambdaConfig.VerifyAuthChallengeResponse.length > 0;

  return customAuthConfigured;
};

export const importedAuthEnvInit = async (
  context: $TSContext,
  resourceName: string,
  resource: MetaConfiguration,
  resourceParameters: ResourceParameters,
  providerName: string,
  providerUtils: ProviderUtils,
  currentEnvSpecificParameters: EnvSpecificResourceParameters,
  isInHeadlessMode: boolean,
  headlessParams: ImportAuthHeadlessParameters,
): Promise<{ doServiceWalkthrough?: boolean; succeeded?: boolean; envSpecificParameters?: EnvSpecificResourceParameters }> => {
  const cognito = await providerUtils.createCognitoUserPoolService(context);
  const identity = await providerUtils.createIdentityPoolService(context);
  const amplifyMeta = stateManager.getMeta();
  const { Region } = amplifyMeta.providers[providerName];
  const projectConfig = context.amplify.getProjectConfig();
  const isPulling = context.input.command === 'pull' || (context.input.command === 'env' && context.input.subCommands[0] === 'pull');
  const isEnvAdd = context.input.command === 'env' && context.input.subCommands[0] === 'add';

  if (isInHeadlessMode) {
    // Validate required parameters' presence and merge into parameters
    return await headlessImport(context, cognito, identity, providerName, resourceName, resourceParameters, headlessParams);
  }

  // If region mismatch, signal prompt for new arguments, only in interactive mode, headless does not matter
  if (resourceParameters.region !== Region) {
    context.print.warning(importMessages.NewEnvDifferentRegion(resourceName, resourceParameters.region, Region));

    return {
      doServiceWalkthrough: true,
    };
  }

  // If we are pulling, take the current values if present to skip unneeded service walkthrough
  if (isPulling) {
    const currentMeta = stateManager.getCurrentMeta(undefined, {
      throwIfNotExist: false,
    });

    if (currentMeta) {
      const currentResource = _.get(currentMeta, ['auth', resourceName], undefined);

      if (currentResource && currentResource.output) {
        const { UserPoolId, AppClientIDWeb, AppClientID, IdentityPoolId } = currentResource.output;

        currentEnvSpecificParameters.userPoolId = UserPoolId;
        currentEnvSpecificParameters.webClientId = AppClientIDWeb;
        currentEnvSpecificParameters.nativeClientId = AppClientID;

        if (resourceParameters.authSelections === 'identityPoolAndUserPool') {
          currentEnvSpecificParameters.identityPoolId = IdentityPoolId;
        }
      }
    }
  } else if (isEnvAdd && context.exeInfo.sourceEnvName) {
    // Check to see if we have a source environment set (in case of env add), and ask customer if the want to import the same resource
    // from the existing environment or import a different one. Check if all the values are having some value that can be validated and
    // if not fall back to full service walkthrough.
    const sourceEnvParams = getSourceEnvParameters(context.exeInfo.sourceEnvName, 'auth', resourceName);

    if (sourceEnvParams) {
      const { importExisting } = await Enquirer.prompt<{ importExisting: boolean }>({
        name: 'importExisting',
        type: 'confirm',
        message: importMessages.Questions.ImportPreviousResource(resourceName, sourceEnvParams.userPoolId, context.exeInfo.sourceEnvName),
        footer: importMessages.ImportPreviousResourceFooter,
        initial: true,
        format: (e: any) => (e ? 'Yes' : 'No'),
      } as any);

      if (!importExisting) {
        return {
          doServiceWalkthrough: true,
        };
      }

      // Copy over the required input arguments to currentEnvSpecificParameters
      currentEnvSpecificParameters.userPoolId = sourceEnvParams.userPoolId;
      currentEnvSpecificParameters.webClientId = sourceEnvParams.webClientId;
      currentEnvSpecificParameters.nativeClientId = sourceEnvParams.nativeClientId;

      if (resourceParameters.authSelections === 'identityPoolAndUserPool') {
        currentEnvSpecificParameters.identityPoolId = sourceEnvParams.identityPoolId;
      }
    }
  }

  // If there are no current parameters a service walkthrough is required, it can happen when pulling to an empty directory.
  if (
    !(
      currentEnvSpecificParameters.userPoolId &&
      currentEnvSpecificParameters.webClientId &&
      currentEnvSpecificParameters.nativeClientId &&
      (resourceParameters.authSelections === 'userPoolOnly' ||
        (resourceParameters.authSelections === 'identityPoolAndUserPool' && currentEnvSpecificParameters.identityPoolId))
    )
  ) {
    context.print.info(importMessages.ImportNewResourceRequired(resourceName));

    return {
      doServiceWalkthrough: true,
    };
  }

  // Validate the parameters, generate the missing ones and import the resource.
  const questionParameters: ImportParameters = {
    providerName,
    userPoolList: [],
    webClients: [],
    nativeClients: [],
    region: Region,
  };

  const answers: ImportAnswers = {
    authSelections: resourceParameters.authSelections,
    resourceName: resourceParameters.resourceName,
    userPoolId: currentEnvSpecificParameters.userPoolId,
  };

  try {
    answers.userPool = await cognito.getUserPoolDetails(currentEnvSpecificParameters.userPoolId);
  } catch (error) {
    if (error.name === 'ResourceNotFoundException') {
      context.print.error(
        importMessages.UserPoolNotFound(currentEnvSpecificParameters.userPoolName, currentEnvSpecificParameters.userPoolId),
      );

      error.stack = undefined;
    }

    throw error;
  }

  const validationResult = await validateUserPool(cognito, identity, questionParameters, answers, currentEnvSpecificParameters.userPoolId);

  if (typeof validationResult === 'string') {
    context.print.info(
      importMessages.UserPoolValidation(currentEnvSpecificParameters.userPoolName, currentEnvSpecificParameters.userPoolId),
    );
    context.print.error(validationResult);

    return {
      succeeded: false,
    };
  }

  // Get app clients based on passed in previous values
  answers.appClientWeb = questionParameters.webClients!.find(c => c.ClientId! === currentEnvSpecificParameters.webClientId);

  if (!answers.appClientWeb) {
    context.print.error(importMessages.AppClientNotFound('Web', currentEnvSpecificParameters.webClientId));

    return {
      succeeded: false,
    };
  }

  answers.appClientNative = questionParameters.nativeClients!.find(c => c.ClientId! === currentEnvSpecificParameters.nativeClientId);

  if (!answers.appClientNative) {
    context.print.error(importMessages.AppClientNotFound('Native', currentEnvSpecificParameters.nativeClientId));

    return {
      succeeded: false,
    };
  }

  // Check OAuth config matching and enablement
  const oauthResult = await appClientsOAuthPropertiesMatching(context, answers.appClientWeb!, answers.appClientNative!);

  if (!oauthResult.isValid) {
    return {
      succeeded: false,
    };
  }

  // Store the results in the answer
  answers.oauthProviders = oauthResult.oauthProviders;
  answers.oauthProperties = oauthResult.oauthProperties;

  if (answers.oauthProviders && answers.oauthProviders.length > 0) {
    answers.identityProviders = await cognito.listUserPoolIdentityProviders(answers.userPoolId!);
  }

  if (resourceParameters.authSelections === 'identityPoolAndUserPool') {
    const identityPools = questionParameters.validatedIdentityPools!.filter(
      idp => idp.identityPool.IdentityPoolId === currentEnvSpecificParameters.identityPoolId,
    );

    if (identityPools.length !== 1) {
      context.print.info(
        importMessages.IdentityPoolNotFound(currentEnvSpecificParameters.identityPoolName!, currentEnvSpecificParameters.identityPoolId!),
      );

      return {
        succeeded: false,
      };
    }

    answers.identityPoolId = identityPools[0].identityPool.IdentityPoolId;
    answers.identityPool = identityPools[0].identityPool;
    answers.identityProviders = identityPools[0].providers;

    // Get the auth and unauth roles assigned and all the required parameters from the selected Identity Pool.
    const { authRoleArn, authRoleName, unauthRoleArn, unauthRoleName } = await identity.getIdentityPoolRoles(answers.identityPoolId!);

    answers.authRoleArn = authRoleArn;
    answers.authRoleName = authRoleName;
    answers.unauthRoleArn = unauthRoleArn;
    answers.unauthRoleName = unauthRoleName;
  }

  if (answers.userPool.MfaConfiguration !== 'OFF') {
    // Use try catch in case if there is no MFA configuration for the user pool
    try {
      answers.mfaConfiguration = await cognito.getUserPoolMfaConfig(answers.userPoolId!);
    } catch {}
  }

  if (answers.oauthProviders && answers.oauthProviders.length > 0) {
    answers.identityProviders = await cognito.listUserPoolIdentityProviders(answers.userPoolId!);
  }

  // Import questions succeeded, create the create the required CLI resource state from the answers.
  const projectType: string = projectConfig.frontend;

  const newState = await updateStateFiles(context, questionParameters, answers, projectType, false);

  return {
    succeeded: true,
    envSpecificParameters: newState.envSpecificParameters,
  };
};

export const headlessImport = async (
  context: $TSContext,
  cognito: ICognitoUserPoolService,
  identity: IIdentityPoolService,
  providerName: string,
  resourceName: string,
  resourceParameters: ResourceParameters,
  headlessParams: ImportAuthHeadlessParameters,
): Promise<{ succeeded: boolean; envSpecificParameters: EnvSpecificResourceParameters }> => {
  // Validate required parameters' presence and merge into parameters
  const currentEnvSpecificParameters = ensureHeadlessParameters(resourceParameters, headlessParams);

  const amplifyMeta = stateManager.getMeta();
  const { Region } = amplifyMeta.providers[providerName];
  const projectConfig = context.amplify.getProjectConfig();

  // If region mismatch, signal prompt for new arguments, only in interactive mode, headless does not matter
  if (resourceParameters.region && resourceParameters.region !== Region) {
    throw new Error(importMessages.NewEnvDifferentRegion(resourceName, resourceParameters.region, Region));
  }

  // Validate the parameters, generate the missing ones and import the resource.
  const questionParameters: ImportParameters = {
    providerName,
    userPoolList: [],
    webClients: [],
    nativeClients: [],
    region: Region,
  };

  const answers: ImportAnswers = {
    authSelections: resourceParameters.authSelections,
    resourceName: resourceParameters.resourceName,
    userPoolId: currentEnvSpecificParameters.userPoolId,
  };

  try {
    answers.userPool = await cognito.getUserPoolDetails(currentEnvSpecificParameters.userPoolId);
  } catch (error) {
    if (error.name === 'ResourceNotFoundException') {
      throw new Error(importMessages.UserPoolNotFound(currentEnvSpecificParameters.userPoolName, currentEnvSpecificParameters.userPoolId));
    }

    throw error;
  }

  const validationResult = await validateUserPool(cognito, identity, questionParameters, answers, currentEnvSpecificParameters.userPoolId);

  if (typeof validationResult === 'string') {
    throw new Error(validationResult);
  }

  // Get app clients based on passed in previous values
  answers.appClientWeb = questionParameters.webClients!.find(c => c.ClientId! === currentEnvSpecificParameters.webClientId);

  if (!answers.appClientWeb) {
    throw new Error(importMessages.AppClientNotFound('Web', currentEnvSpecificParameters.webClientId));
  }

  answers.appClientNative = questionParameters.nativeClients!.find(c => c.ClientId! === currentEnvSpecificParameters.nativeClientId);

  if (!answers.appClientNative) {
    throw new Error(importMessages.AppClientNotFound('Native', currentEnvSpecificParameters.nativeClientId));
  }

  // Check OAuth config matching and enablement
  const oauthResult = await appClientsOAuthPropertiesMatching(context, answers.appClientWeb!, answers.appClientNative!, false);

  if (!oauthResult.isValid) {
    throw new Error(importMessages.OAuth.PropertiesAreNotMatching);
  }

  // Store the results in the answer
  answers.oauthProviders = oauthResult.oauthProviders;
  answers.oauthProperties = oauthResult.oauthProperties;

  if (answers.oauthProviders && answers.oauthProviders.length > 0) {
    answers.identityProviders = await cognito.listUserPoolIdentityProviders(answers.userPoolId!);
  }

  if (resourceParameters.authSelections === 'identityPoolAndUserPool') {
    const identityPools = questionParameters.validatedIdentityPools!.filter(
      idp => idp.identityPool.IdentityPoolId === currentEnvSpecificParameters.identityPoolId,
    );

    if (identityPools.length !== 1) {
      throw new Error(
        importMessages.IdentityPoolNotFound(currentEnvSpecificParameters.identityPoolName!, currentEnvSpecificParameters.identityPoolId!),
      );
    }

    answers.identityPoolId = identityPools[0].identityPool.IdentityPoolId;
    answers.identityPool = identityPools[0].identityPool;
    answers.identityProviders = identityPools[0].providers;

    // Get the auth and unauth roles assigned and all the required parameters from the selected Identity Pool.
    const { authRoleArn, authRoleName, unauthRoleArn, unauthRoleName } = await identity.getIdentityPoolRoles(answers.identityPoolId!);

    answers.authRoleArn = authRoleArn;
    answers.authRoleName = authRoleName;
    answers.unauthRoleArn = unauthRoleArn;
    answers.unauthRoleName = unauthRoleName;
  }

  if (answers.userPool.MfaConfiguration !== 'OFF') {
    // Use try catch in case if there is no MFA configuration for the user pool
    try {
      answers.mfaConfiguration = await cognito.getUserPoolMfaConfig(answers.userPoolId!);
    } catch {}
  }

  if (answers.oauthProviders && answers.oauthProviders.length > 0) {
    answers.identityProviders = await cognito.listUserPoolIdentityProviders(answers.userPoolId!);
  }

  // Import questions succeeded, create the create the required CLI resource state from the answers.
  const projectType: string = projectConfig.frontend;

  const newState = await updateStateFiles(context, questionParameters, answers, projectType, true);

  return {
    succeeded: true,
    envSpecificParameters: newState.envSpecificParameters,
  };
};

const ensureHeadlessParameters = (
  resourceParameters: ResourceParameters,
  headlessParams: ImportAuthHeadlessParameters,
): EnvSpecificResourceParameters => {
  // If we are doing headless mode, validate parameter presence and overwrite the input values from env specific params since they can be
  // different for the current env operation (eg region can mismatch)

  // Validate required arguments to be present
  const missingParams = [];

  if (!headlessParams.userPoolId) {
    missingParams.push('userPoolId');
  }

  if (!headlessParams.webClientId) {
    missingParams.push('webClientId');
  }

  if (!headlessParams.nativeClientId) {
    missingParams.push('nativeClientId');
  }

  if (resourceParameters.authSelections === 'identityPoolAndUserPool' && !headlessParams.identityPoolId) {
    missingParams.push('identityPoolId');
  }

  if (missingParams.length > 0) {
    throw new Error(`auth headless is missing the following inputParams ${missingParams.join(', ')}`);
  }

  const envSpecificParameters: EnvSpecificResourceParameters = {
    userPoolId: headlessParams.userPoolId,
    userPoolName: '', // Will be filled out later
    webClientId: headlessParams.webClientId,
    nativeClientId: headlessParams.nativeClientId,
  };

  if (resourceParameters.authSelections === 'identityPoolAndUserPool') {
    envSpecificParameters.identityPoolId = headlessParams.identityPoolId;
  }

  return envSpecificParameters;
};

const getSourceEnvParameters = (envName: string, categoryName: string, resourceName: string): EnvSpecificResourceParameters | undefined => {
  const teamProviderInfo = stateManager.getTeamProviderInfo(undefined, {
    throwIfNotExist: false,
  });

  if (teamProviderInfo) {
    const envParameters = _.get(teamProviderInfo, [envName, 'categories', categoryName, resourceName], undefined);

    return envParameters;
  }

  return undefined;
};
