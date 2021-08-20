'use strict';
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.headlessImport = exports.importedAuthEnvInit = exports.importResource = void 0;
const amplify_cli_core_1 = require('amplify-cli-core');
const enquirer_1 = __importDefault(require('enquirer'));
const lodash_1 = __importDefault(require('lodash'));
const messages_1 = require('./messages');
const uuid_1 = __importDefault(require('uuid'));
const supportedIdentityProviders = ['COGNITO', 'Facebook', 'Google', 'LoginWithAmazon', 'SignInWithApple'];
const importResource = async (
  context,
  serviceSelection,
  previousResourceParameters,
  providerPluginInstance,
  printSuccessMessage = true,
) => {
  const providerPlugin = providerPluginInstance || require(serviceSelection.provider);
  const providerUtils = providerPlugin;
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
  const persistEnvParameters = !previousResourceParameters;
  const { envSpecificParameters } = await updateStateFiles(context, questionParameters, answers, projectType, persistEnvParameters);
  if (printSuccessMessage) {
    printSuccess(context, answers.authSelections, answers.userPool, answers.identityPool);
  }
  return {
    envSpecificParameters,
  };
};
exports.importResource = importResource;
const printSuccess = (context, authSelections, userPool, identityPool) => {
  context.print.info('');
  if (authSelections === 'userPoolOnly') {
    context.print.info(messages_1.importMessages.UserPoolOnlySuccess(userPool.Name));
  } else {
    context.print.info(messages_1.importMessages.UserPoolAndIdentityPoolSuccess(userPool.Name, identityPool.IdentityPoolName));
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
const importServiceWalkthrough = async (context, providerName, providerUtils, previousResourceParameters) => {
  var _a, _b, _c;
  const cognito = await providerUtils.createCognitoUserPoolService(context);
  const identity = await providerUtils.createIdentityPoolService(context);
  const amplifyMeta = amplify_cli_core_1.stateManager.getMeta();
  const { Region } = amplifyMeta.providers[providerName];
  const userPoolList = await cognito.listUserPools();
  if (lodash_1.default.isEmpty(userPoolList)) {
    context.print.info(messages_1.importMessages.NoUserPoolsInRegion(Region));
    return;
  }
  const questionParameters = createParameters(providerName, userPoolList);
  questionParameters.region = Region;
  const projectConfig = context.amplify.getProjectConfig();
  const [shortId] = uuid_1.default().split('-');
  const projectName = projectConfig.projectName.toLowerCase().replace(/[^A-Za-z0-9_]+/g, '_');
  const defaultAnswers = {
    authSelections:
      (previousResourceParameters === null || previousResourceParameters === void 0 ? void 0 : previousResourceParameters.authSelections) ||
      'userPoolOnly',
    resourceName:
      (previousResourceParameters === null || previousResourceParameters === void 0 ? void 0 : previousResourceParameters.resourceName) ||
      `${projectName}${shortId}`,
  };
  const answers = { ...defaultAnswers };
  let userPoolSelectionSucceeded = false;
  const enquirer = new enquirer_1.default(undefined, defaultAnswers);
  if (!previousResourceParameters) {
    const authSelectionQuestion = {
      type: 'select',
      name: 'authSelections',
      message: 'What type of auth resource do you want to import?',
      choices: [
        { name: 'Cognito User Pool and Identity Pool', value: 'identityPoolAndUserPool' },
        { name: 'Cognito User Pool only', value: 'userPoolOnly' },
      ],
      result(value) {
        return this.focused.value;
      },
      initial: 0,
    };
    const { authSelections } = await enquirer.prompt(authSelectionQuestion);
    answers.authSelections = authSelections;
  }
  if (questionParameters.userPoolList.length === 1) {
    const validationResult = await validateUserPool(
      cognito,
      identity,
      questionParameters,
      answers,
      questionParameters.userPoolList[0].value,
    );
    if (typeof validationResult === 'string') {
      context.print.info(messages_1.importMessages.OneUserPoolNotValid(questionParameters.userPoolList[0].value));
      context.print.error(validationResult);
      return;
    }
    context.print.info(messages_1.importMessages.OneUserPoolValid(questionParameters.userPoolList[0].value));
    answers.userPoolId = questionParameters.userPoolList[0].value;
    answers.userPool = await cognito.getUserPoolDetails(answers.userPoolId);
  } else {
    const userPoolQuestion = {
      type: 'autocomplete',
      name: 'userPoolId',
      message: messages_1.importMessages.Questions.UserPoolSelection,
      required: true,
      choices: questionParameters.userPoolList,
      limit: 5,
      footer: messages_1.importMessages.Questions.AutoCompleteFooter,
      result(value) {
        return this.focused.value;
      },
      async validate(value) {
        return await validateUserPool(cognito, identity, questionParameters, answers, value);
      },
    };
    const { userPoolId } = await enquirer.prompt(userPoolQuestion);
    answers.userPoolId = userPoolId;
    answers.userPool = await cognito.getUserPoolDetails(userPoolId);
  }
  let oauthLoopFinished = false;
  do {
    await selectAppClients(context, enquirer, questionParameters, answers);
    let proceedWithChecks = true;
    if (answers.authSelections === 'identityPoolAndUserPool') {
      if (questionParameters.validatedIdentityPools && questionParameters.validatedIdentityPools.length >= 1) {
        questionParameters.validatedIdentityPools = questionParameters.validatedIdentityPools.filter(ipc =>
          ipc.providers.filter(p => p.ClientId === answers.appClientWebId || p.ClientId === answers.appClientNativeId),
        );
      } else {
        context.print.error(messages_1.importMessages.NoIdentityPoolsForSelectedAppClientsFound);
        if (questionParameters.bothAppClientsWereAutoSelected) {
          oauthLoopFinished = true;
        } else {
          context.print.info(messages_1.importMessages.OAuth.SelectNewAppClients);
        }
        answers.appClientWebId = undefined;
        answers.appClientWeb = undefined;
        answers.appClientNativeId = undefined;
        answers.appClientNative = undefined;
        proceedWithChecks = false;
      }
    }
    if (proceedWithChecks) {
      if (
        lodash_1.default.isEmpty((_a = answers.appClientWeb) === null || _a === void 0 ? void 0 : _a.SupportedIdentityProviders) &&
        lodash_1.default.isEmpty((_b = answers.appClientNative) === null || _b === void 0 ? void 0 : _b.SupportedIdentityProviders)
      ) {
        context.print.info(messages_1.importMessages.NoOAuthConfigurationOnAppClients());
        oauthLoopFinished = true;
        userPoolSelectionSucceeded = true;
      } else {
        const oauthResult = await appClientsOAuthPropertiesMatching(context, answers.appClientWeb, answers.appClientNative);
        if (oauthResult.isValid) {
          answers.oauthProviders = oauthResult.oauthProviders;
          answers.oauthProperties = oauthResult.oauthProperties;
          oauthLoopFinished = true;
          userPoolSelectionSucceeded = true;
        } else {
          if (questionParameters.bothAppClientsWereAutoSelected) {
            oauthLoopFinished = true;
          } else {
            context.print.info(messages_1.importMessages.OAuth.SelectNewAppClients);
          }
          answers.appClientWebId = undefined;
          answers.appClientWeb = undefined;
          answers.appClientNativeId = undefined;
          answers.appClientNative = undefined;
        }
      }
    }
  } while (!oauthLoopFinished);
  if (!userPoolSelectionSucceeded) {
    return;
  }
  if (answers.authSelections === 'identityPoolAndUserPool') {
    if (questionParameters.validatedIdentityPools.length === 1) {
      const identityPool = questionParameters.validatedIdentityPools[0].identityPool;
      context.print.info(messages_1.importMessages.OneIdentityPoolValid(identityPool.IdentityPoolName, identityPool.IdentityPoolId));
      answers.identityPoolId = identityPool.IdentityPoolId;
      answers.identityPool = identityPool;
    } else {
      const identityPoolChoices = questionParameters.validatedIdentityPools
        .map(ip => ({
          message: `${ip.identityPool.IdentityPoolName} (${ip.identityPool.IdentityPoolId})`,
          value: ip.identityPool.IdentityPoolId,
        }))
        .sort((a, b) => a.message.localeCompare(b.message));
      const identityPoolQuestion = {
        type: 'autocomplete',
        name: 'identityPoolId',
        message: messages_1.importMessages.Questions.IdentityPoolSelection,
        required: true,
        choices: identityPoolChoices,
        result(value) {
          return this.focused.value;
        },
        footer: messages_1.importMessages.Questions.AutoCompleteFooter,
      };
      context.print.info(messages_1.importMessages.MultipleIdentityPools);
      const { identityPoolId } = await enquirer.prompt(identityPoolQuestion);
      answers.identityPoolId = identityPoolId;
      answers.identityPool =
        (_c = questionParameters.validatedIdentityPools) === null || _c === void 0
          ? void 0
          : _c.map(ip => ip.identityPool).find(ip => ip.IdentityPoolId === identityPoolId);
    }
    const { authRoleArn, authRoleName, unauthRoleArn, unauthRoleName } = await identity.getIdentityPoolRoles(answers.identityPoolId);
    answers.authRoleArn = authRoleArn;
    answers.authRoleName = authRoleName;
    answers.unauthRoleArn = unauthRoleArn;
    answers.unauthRoleName = unauthRoleName;
  }
  if (answers.userPool.MfaConfiguration !== 'OFF') {
    try {
      answers.mfaConfiguration = await cognito.getUserPoolMfaConfig(answers.userPoolId);
    } catch (_d) {}
  }
  if (answers.oauthProviders && answers.oauthProviders.length > 0) {
    answers.identityProviders = await cognito.listUserPoolIdentityProviders(answers.userPoolId);
  }
  const projectType = projectConfig.frontend;
  return {
    questionParameters,
    answers,
    projectType,
  };
};
const validateUserPool = async (cognito, identity, parameters, answers, userPoolId) => {
  var _a, _b;
  const userPoolClients = await cognito.listUserPoolClients(userPoolId);
  const webClients = userPoolClients.filter(c => !c.ClientSecret);
  const nativeClients = userPoolClients;
  if ((webClients === null || webClients === void 0 ? void 0 : webClients.length) < 1) {
    return messages_1.importMessages.NoAtLeastOneAppClient('Web');
  }
  if (answers.authSelections === 'identityPoolAndUserPool') {
    const identityPools = await identity.listIdentityPoolDetails();
    const identityPoolCandidates = identityPools
      .filter(
        ip =>
          ip.CognitoIdentityProviders &&
          ip.CognitoIdentityProviders.filter(a => {
            var _a;
            return (_a = a.ProviderName) === null || _a === void 0 ? void 0 : _a.endsWith(userPoolId);
          }).length > 0,
      )
      .map(ip => ({
        identityPool: ip,
        providers: ip.CognitoIdentityProviders.filter(a => {
          var _a;
          return (_a = a.ProviderName) === null || _a === void 0 ? void 0 : _a.endsWith(userPoolId);
        }),
      }));
    var validatedIdentityPools = [];
    for (const candidate of identityPoolCandidates) {
      const hasWebClientProvider =
        candidate.providers.filter(p => p.ClientId && webClients.map(c => c.ClientId).includes(p.ClientId)).length > 0;
      const hasNativeClientProvider =
        candidate.providers.filter(p => p.ClientId && nativeClients.map(c => c.ClientId).includes(p.ClientId)).length > 0;
      if (hasWebClientProvider && hasNativeClientProvider) {
        validatedIdentityPools.push(candidate);
      }
    }
    if (validatedIdentityPools.length === 0) {
      return messages_1.importMessages.NoIdentityPoolsFoundWithSelectedUserPool;
    }
    parameters.validatedIdentityPools = validatedIdentityPools;
  }
  if (((_a = parameters.webClients) === null || _a === void 0 ? void 0 : _a.length) === 0) {
    parameters.webClients.push(...(webClients || []));
  }
  if (((_b = parameters.nativeClients) === null || _b === void 0 ? void 0 : _b.length) === 0) {
    parameters.nativeClients.push(...(nativeClients || []));
  }
  return true;
};
const selectAppClients = async (context, enquirer, questionParameters, answers) => {
  let autoSelected = 0;
  let changeAppClientSelction = false;
  do {
    if (questionParameters.webClients.length === 1) {
      answers.appClientWeb = questionParameters.webClients[0];
      context.print.info(messages_1.importMessages.SingleAppClientSelected('Web', answers.appClientWeb.ClientName));
      autoSelected++;
    } else {
      const appClientChoices = questionParameters.webClients
        .map(c => ({
          message: `${c.ClientName} (${c.ClientId})`,
          value: c.ClientId,
        }))
        .sort((a, b) => a.message.localeCompare(b.message));
      const appClientSelectQuestion = {
        type: 'autocomplete',
        name: 'appClientWebId',
        message: messages_1.importMessages.Questions.SelectAppClient('Web'),
        required: true,
        choices: appClientChoices,
        limit: 5,
        footer: messages_1.importMessages.Questions.AutoCompleteFooter,
      };
      context.print.info(messages_1.importMessages.MultipleAppClients('Web'));
      const { appClientWebId } = await enquirer.prompt(appClientSelectQuestion);
      answers.appClientWeb = questionParameters.webClients.find(c => c.ClientId === appClientWebId);
      answers.appClientWebId = undefined;
    }
    if (questionParameters.nativeClients.length === 1) {
      answers.appClientNative = questionParameters.nativeClients[0];
      context.print.info(messages_1.importMessages.SingleAppClientSelected('Native', answers.appClientNative.ClientName));
      context.print.warning(messages_1.importMessages.WarnAppClientReuse);
      autoSelected++;
    } else {
      const appClientChoices = questionParameters.nativeClients
        .map(c => ({
          message: `${c.ClientName} (${c.ClientId}) ${c.ClientSecret ? '(has app client secret)' : ''}`,
          value: c.ClientId,
        }))
        .sort((a, b) => a.message.localeCompare(b.message));
      const appClientSelectQuestion = {
        type: 'autocomplete',
        name: 'appClientNativeId',
        message: messages_1.importMessages.Questions.SelectAppClient('Native'),
        required: true,
        choices: appClientChoices,
        limit: 5,
        footer: messages_1.importMessages.Questions.AutoCompleteFooter,
      };
      context.print.info(messages_1.importMessages.MultipleAppClients('Native'));
      const { appClientNativeId } = await enquirer.prompt(appClientSelectQuestion);
      answers.appClientNative = questionParameters.nativeClients.find(c => c.ClientId === appClientNativeId);
      answers.appClientNativeId = undefined;
      if (answers.appClientNative === answers.appClientWeb) {
        changeAppClientSelction = await context.prompt.confirm(messages_1.importMessages.ConfirmUseDifferentAppClient);
      }
    }
    questionParameters.bothAppClientsWereAutoSelected = autoSelected === 2;
  } while (changeAppClientSelction);
};
const appClientsOAuthPropertiesMatching = async (context, appClientWeb, appClientNative, printErrors = true) => {
  var _a, _b;
  const callbackUrlMatching = isArraysEqual(appClientWeb.CallbackURLs, appClientNative.CallbackURLs);
  const logoutUrlsMatching = isArraysEqual(appClientWeb.LogoutURLs, appClientNative.LogoutURLs);
  const allowedOAuthFlowsMatching = isArraysEqual(appClientWeb.AllowedOAuthFlows, appClientNative.AllowedOAuthFlows);
  const allowedOAuthScopesMatching = isArraysEqual(appClientWeb.AllowedOAuthScopes, appClientNative.AllowedOAuthScopes);
  const allowedOAuthFlowsUserPoolClientMatching =
    appClientWeb.AllowedOAuthFlowsUserPoolClient === appClientNative.AllowedOAuthFlowsUserPoolClient;
  const supportedIdentityProvidersMatching = isArraysEqual(
    appClientWeb.SupportedIdentityProviders,
    appClientNative.SupportedIdentityProviders,
  );
  let propertiesMatching =
    supportedIdentityProvidersMatching &&
    callbackUrlMatching &&
    logoutUrlsMatching &&
    allowedOAuthFlowsMatching &&
    allowedOAuthScopesMatching &&
    allowedOAuthFlowsUserPoolClientMatching;
  if (!propertiesMatching && !printErrors) {
    return {
      isValid: false,
    };
  }
  if (!propertiesMatching) {
    context.print.error(messages_1.importMessages.OAuth.SomePropertiesAreNotMatching);
    context.print.info('');
    if (!supportedIdentityProvidersMatching) {
      showValidationTable(
        context,
        messages_1.importMessages.OAuth.ConfiguredIdentityProviders,
        appClientWeb,
        appClientNative,
        appClientWeb.SupportedIdentityProviders,
        appClientNative.SupportedIdentityProviders,
      );
    }
    if (!allowedOAuthFlowsUserPoolClientMatching) {
      showValidationTable(
        context,
        messages_1.importMessages.OAuth.OAuthFlowEnabledForApplicationClient,
        appClientWeb,
        appClientNative,
        [((_a = appClientWeb.AllowedOAuthFlowsUserPoolClient) === null || _a === void 0 ? void 0 : _a.toString()) || ''],
        [((_b = appClientNative.AllowedOAuthFlowsUserPoolClient) === null || _b === void 0 ? void 0 : _b.toString()) || ''],
      );
    }
    if (!callbackUrlMatching) {
      showValidationTable(
        context,
        messages_1.importMessages.OAuth.CallbackURLs,
        appClientWeb,
        appClientNative,
        appClientWeb.CallbackURLs,
        appClientNative.CallbackURLs,
      );
    }
    if (!logoutUrlsMatching) {
      showValidationTable(
        context,
        messages_1.importMessages.OAuth.LogoutURLs,
        appClientWeb,
        appClientNative,
        appClientWeb.LogoutURLs,
        appClientNative.LogoutURLs,
      );
    }
    if (!allowedOAuthFlowsMatching) {
      showValidationTable(
        context,
        messages_1.importMessages.OAuth.AllowedOAuthFlows,
        appClientWeb,
        appClientNative,
        appClientWeb.AllowedOAuthFlows,
        appClientNative.AllowedOAuthFlows,
      );
    }
    if (!allowedOAuthScopesMatching) {
      showValidationTable(
        context,
        messages_1.importMessages.OAuth.AllowedOAuthScopes,
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
  if (!appClientWeb.SupportedIdentityProviders || appClientWeb.SupportedIdentityProviders.length === 0) {
    return {
      isValid: true,
    };
  }
  const filteredProviders = appClientWeb.SupportedIdentityProviders.filter(p => supportedIdentityProviders.includes(p));
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
const showValidationTable = (context, title, appClientWeb, appClientNative, webValues, nativeValues) => {
  const tableOptions = [[appClientWeb.ClientName, appClientNative.ClientName]];
  const webNames = [...(webValues || [])].sort();
  const nativeNames = [...(nativeValues || [])].sort();
  const rowsDiff = Math.abs(webNames.length - nativeNames.length);
  if (webNames.length < nativeNames.length) {
    webNames.push(...lodash_1.default.times(rowsDiff, () => ''));
  } else if (webNames.length > nativeNames.length) {
    nativeNames.push(...lodash_1.default.times(rowsDiff, () => ''));
  }
  for (let i = 0; i < webNames.length; i++) {
    tableOptions.push([webNames[i], nativeNames[i]]);
  }
  context.print.info(title);
  context.print.info('');
  context.print.table(tableOptions, { format: 'markdown' });
  context.print.info('');
};
const isArraysEqual = (left, right) => {
  const sortedLeft = [...(left || [])].sort();
  const sortedRight = [...(right || [])].sort();
  return lodash_1.default.isEqual(sortedLeft, sortedRight);
};
const updateStateFiles = async (context, questionParameters, answers, projectType, updateEnvSpecificParameters) => {
  const backendConfiguration = {
    service: 'Cognito',
    serviceType: 'imported',
    providerPlugin: questionParameters.providerName,
    dependsOn: [],
    customAuth: isCustomAuthConfigured(answers.userPool),
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
  const resourceParameters = {
    authSelections: answers.authSelections,
    resourceName: answers.resourceName,
    serviceType: 'imported',
    region: questionParameters.region,
  };
  amplify_cli_core_1.stateManager.setResourceParametersJson(undefined, 'auth', answers.resourceName, resourceParameters);
  const metaConfiguration = lodash_1.default.clone(backendConfiguration);
  metaConfiguration.output = createMetaOutput(answers, hasOAuthConfig);
  context.amplify.updateamplifyMetaAfterResourceAdd('auth', answers.resourceName, metaConfiguration, backendConfiguration, true);
  const envSpecificParameters = createEnvSpecificResourceParameters(answers, hasOAuthConfig, projectType);
  if (updateEnvSpecificParameters) {
    context.amplify.saveEnvResourceParameters(context, 'auth', answers.resourceName, envSpecificParameters);
  }
  return {
    backendConfiguration,
    resourceParameters,
    metaConfiguration,
    envSpecificParameters,
  };
};
const createMetaOutput = (answers, hasOAuthConfig) => {
  var _a, _b, _c, _d;
  const userPool = answers.userPool;
  const output = {
    UserPoolId: userPool.Id,
    UserPoolName: userPool.Name,
    AppClientID: answers.appClientNative.ClientId,
    ...(answers.appClientNative.ClientSecret ? { AppClientSecret: answers.appClientNative.ClientSecret } : {}),
    AppClientIDWeb: answers.appClientWeb.ClientId,
    HostedUIDomain: userPool.Domain,
  };
  if (answers.authSelections === 'identityPoolAndUserPool') {
    output.IdentityPoolId = answers.identityPoolId;
    output.IdentityPoolName = (_a = answers.identityPool) === null || _a === void 0 ? void 0 : _a.IdentityPoolName;
    if (answers.identityPool.SupportedLoginProviders) {
      for (const key of Object.keys(answers.identityPool.SupportedLoginProviders || {})) {
        switch (key) {
          case 'www.amazon.com':
            output.AmazonWebClient = answers.identityPool.SupportedLoginProviders[key];
            break;
          case 'graph.facebook.com':
            output.FacebookWebClient = answers.identityPool.SupportedLoginProviders[key];
            break;
          case 'accounts.google.com':
            output.GoogleWebClient = answers.identityPool.SupportedLoginProviders[key];
            break;
          case 'appleid.apple.com':
            output.AppleWebClient = answers.identityPool.SupportedLoginProviders[key];
            break;
          default:
            break;
        }
      }
    }
  }
  if (
    userPool.MfaConfiguration !== 'OFF' &&
    ((_c = (_b = answers.mfaConfiguration) === null || _b === void 0 ? void 0 : _b.SmsMfaConfiguration) === null || _c === void 0
      ? void 0
      : _c.SmsConfiguration)
  ) {
    output.CreatedSNSRole =
      (_d = answers.mfaConfiguration.SmsMfaConfiguration.SmsConfiguration) === null || _d === void 0 ? void 0 : _d.SnsCallerArn;
  }
  if (hasOAuthConfig) {
    const oauthMetadata = {
      AllowedOAuthFlows: answers.oauthProperties.allowedOAuthFlows,
      AllowedOAuthScopes: answers.oauthProperties.allowedOAuthScopes,
      CallbackURLs: answers.oauthProperties.callbackURLs,
      LogoutURLs: answers.oauthProperties.logoutURLs,
    };
    output.OAuthMetadata = JSON.stringify(oauthMetadata);
  }
  return output;
};
const createEnvSpecificResourceParameters = (answers, hasOAuthConfig, projectType) => {
  var _a, _b;
  const userPool = answers.userPool;
  const envSpecificResourceParameters = {
    userPoolId: userPool.Id,
    userPoolName: userPool.Name,
    webClientId: answers.appClientWeb.ClientId,
    nativeClientId: answers.appClientNative.ClientId,
    identityPoolId: answers.identityPoolId,
    identityPoolName: (_a = answers.identityPool) === null || _a === void 0 ? void 0 : _a.IdentityPoolName,
    allowUnauthenticatedIdentities: (_b = answers.identityPool) === null || _b === void 0 ? void 0 : _b.AllowUnauthenticatedIdentities,
    authRoleArn: answers.authRoleArn,
    authRoleName: answers.authRoleName,
    unauthRoleArn: answers.unauthRoleArn,
    unauthRoleName: answers.unauthRoleName,
  };
  if (hasOAuthConfig) {
    envSpecificResourceParameters.hostedUIProviderCreds = createOAuthCredentials(answers.identityProviders);
  }
  if (answers.authSelections === 'identityPoolAndUserPool' && answers.identityPool.SupportedLoginProviders) {
    for (const key of Object.keys(answers.identityPool.SupportedLoginProviders || {})) {
      switch (key) {
        case 'www.amazon.com':
          envSpecificResourceParameters.amazonAppId = answers.identityPool.SupportedLoginProviders[key];
          break;
        case 'graph.facebook.com':
          envSpecificResourceParameters.facebookAppId = answers.identityPool.SupportedLoginProviders[key];
          break;
        case 'appleid.apple.com':
          envSpecificResourceParameters.appleAppId = answers.identityPool.SupportedLoginProviders[key];
          break;
        case 'accounts.google.com': {
          switch (projectType) {
            case 'javascript':
              envSpecificResourceParameters.googleClientId = answers.identityPool.SupportedLoginProviders[key];
              break;
            case 'ios':
              envSpecificResourceParameters.googleIos = answers.identityPool.SupportedLoginProviders[key];
              break;
            case 'android':
              envSpecificResourceParameters.googleAndroid = answers.identityPool.SupportedLoginProviders[key];
              break;
          }
          break;
        }
        default:
          break;
      }
    }
  }
  return envSpecificResourceParameters;
};
const createOAuthCredentials = identityProviders => {
  const credentials = identityProviders.map(idp => {
    if (idp.ProviderName === 'SignInWithApple') {
      return {
        ProviderName: idp.ProviderName,
        client_id: idp.ProviderDetails.client_id,
        team_id: idp.ProviderDetails.team_id,
        key_id: idp.ProviderDetails.key_id,
        private_key: idp.ProviderDetails.private_key,
      };
    } else {
      return {
        ProviderName: idp.ProviderName,
        client_id: idp.ProviderDetails.client_id,
        client_secret: idp.ProviderDetails.client_secret,
      };
    }
  });
  return JSON.stringify(credentials);
};
const createParameters = (providerName, userPoolList) => {
  const questionParameters = {
    providerName,
    userPoolList: userPoolList
      .map(up => ({
        message: `${up.Name} (${up.Id})`,
        value: up.Id,
      }))
      .sort((a, b) => a.message.localeCompare(b.message)),
    webClients: [],
    nativeClients: [],
  };
  return questionParameters;
};
const isCustomAuthConfigured = userPool => {
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
const importedAuthEnvInit = async (
  context,
  resourceName,
  resource,
  resourceParameters,
  providerName,
  providerUtils,
  currentEnvSpecificParameters,
  isInHeadlessMode,
  headlessParams,
) => {
  const cognito = await providerUtils.createCognitoUserPoolService(context);
  const identity = await providerUtils.createIdentityPoolService(context);
  const amplifyMeta = amplify_cli_core_1.stateManager.getMeta();
  const { Region } = amplifyMeta.providers[providerName];
  const projectConfig = context.amplify.getProjectConfig();
  const isPulling = context.input.command === 'pull' || (context.input.command === 'env' && context.input.subCommands[0] === 'pull');
  const isEnvAdd = context.input.command === 'env' && context.input.subCommands[0] === 'add';
  if (isInHeadlessMode) {
    return await exports.headlessImport(context, cognito, identity, providerName, resourceName, resourceParameters, headlessParams);
  }
  if (resourceParameters.region !== Region) {
    context.print.warning(messages_1.importMessages.NewEnvDifferentRegion(resourceName, resourceParameters.region, Region));
    return {
      doServiceWalkthrough: true,
    };
  }
  if (isPulling) {
    const currentMeta = amplify_cli_core_1.stateManager.getCurrentMeta(undefined, {
      throwIfNotExist: false,
    });
    if (currentMeta) {
      const currentResource = lodash_1.default.get(currentMeta, ['auth', resourceName], undefined);
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
    const sourceEnvParams = getSourceEnvParameters(context.exeInfo.sourceEnvName, 'auth', resourceName);
    if (sourceEnvParams) {
      const { importExisting } = await enquirer_1.default.prompt({
        name: 'importExisting',
        type: 'confirm',
        message: messages_1.importMessages.Questions.ImportPreviousResource(
          resourceName,
          sourceEnvParams.userPoolId,
          context.exeInfo.sourceEnvName,
        ),
        footer: messages_1.importMessages.ImportPreviousResourceFooter,
        initial: true,
        format: e => (e ? 'Yes' : 'No'),
      });
      if (!importExisting) {
        return {
          doServiceWalkthrough: true,
        };
      }
      currentEnvSpecificParameters.userPoolId = sourceEnvParams.userPoolId;
      currentEnvSpecificParameters.webClientId = sourceEnvParams.webClientId;
      currentEnvSpecificParameters.nativeClientId = sourceEnvParams.nativeClientId;
      if (resourceParameters.authSelections === 'identityPoolAndUserPool') {
        currentEnvSpecificParameters.identityPoolId = sourceEnvParams.identityPoolId;
      }
    }
  }
  if (
    !(
      currentEnvSpecificParameters.userPoolId &&
      currentEnvSpecificParameters.webClientId &&
      currentEnvSpecificParameters.nativeClientId &&
      (resourceParameters.authSelections === 'userPoolOnly' ||
        (resourceParameters.authSelections === 'identityPoolAndUserPool' && currentEnvSpecificParameters.identityPoolId))
    )
  ) {
    context.print.info(messages_1.importMessages.ImportNewResourceRequired(resourceName));
    return {
      doServiceWalkthrough: true,
    };
  }
  const questionParameters = {
    providerName,
    userPoolList: [],
    webClients: [],
    nativeClients: [],
    region: Region,
  };
  const answers = {
    authSelections: resourceParameters.authSelections,
    resourceName: resourceParameters.resourceName,
    userPoolId: currentEnvSpecificParameters.userPoolId,
  };
  try {
    answers.userPool = await cognito.getUserPoolDetails(currentEnvSpecificParameters.userPoolId);
  } catch (error) {
    if (error.name === 'ResourceNotFoundException') {
      context.print.error(
        messages_1.importMessages.UserPoolNotFound(currentEnvSpecificParameters.userPoolName, currentEnvSpecificParameters.userPoolId),
      );
      error.stack = undefined;
    }
    throw error;
  }
  const validationResult = await validateUserPool(cognito, identity, questionParameters, answers, currentEnvSpecificParameters.userPoolId);
  if (typeof validationResult === 'string') {
    context.print.info(
      messages_1.importMessages.UserPoolValidation(currentEnvSpecificParameters.userPoolName, currentEnvSpecificParameters.userPoolId),
    );
    context.print.error(validationResult);
    return {
      succeeded: false,
    };
  }
  answers.appClientWeb = questionParameters.webClients.find(c => c.ClientId === currentEnvSpecificParameters.webClientId);
  if (!answers.appClientWeb) {
    context.print.error(messages_1.importMessages.AppClientNotFound('Web', currentEnvSpecificParameters.webClientId));
    return {
      succeeded: false,
    };
  }
  answers.appClientNative = questionParameters.nativeClients.find(c => c.ClientId === currentEnvSpecificParameters.nativeClientId);
  if (!answers.appClientNative) {
    context.print.error(messages_1.importMessages.AppClientNotFound('Native', currentEnvSpecificParameters.nativeClientId));
    return {
      succeeded: false,
    };
  }
  const oauthResult = await appClientsOAuthPropertiesMatching(context, answers.appClientWeb, answers.appClientNative);
  if (!oauthResult.isValid) {
    return {
      succeeded: false,
    };
  }
  answers.oauthProviders = oauthResult.oauthProviders;
  answers.oauthProperties = oauthResult.oauthProperties;
  if (answers.oauthProviders && answers.oauthProviders.length > 0) {
    answers.identityProviders = await cognito.listUserPoolIdentityProviders(answers.userPoolId);
  }
  if (resourceParameters.authSelections === 'identityPoolAndUserPool') {
    const identityPools = questionParameters.validatedIdentityPools.filter(
      idp => idp.identityPool.IdentityPoolId === currentEnvSpecificParameters.identityPoolId,
    );
    if (identityPools.length !== 1) {
      context.print.info(
        messages_1.importMessages.IdentityPoolNotFound(
          currentEnvSpecificParameters.identityPoolName,
          currentEnvSpecificParameters.identityPoolId,
        ),
      );
      return {
        succeeded: false,
      };
    }
    answers.identityPoolId = identityPools[0].identityPool.IdentityPoolId;
    answers.identityPool = identityPools[0].identityPool;
    answers.identityProviders = identityPools[0].providers;
    const { authRoleArn, authRoleName, unauthRoleArn, unauthRoleName } = await identity.getIdentityPoolRoles(answers.identityPoolId);
    answers.authRoleArn = authRoleArn;
    answers.authRoleName = authRoleName;
    answers.unauthRoleArn = unauthRoleArn;
    answers.unauthRoleName = unauthRoleName;
  }
  if (answers.userPool.MfaConfiguration !== 'OFF') {
    try {
      answers.mfaConfiguration = await cognito.getUserPoolMfaConfig(answers.userPoolId);
    } catch (_a) {}
  }
  if (answers.oauthProviders && answers.oauthProviders.length > 0) {
    answers.identityProviders = await cognito.listUserPoolIdentityProviders(answers.userPoolId);
  }
  const projectType = projectConfig.frontend;
  const newState = await updateStateFiles(context, questionParameters, answers, projectType, false);
  return {
    succeeded: true,
    envSpecificParameters: newState.envSpecificParameters,
  };
};
exports.importedAuthEnvInit = importedAuthEnvInit;
const headlessImport = async (context, cognito, identity, providerName, resourceName, resourceParameters, headlessParams) => {
  const currentEnvSpecificParameters = ensureHeadlessParameters(resourceParameters, headlessParams);
  const amplifyMeta = amplify_cli_core_1.stateManager.getMeta();
  const { Region } = amplifyMeta.providers[providerName];
  const projectConfig = context.amplify.getProjectConfig();
  if (resourceParameters.region && resourceParameters.region !== Region) {
    throw new Error(messages_1.importMessages.NewEnvDifferentRegion(resourceName, resourceParameters.region, Region));
  }
  const questionParameters = {
    providerName,
    userPoolList: [],
    webClients: [],
    nativeClients: [],
    region: Region,
  };
  const answers = {
    authSelections: resourceParameters.authSelections,
    resourceName: resourceParameters.resourceName,
    userPoolId: currentEnvSpecificParameters.userPoolId,
  };
  try {
    answers.userPool = await cognito.getUserPoolDetails(currentEnvSpecificParameters.userPoolId);
  } catch (error) {
    if (error.name === 'ResourceNotFoundException') {
      throw new Error(
        messages_1.importMessages.UserPoolNotFound(currentEnvSpecificParameters.userPoolName, currentEnvSpecificParameters.userPoolId),
      );
    }
    throw error;
  }
  const validationResult = await validateUserPool(cognito, identity, questionParameters, answers, currentEnvSpecificParameters.userPoolId);
  if (typeof validationResult === 'string') {
    throw new Error(validationResult);
  }
  answers.appClientWeb = questionParameters.webClients.find(c => c.ClientId === currentEnvSpecificParameters.webClientId);
  if (!answers.appClientWeb) {
    throw new Error(messages_1.importMessages.AppClientNotFound('Web', currentEnvSpecificParameters.webClientId));
  }
  answers.appClientNative = questionParameters.nativeClients.find(c => c.ClientId === currentEnvSpecificParameters.nativeClientId);
  if (!answers.appClientNative) {
    throw new Error(messages_1.importMessages.AppClientNotFound('Native', currentEnvSpecificParameters.nativeClientId));
  }
  const oauthResult = await appClientsOAuthPropertiesMatching(context, answers.appClientWeb, answers.appClientNative, false);
  if (!oauthResult.isValid) {
    throw new Error(messages_1.importMessages.OAuth.PropertiesAreNotMatching);
  }
  answers.oauthProviders = oauthResult.oauthProviders;
  answers.oauthProperties = oauthResult.oauthProperties;
  if (answers.oauthProviders && answers.oauthProviders.length > 0) {
    answers.identityProviders = await cognito.listUserPoolIdentityProviders(answers.userPoolId);
  }
  if (resourceParameters.authSelections === 'identityPoolAndUserPool') {
    const identityPools = questionParameters.validatedIdentityPools.filter(
      idp => idp.identityPool.IdentityPoolId === currentEnvSpecificParameters.identityPoolId,
    );
    if (identityPools.length !== 1) {
      throw new Error(
        messages_1.importMessages.IdentityPoolNotFound(
          currentEnvSpecificParameters.identityPoolName,
          currentEnvSpecificParameters.identityPoolId,
        ),
      );
    }
    answers.identityPoolId = identityPools[0].identityPool.IdentityPoolId;
    answers.identityPool = identityPools[0].identityPool;
    answers.identityProviders = identityPools[0].providers;
    const { authRoleArn, authRoleName, unauthRoleArn, unauthRoleName } = await identity.getIdentityPoolRoles(answers.identityPoolId);
    answers.authRoleArn = authRoleArn;
    answers.authRoleName = authRoleName;
    answers.unauthRoleArn = unauthRoleArn;
    answers.unauthRoleName = unauthRoleName;
  }
  if (answers.userPool.MfaConfiguration !== 'OFF') {
    try {
      answers.mfaConfiguration = await cognito.getUserPoolMfaConfig(answers.userPoolId);
    } catch (_a) {}
  }
  if (answers.oauthProviders && answers.oauthProviders.length > 0) {
    answers.identityProviders = await cognito.listUserPoolIdentityProviders(answers.userPoolId);
  }
  const projectType = projectConfig.frontend;
  const newState = await updateStateFiles(context, questionParameters, answers, projectType, true);
  return {
    succeeded: true,
    envSpecificParameters: newState.envSpecificParameters,
  };
};
exports.headlessImport = headlessImport;
const ensureHeadlessParameters = (resourceParameters, headlessParams) => {
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
  const envSpecificParameters = {
    userPoolId: headlessParams.userPoolId,
    userPoolName: '',
    webClientId: headlessParams.webClientId,
    nativeClientId: headlessParams.nativeClientId,
  };
  if (resourceParameters.authSelections === 'identityPoolAndUserPool') {
    envSpecificParameters.identityPoolId = headlessParams.identityPoolId;
  }
  return envSpecificParameters;
};
const getSourceEnvParameters = (envName, categoryName, resourceName) => {
  const teamProviderInfo = amplify_cli_core_1.stateManager.getTeamProviderInfo(undefined, {
    throwIfNotExist: false,
  });
  if (teamProviderInfo) {
    const envParameters = lodash_1.default.get(teamProviderInfo, [envName, 'categories', categoryName, resourceName], undefined);
    return envParameters;
  }
  return undefined;
};
//# sourceMappingURL=index.js.map
