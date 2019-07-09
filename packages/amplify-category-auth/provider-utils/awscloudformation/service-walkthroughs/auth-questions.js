const inquirer = require('inquirer');
const chalk = require('chalk');
const chalkpipe = require('chalk-pipe');
const { uniq, pullAll } = require('lodash');
// const { parseTriggerSelections } = require('../utils/trigger-flow-auth-helper');
const { authProviders, attributeProviderMap, capabilities } = require('../assets/string-maps');

const category = 'auth';


async function serviceWalkthrough(
  context,
  defaultValuesFilename,
  stringMapsFilename,
  serviceMetadata,
  coreAnswers = {},
) {
  const { inputs } = serviceMetadata;
  const { amplify } = context;
  const { parseInputs } = require(`${__dirname}/../question-factories/core-questions.js`);
  const projectType = amplify.getProjectConfig().frontend;
  const defaultValuesSrc = `${__dirname}/../assets/${defaultValuesFilename}`;
  const { getAllDefaults } = require(defaultValuesSrc);

  handleUpdates(context, coreAnswers);

  // QUESTION LOOP
  let j = 0;
  while (j < inputs.length) {
    const questionObj = inputs[j];

    if (context.updatingAuth &&
      coreAnswers.updateFlow &&
      filterInput(inputs[j], coreAnswers.updateFlow)
    ) {
      j += 1;
    }

    // CREATE QUESTION OBJECT
    const q = await parseInputs(
      questionObj,
      amplify,
      defaultValuesFilename,
      stringMapsFilename,
      coreAnswers,
      context,
    );

    // ASK QUESTION
    const answer = await inquirer.prompt(q);

    if (answer.triggers && answer.triggers !== '{}') {
      const tempTriggers = context.updatingAuth && context.updatingAuth.triggers ?
        JSON.parse(context.updatingAuth.triggers) :
        {};
      const selectionMetadata = capabilities;

      /* eslint-disable no-loop-func */
      selectionMetadata.forEach((s) => {
        Object.keys(s.triggers).forEach((t) => {
          if (!tempTriggers[t] && answer.triggers.includes(s.value)) {
            tempTriggers[t] = s.triggers[t];
          } else if (tempTriggers[t] && answer.triggers.includes(s.value)) {
            tempTriggers[t] = uniq(tempTriggers[t].concat(s.triggers[t]));
          } else if (tempTriggers[t] && !answer.triggers.includes(s.value)) {
            const tempForDiff = Object.assign([], tempTriggers[t]);
            const remainder = pullAll(tempForDiff, s.triggers[t]);
            if (remainder && remainder.length > 0) {
              tempTriggers[t] = remainder;
            } else {
              delete tempTriggers[t];
            }
          }
        });
      });
      answer.triggers = tempTriggers;
    }

    // LEARN MORE BLOCK
    if (new RegExp(/learn/i).test(answer[questionObj.key]) && questionObj.learnMore) {
      const helpText = `\n${questionObj.learnMore.replace(new RegExp('[\\n]', 'g'), '\n\n')}\n\n`;
      questionObj.prefix = chalkpipe(null, chalk.green)(helpText);
    // ITERATOR BLOCK
    } else if (
      /*
        if the input has an 'iterator' value, we generate a loop which uses the iterator value as a
        key to find the array of values it should splice into.
      */
      questionObj.iterator &&
      answer[questionObj.key] &&
      answer[questionObj.key].length > 0
    ) {
      const replacementArray = context.updatingAuth[questionObj.iterator];
      for (let t = 0; t < answer[questionObj.key].length; t += 1) {
        questionObj.validation = questionObj.iteratorValidation;
        const newValue = await inquirer.prompt({
          name: 'updated',
          message: `Update ${answer[questionObj.key][t]}`,
          validate: amplify.inputValidation(questionObj),
        });
        replacementArray.splice(
          replacementArray.indexOf(answer[questionObj.key][t]),
          1,
          newValue.updated,
        );
      }
      j += 1;
    // ADD-ANOTHER BLOCK
    } else if (questionObj.addAnotherLoop && Object.keys(answer).length > 0) {
      /*
        if the input has an 'addAnotherLoop' value, we first make sure that the answer
        will be recorded as an array index, and if it is already an array we push the new value.
        We then ask the user if they want to add another url.  If not, we increment our counter (j)
        so that the next question is appears in the prompt.  If the counter isn't incremented,
        the same question is reapated.
      */
      if (!coreAnswers[questionObj.key]) {
        answer[questionObj.key] = [answer[questionObj.key]];
        coreAnswers = { ...coreAnswers, ...answer };
      } else {
        coreAnswers[questionObj.key].push(answer[questionObj.key]);
      }
      const addAnother = await inquirer.prompt({
        name: 'repeater',
        type: 'confirm',
        default: false,
        message: `Do you want to add another ${questionObj.addAnotherLoop}`,
      });
      if (!addAnother.repeater) {
        j += 1;
      }
    } else if (questionObj.key === 'updateFlow') {
      /*
        if the user selects a default or fully manual config option during an update,
        we set the useDefault value so that the appropriate questions are displayed
      */
      if (['manual', 'defaultSocial', 'default'].includes(answer.updateFlow)) {
        answer.useDefault = answer.updateFlow;
        if (answer.useDefault === 'defaultSocial') {
          coreAnswers.hostedUI = true;
        }
        delete answer.updateFlow;
      }
      coreAnswers = { ...coreAnswers, ...answer };
      j += 1;
    } else if (!context.updatingAuth && answer.useDefault && ['default', 'defaultSocial'].includes(answer.useDefault)) {
      // if the user selects defaultSocial, we set hostedUI to true to avoid reasking this question
      coreAnswers = { ...coreAnswers, ...answer };
      coreAnswers.authSelections = 'identityPoolAndUserPool';
      if (coreAnswers.useDefault === 'defaultSocial') {
        coreAnswers.hostedUI = true;
      }
      j += 1;
    } else {
      coreAnswers = { ...coreAnswers, ...answer };
      j += 1;
    }
  }

  // POST-QUESTION LOOP PARSING

  // if user selects user pool only, ensure that we clean id pool options
  if (coreAnswers.authSelections === 'userPoolOnly' && context.updatingAuth) {
    delete context.updatingAuth.identityPoolName;
    delete context.updatingAuth.allowUnauthenticatedIdentities;
    delete context.updatingAuth.thirdPartyAuth;
    delete context.updatingAuth.authProviders;
    delete context.updatingAuth.facebookAppId;
    delete context.updatingAuth.googleClientId;
    delete context.updatingAuth.googleIos;
    delete context.updatingAuth.googleAndroid;
    delete context.updatingAuth.amazonAppId;
  }

  // formatting data for identity pool providers
  if (coreAnswers.thirdPartyAuth) {
    identityPoolProviders(coreAnswers, projectType);
  }


  // ask manual trigger flow question
  if (coreAnswers.authSelections !== 'identityPoolOnly' && !['init', 'checkout'].includes(context.commandName)) {
    if (coreAnswers.useDefault === 'manual') {
      coreAnswers.triggers = await lambdaFlow(context, coreAnswers.triggers);
    }
  }

  // formatting data for user pool providers / hosted UI
  if (coreAnswers.authProvidersUserPool) {
    /* eslint-disable */
    coreAnswers = Object.assign(coreAnswers, userPoolProviders(coreAnswers.authProvidersUserPool, coreAnswers, context.updatingAuth));
    /* eslint-enable */
  }

  // formatting oAuthMetaData
  structureoAuthMetaData(coreAnswers, context, getAllDefaults, amplify);

  if (coreAnswers.usernameAttributes && !Array.isArray(coreAnswers.usernameAttributes)) {
    if (coreAnswers.usernameAttributes === 'username') {
      delete coreAnswers.usernameAttributes;
    } else {
      coreAnswers.usernameAttributes = coreAnswers.usernameAttributes.split();
    }
  }

  return {
    ...coreAnswers,
  };
}

/*
  Create key/value pairs of third party auth providers,
  where key = name accepted by updateIdentityPool API call and value = id entered by user
*/
function identityPoolProviders(coreAnswers, projectType) {
  coreAnswers.selectedParties = {};
  authProviders.forEach((e) => {
    // don't send google value in cf if native project, since we need to make an openid provider
    if (projectType === 'javascript' || e.answerHashKey !== 'googleClientId') {
      if (coreAnswers[e.answerHashKey]) {
        coreAnswers.selectedParties[e.value] = coreAnswers[e.answerHashKey];
      }
      /*
        certain third party providers require multiple values,
        which Cognito requires to be a concatenated string -
        so here we build the string using 'concatKeys' defined in the thirdPartyMap
      */
      if (coreAnswers[e.answerHashKey] && e.concatKeys) {
        e.concatKeys.forEach((i) => {
          coreAnswers.selectedParties[e.value] = coreAnswers.selectedParties[e.value].concat(';', coreAnswers[i]);
        });
      }
    }
  });
  if (projectType !== 'javascript' && coreAnswers.authProviders.includes('accounts.google.com')) {
    coreAnswers.audiences = [coreAnswers.googleClientId];
    if (projectType === 'ios') {
      coreAnswers.audiences.push(coreAnswers.googleIos);
    } else if (projectType === 'android') {
      coreAnswers.audiences.push(coreAnswers.googleAndroid);
    }
  }
  coreAnswers.selectedParties = JSON.stringify(coreAnswers.selectedParties);
}

/*
  Format hosted UI providers data per lambda spec
  hostedUIProviderMeta is saved in parameters.json.
  hostedUIprovierCreds is saved in team-providers.
*/
function userPoolProviders(oAuthProviders, coreAnswers, prevAnswers) {
  if (coreAnswers.useDefault === 'default') {
    return null;
  }
  const answers = Object.assign(prevAnswers || {}, coreAnswers);
  const attributesForMapping = answers.requiredAttributes ? JSON.parse(JSON.stringify(answers.requiredAttributes)).concat('username') : ['email', 'username'];
  const res = {};
  if (oAuthProviders) {
    res.hostedUIProviderMeta = JSON.stringify(oAuthProviders
      .map((el) => {
        const delimmiter = el === 'Facebook' ? ',' : ' ';
        const scopes = [];
        const maps = {};
        attributesForMapping.forEach((a) => {
          const attributeKey = attributeProviderMap[a];
          if (attributeKey && attributeKey[`${el.toLowerCase()}`] && attributeKey[`${el.toLowerCase()}`].scope) {
            if (scopes.indexOf(attributeKey[`${el.toLowerCase()}`].scope) === -1) {
              scopes.push(attributeKey[`${el.toLowerCase()}`].scope);
            }
          }
          if (el === 'Google' && !scopes.includes('openid')) {
            scopes.unshift('openid');
          }
          if (attributeKey && attributeKey[`${el.toLowerCase()}`] && attributeKey[`${el.toLowerCase()}`].attr) {
            maps[a] = attributeKey[`${el.toLowerCase()}`].attr;
          }
        });
        return {
          ProviderName: el,
          authorize_scopes: scopes.join(delimmiter),
          AttributeMapping: maps,
        };
      }));
    res.hostedUIProviderCreds = JSON.stringify(oAuthProviders
      .map(el => ({ ProviderName: el, client_id: coreAnswers[`${el.toLowerCase()}AppIdUserPool`], client_secret: coreAnswers[`${el.toLowerCase()}AppSecretUserPool`] })));
  }
  return res;
}

/*
  Format hosted UI oAuth data per lambda spec
*/
function structureoAuthMetaData(coreAnswers, context, defaults, amplify) {
  if (coreAnswers.useDefault === 'default' && context.updatingAuth) {
    delete context.updatingAuth.oAuthMetadata;
    return null;
  }
  const prev = context.updatingAuth ? context.updatingAuth : {};
  const answers = Object.assign(prev, coreAnswers);
  let {
    AllowedOAuthFlows,
    AllowedOAuthScopes,
    CallbackURLs,
    LogoutURLs,
  } = answers;
  if (CallbackURLs && coreAnswers.newCallbackURLs) {
    CallbackURLs = CallbackURLs.concat(coreAnswers.newCallbackURLs);
  } else if (coreAnswers.newCallbackURLs) {
    CallbackURLs = coreAnswers.newCallbackURLs;
  }
  if (LogoutURLs && coreAnswers.newLogoutURLs) {
    LogoutURLs = LogoutURLs.concat(coreAnswers.newLogoutURLs);
  } else if (coreAnswers.newLogoutURLs) {
    LogoutURLs = coreAnswers.newLogoutURLs;
  }

  if (CallbackURLs && LogoutURLs) {
    if (!answers.AllowedOAuthScopes) {
      /* eslint-disable */
      AllowedOAuthScopes = defaults(amplify.getProjectDetails(amplify)).AllowedOAuthScopes;
    }
    if (!answers.AllowedOAuthFlows) {
      AllowedOAuthFlows = defaults(amplify.getProjectDetails(amplify)).AllowedOAuthFlows;
      /* eslint-enable */
    } else {
      AllowedOAuthFlows = Array.isArray(AllowedOAuthFlows) ?
        AllowedOAuthFlows :
        [AllowedOAuthFlows];
    }
  }

  if (AllowedOAuthFlows && AllowedOAuthScopes && CallbackURLs && LogoutURLs) {
    coreAnswers.oAuthMetadata = JSON.stringify({
      AllowedOAuthFlows,
      AllowedOAuthScopes,
      CallbackURLs,
      LogoutURLs,
    });
  }

  return coreAnswers;
}

/*
  Deserialize oAuthData for CLI update flow
*/
function parseOAuthMetaData(previousAnswers) {
  if (previousAnswers && previousAnswers.oAuthMetadata) {
    previousAnswers = Object.assign(previousAnswers, JSON.parse(previousAnswers.oAuthMetadata));
    delete previousAnswers.oAuthMetadata;
  }
}

/*
  Deserialize oAuthCredentials for CLI update flow
*/
function parseOAuthCreds(providers, metadata, envCreds) {
  const providerKeys = {};
  try {
    const parsedMetaData = JSON.parse(metadata);
    const parsedCreds = JSON.parse(envCreds);
    providers.forEach((el) => {
      try {
        const provider = parsedMetaData.find(i => i.ProviderName === el);
        const creds = parsedCreds.find(i => i.ProviderName === el);
        providerKeys[`${el.toLowerCase()}AppIdUserPool`] = creds.client_id;
        providerKeys[`${el.toLowerCase()}AppSecretUserPool`] = creds.client_secret;
        providerKeys[`${el.toLowerCase()}AuthorizeScopes`] = provider.authorize_scopes.split(',');
      } catch (e) {
        return null;
      }
    });
  } catch (e) {
    return {};
  }
  return providerKeys;
}


/*
  Filter inputs for update flow
*/
function filterInput(input, updateFlow) {
  if (input.updateGroups && !input.updateGroups.includes('manual') && !input.updateGroups.includes(updateFlow.type)) {
    return true;
  }
  return false;
}

/*
  Handle updates
*/
function handleUpdates(context, coreAnswers) {
  if (context.updatingAuth && context.updatingAuth.triggers) {
    coreAnswers.triggers = {};
    coreAnswers.triggers = context.updatingAuth.triggers;
  }

  if (context.updatingAuth && context.updatingAuth.oAuthMetadata) {
    parseOAuthMetaData(context.updatingAuth);
  }

  if (context.updatingAuth && context.updatingAuth.authProvidersUserPool) {
    const { resourceName, authProvidersUserPool, hostedUIProviderMeta } = context.updatingAuth;
    const { hostedUIProviderCreds } = context.amplify.loadEnvResourceParameters(context, 'auth', resourceName);
    /* eslint-disable */
    const oAuthCreds = parseOAuthCreds(authProvidersUserPool, hostedUIProviderMeta, hostedUIProviderCreds);
    /* eslint-enable */
    context.updatingAuth = Object.assign(context.updatingAuth, oAuthCreds);
  }

  if (context.updatingAuth &&
    context.updatingAuth.authSelections === 'identityPoolOnly'
  ) {
    coreAnswers.authSelections = 'identityPoolAndUserPool';
  }
}

/*
  Adding lambda triggers
*/
async function lambdaFlow(context, answers) {
  const triggers = await context.amplify
    .triggerFlow(context, 'cognito', 'auth', answers);
  return triggers || answers;
}

function getIAMPolicies(resourceName, crudOptions) {
  let policy = {};
  const actions = [];

  crudOptions.forEach((crudOption) => {
    switch (crudOption) {
      case 'create': actions.push(
        'cognito-idp:ConfirmSignUp',
        'cognito-idp:AdminCreateUser',
        'cognito-idp:CreateUserImportJob',
        'cognito-idp:AdminSetUserSettings',
        'cognito-idp:AdminLinkProviderForUser',
        'cognito-idp:CreateIdentityProvider',
        'cognito-idp:AdminConfirmSignUp',
        'cognito-idp:AdminDisableUser',
        'cognito-idp:AdminRemoveUserFromGroup',
        'cognito-idp:SetUserMFAPreference',
        'cognito-idp:SetUICustomization',
        'cognito-idp:SignUp',
        'cognito-idp:VerifyUserAttribute',
        'cognito-idp:SetRiskConfiguration',
        'cognito-idp:StartUserImportJob',
        'cognito-idp:AdminSetUserPassword',
        'cognito-idp:AssociateSoftwareToken',
        'cognito-idp:CreateResourceServer',
        'cognito-idp:RespondToAuthChallenge',
        'cognito-idp:CreateUserPoolClient',
        'cognito-idp:AdminUserGlobalSignOut',
        'cognito-idp:GlobalSignOut',
        'cognito-idp:AddCustomAttributes',
        'cognito-idp:CreateGroup',
        'cognito-idp:CreateUserPool',
        'cognito-idp:AdminForgetDevice',
        'cognito-idp:AdminAddUserToGroup',
        'cognito-idp:AdminRespondToAuthChallenge',
        'cognito-idp:ForgetDevice',
        'cognito-idp:CreateUserPoolDomain',
        'cognito-idp:AdminEnableUser',
        'cognito-idp:AdminUpdateDeviceStatus',
        'cognito-idp:StopUserImportJob',
        'cognito-idp:InitiateAuth',
        'cognito-idp:AdminInitiateAuth',
        'cognito-idp:AdminSetUserMFAPreference',
        'cognito-idp:ConfirmForgotPassword',
        'cognito-idp:SetUserSettings',
        'cognito-idp:VerifySoftwareToken',
        'cognito-idp:AdminDisableProviderForUser',
        'cognito-idp:SetUserPoolMfaConfig',
        'cognito-idp:ChangePassword',
        'cognito-idp:ConfirmDevice',
        'cognito-idp:AdminResetUserPassword',
        'cognito-idp:ResendConfirmationCode',
      );
        break;
      case 'update': actions.push(
        'cognito-idp:ForgotPassword',
        'cognito-idp:UpdateAuthEventFeedback',
        'cognito-idp:UpdateResourceServer',
        'cognito-idp:UpdateUserPoolClient',
        'cognito-idp:AdminUpdateUserAttributes',
        'cognito-idp:UpdateUserAttributes',
        'cognito-idp:UpdateUserPoolDomain',
        'cognito-idp:UpdateIdentityProvider',
        'cognito-idp:UpdateGroup',
        'cognito-idp:AdminUpdateAuthEventFeedback',
        'cognito-idp:UpdateDeviceStatus',
        'cognito-idp:UpdateUserPool',
      );
        break;
      case 'read': actions.push(
        'cognito-identity:Describe*',
        'cognito-identity:Get*',
        'cognito-identity:List*',
        'cognito-idp:Describe*',
        'cognito-idp:AdminGetDevice',
        'cognito-idp:AdminGetUser',
        'cognito-idp:AdminList*',
        'cognito-idp:List*',
        'cognito-sync:Describe*',
        'cognito-sync:Get*',
        'cognito-sync:List*',
        'iam:ListOpenIdConnectProviders',
        'iam:ListRoles',
        'sns:ListPlatformApplications',
      );
        break;
      case 'delete': actions.push(
        'cognito-idp:DeleteUserPoolDomain',
        'cognito-idp:DeleteResourceServer',
        'cognito-idp:DeleteGroup',
        'cognito-idp:AdminDeleteUserAttributes',
        'cognito-idp:DeleteUserPoolClient',
        'cognito-idp:DeleteUserAttributes',
        'cognito-idp:DeleteUserPool',
        'cognito-idp:AdminDeleteUser',
        'cognito-idp:DeleteIdentityProvider',
        'cognito-idp:DeleteUser',
      );
        break;
      default: console.log(`${crudOption} not supported`);
    }
  });


  policy = {
    Effect: 'Allow',
    Action: actions,
    Resource: [
      {
        'Fn::Join': [
          '',
          [
            'arn:aws:cognito-idp:',
            { Ref: 'AWS::Region' },
            ':',
            { Ref: 'AWS::AccountId' },
            ':userpool/',
            {
              Ref: `${category}${resourceName}UserPoolId`,
            },
          ],
        ],
      },
    ],
  };

  const attributes = ['UserPoolId'];

  return { policy, attributes };
}


module.exports = {
  serviceWalkthrough,
  userPoolProviders,
  parseOAuthCreds,
  structureoAuthMetaData,
  getIAMPolicies,
};
