/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable jsdoc/require-jsdoc */
import chalk from 'chalk';
import _, { uniq, pullAll } from 'lodash';
import path from 'path';
// const { parseTriggerSelections } = require('../utils/trigger-flow-auth-helper');
// @ts-ignore
import { Sort } from 'enquirer';
import { $TSContext } from 'amplify-cli-core';
import { extractApplePrivateKey } from '../utils/extract-apple-private-key';
import { authProviders, attributeProviderMap, capabilities } from '../assets/string-maps';
import { prompter } from '../../../../../amplify-prompts/src/prompter';

const category = 'auth';

/* eslint-disable no-param-reassign */
export const serviceWalkthrough = async (
  context:$TSContext,
  defaultValuesFilename:any,
  stringMapsFilename:any,
  serviceMetadata:any,
  coreAnswers: {[key: string]: any} = {},
): Promise<Record<string, unknown>> => {
  const { inputs } = serviceMetadata;
  const { amplify } = context;
  const { parseInputs } = await import(`${__dirname}/../question-factories/core-questions.js`);
  const projectType = amplify.getProjectConfig().frontend;
  const defaultValuesSrc = `${__dirname}/../assets/${defaultValuesFilename}`;
  const { getAllDefaults } = await import(defaultValuesSrc);
  let userPoolGroupList = context.amplify.getUserPoolGroupList(context);
  let adminQueryGroup;

  handleUpdates(context, coreAnswers);

  // QUESTION LOOP
  let j = 0;
  while (j < inputs.length) {
    const questionObj = inputs[j];

    // CREATE QUESTION OBJECT
    const question = await parseInputs(questionObj, amplify, defaultValuesFilename, stringMapsFilename, coreAnswers, context);

    // ASK QUESTION
    const answer = await prompter.input(question.message);

    /* eslint-disable spellcheck/spell-checker */
    if ('signinwithapplePrivateKeyUserPool' in answer) {
      answer.signinwithapplePrivateKeyUserPool = extractApplePrivateKey(answer.signinwithapplePrivateKeyUserPool);
    }
    /* eslint-enable spellcheck/spell-checker */
    if (answer.userPoolGroups === true) {
      userPoolGroupList = await updateUserPoolGroups(context);
    }

    if (answer.adminQueries === true) {
      adminQueryGroup = await updateAdminQuery(context, userPoolGroupList);
    }

    if (answer.triggers && answer.triggers !== '{}') {
      const tempTriggers = context.updatingAuth && context.updatingAuth.triggers ? JSON.parse(context.updatingAuth.triggers) : {};
      const selectionMetadata = capabilities;

      /* eslint-disable no-loop-func */
      selectionMetadata.forEach((selection: {[key: string]: any}) => {
        Object.keys(selection.triggers).forEach(t => {
          if (!tempTriggers[t] && answer.triggers.includes(selection.value)) {
            tempTriggers[t] = selection.triggers[t];
          } else if (tempTriggers[t] && answer.triggers.includes(selection.value)) {
            tempTriggers[t] = uniq(tempTriggers[t].concat(selection.triggers[t]));
          } else if (tempTriggers[t] && !answer.triggers.includes(selection.value)) {
            const tempForDiff = Object.assign([], tempTriggers[t]);
            const remainder = pullAll(tempForDiff, selection.triggers[t]);
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
      questionObj.prefix = chalk.green(helpText);
      // ITERATOR BLOCK
    } else if (
      /*
        if the input has an 'iterator' value, we generate a loop which uses the iterator value as a
        key to find the array of values it should splice into.
      */
      questionObj.iterator
      && answer[questionObj.key]
      && answer[questionObj.key].length > 0
    ) {
      const replacementArray = context.updatingAuth[questionObj.iterator];
      for (let t = 0; t < answer[questionObj.key].length; t += 1) {
        questionObj.validation = questionObj.iteratorValidation;
        const newValue = await prompter.input(`Update ${answer[questionObj.key][t]}`, { validate: amplify.inputValidation(questionObj) });
        replacementArray.splice(replacementArray.indexOf(answer[questionObj.key][t]), 1, newValue);
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
      const addAnother = await prompter.yesOrNo(`Do you want to add another ${questionObj.addAnotherLoop}`, false);
      if (!addAnother) {
        j += 1;
      }
    } else if (questionObj.key === 'updateFlow') {
      /*
        if the user selects a default or fully manual config option during an update,
        we set the useDefault value so that the appropriate questions are displayed
      */
      if (answer.updateFlow === 'updateUserPoolGroups') {
        userPoolGroupList = await updateUserPoolGroups(context);
      } else if (answer.updateFlow === 'updateAdminQueries') {
        adminQueryGroup = await updateAdminQuery(context, userPoolGroupList);
      } else if (['manual', 'defaultSocial', 'default'].includes(answer.updateFlow)) {
        answer.useDefault = answer.updateFlow;
        if (answer.useDefault === 'defaultSocial') {
          coreAnswers.hostedUI = true;
        }

        if (answer.useDefault === 'default') {
          coreAnswers.hostedUI = false;
        }
        delete answer.updateFlow;
      }
      coreAnswers = { ...coreAnswers, ...answer };
      j += 1;
    } else if (!context.updatingAuth && answer.useDefault && ['default', 'defaultSocial'].includes(answer.useDefault)) {
      // if the user selects defaultSocial, we set hostedUI to true to avoid re-asking this question
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
    context.print.warning(
      `Warning! Your existing IdentityPool: ${context.updatingAuth.identityPoolName} will be deleted upon the next “amplify push”!`,
    );
    delete context.updatingAuth.identityPoolName;
    delete context.updatingAuth.allowUnauthenticatedIdentities;
    delete context.updatingAuth.thirdPartyAuth;
    delete context.updatingAuth.authProviders;
    delete context.updatingAuth.facebookAppId;
    delete context.updatingAuth.googleClientId;
    delete context.updatingAuth.googleIos;
    delete context.updatingAuth.googleAndroid;
    delete context.updatingAuth.amazonAppId;
    delete context.updatingAuth.appleAppId;
  }

  // formatting data for identity pool providers
  if (coreAnswers.thirdPartyAuth) {
    identityPoolProviders(coreAnswers, projectType);
  }

  const isPullOrEnvCommand = context.input.command === 'pull' || context.input.command === 'env';
  if (coreAnswers.authSelections !== 'identityPoolOnly' && context.input.command !== 'init' && !isPullOrEnvCommand) {
    if (coreAnswers.useDefault === 'manual') {
      coreAnswers.triggers = await lambdaFlow(context, coreAnswers.triggers);
    }
  }

  // formatting data for user pool providers / hosted UI
  if (coreAnswers.authProvidersUserPool) {
    coreAnswers = Object.assign(coreAnswers, userPoolProviders(coreAnswers.authProvidersUserPool, coreAnswers, context.updatingAuth));
  }

  // formatting oAuthMetaData
  structureOAuthMetadata(coreAnswers, context, getAllDefaults, amplify);

  if (coreAnswers.usernameAttributes && !Array.isArray(coreAnswers.usernameAttributes)) {
    if (coreAnswers.usernameAttributes === 'username') {
      delete coreAnswers.usernameAttributes;
    } else {
      coreAnswers.usernameAttributes = coreAnswers.usernameAttributes.split();
    }
  }

  return {
    ...coreAnswers,
    userPoolGroupList,
    adminQueryGroup,
    serviceName: 'Cognito',
  };
};
/* eslint-enable no-param-reassign */

const updateUserPoolGroups = async (context: any): Promise<string[]> => {
  let userPoolGroupList = [];
  let existingGroups;

  const userGroupParamsPath = path.join(
    context.amplify.pathManager.getBackendDirPath(),
    'auth',
    'userPoolGroups',
    'user-pool-group-precedence.json',
  );

  try {
    existingGroups = context.amplify.readJsonFile(userGroupParamsPath);
    userPoolGroupList = existingGroups.map((e: any) => e.groupName);
  } catch (e) {
    existingGroups = null;
  }

  if (existingGroups) {
    // eslint-disable-next-line
    const deletionChoices = existingGroups.map((e: any) => {
      return { name: e.groupName, value: e.groupName };
    });

    const groups2BeDeleted = await prompter.pick<'many', string>(
      'Select any user pool groups you want to delete:',
      deletionChoices,
      { returnSize: 'many' },
    );
    userPoolGroupList = userPoolGroupList.filter((i: any) => !groups2BeDeleted.includes(i));
  }

  /* Must be sure to ask this question in the event that it is the
  first time in the user pool group flow, or it is an update but
  the user has deleted all existing groups. If they want to delete
  all groups they should just delete the resource */
  if (userPoolGroupList.length < 1) {
    const userPoolGroupName = await prompter.input('Provide a name for your user pool group:',
      {
        validate: context.amplify.inputValidation({
          validation: {
            operator: 'regex',
            value: '^[a-zA-Z0-9]+$',
            onErrorMsg: 'Resource name should be alphanumeric',
          },
          required: true,
        }),
      });
    userPoolGroupList.push(userPoolGroupName);
  }

  let addAnother = await prompter.yesOrNo('Do you want to add another User Pool Group', false);
  while (addAnother === true) {
    const userPoolGroupName = await prompter.input('Provide a name for your user pool group:',
      {
        validate: context.amplify.inputValidation({
          validation: {
            operator: 'regex',
            value: '^[a-zA-Z0-9]+$',
            onErrorMsg: 'Resource name should be alphanumeric',
          },
          required: true,
        }),
      });

    userPoolGroupList.push(userPoolGroupName);
    addAnother = await prompter.yesOrNo('Do you want to add another User Pool Group', false);
  }

  // Get distinct list
  const distinctSet = new Set(userPoolGroupList);
  userPoolGroupList = Array.from(distinctSet);

  // Sort the Array to get precedence
  let sortedUserPoolGroupList = [];

  if (userPoolGroupList && userPoolGroupList.length > 0) {
    const sortPrompt = new Sort({
      name: 'sortUserPools',
      hint: `(Use ${chalk.green.bold('<shift>+<right/left>')} to change the order)`,
      message: 'Sort the user pool groups in order of preference',
      choices: userPoolGroupList,
      shiftLeft(...args: any[]) {
        return this.shiftUp(...args);
      },
      shiftRight(...args: any[]) {
        return this.shiftDown(...args);
      },
    });

    sortedUserPoolGroupList = await sortPrompt.run();
  }
  return sortedUserPoolGroupList;
};

const updateAdminQuery = async (context: $TSContext, userPoolGroupList: any[]): Promise<string> => {
  // Clone user pool group list
  const userPoolGroupListClone = userPoolGroupList.slice(0);
  if (await context.amplify.confirmPrompt('Do you want to restrict access to the admin queries API to a specific Group')) {
    userPoolGroupListClone.push('Enter a custom group');

    let adminGroup = await prompter.pick('Select the group to restrict access with:', userPoolGroupListClone);
    if (adminGroup === 'Enter a custom group') {
      adminGroup = await prompter.input(
        'Provide a group name:',
        {
          validate: context.amplify.inputValidation({
            validation: {
              operator: 'regex',
              value: '^[a-zA-Z0-9]+$',
              onErrorMsg: 'Resource name should be alphanumeric',
            },
            required: true,
          }),
        },
      );
    }

    return adminGroup;
  }

  return '';
};

/*
  Create key/value pairs of third party auth providers,
  where key = name accepted by updateIdentityPool API call and value = id entered by user
*/
/* eslint-disable no-param-reassign */
export const identityPoolProviders = (coreAnswers: any, projectType: any): any => {
  coreAnswers.selectedParties = {};
  authProviders.forEach((provider: any) => {
    // don't send google value in cf if native project, since we need to make an openid provider
    if (projectType === 'javascript' || provider.answerHashKey !== 'googleClientId') {
      if (coreAnswers[provider.answerHashKey]) {
        coreAnswers.selectedParties[provider.value] = coreAnswers[provider.answerHashKey];
      }
      /*
        certain third party providers require multiple values,
        which Cognito requires to be a concatenated string -
        so here we build the string using 'concatKeys' defined in the thirdPartyMap
      */
      if (coreAnswers[provider.answerHashKey] && provider.concatKeys) {
        provider.concatKeys.forEach((i: any) => {
          coreAnswers.selectedParties[provider.value] = coreAnswers.selectedParties[provider.value].concat(';', coreAnswers[i]);
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
};

/*
  Format hosted UI providers data per lambda spec
  hostedUIProviderMeta is saved in parameters.json.
  hostedUIProviderCreds is saved in deployment-secrets.
*/
export const userPoolProviders = (oAuthProviders: any, coreAnswers: any, prevAnswers?: any): any => {
  if (coreAnswers.useDefault === 'default') {
    return null;
  }
  const answers = Object.assign(prevAnswers || {}, coreAnswers);
  const attributesForMapping = answers.requiredAttributes
    ? JSON.parse(JSON.stringify(answers.requiredAttributes)).concat('username')
    : ['email', 'username'];
  const res: {[key: string]: any} = {};
  if (answers.hostedUI) {
    res.hostedUIProviderMeta = JSON.stringify(
      oAuthProviders.map((providerName: any) => {
        const lowerCaseEl = providerName.toLowerCase();
        const delimiter = providerName === 'Facebook' ? ',' : ' ';
        const scopes: any[] = [];
        const maps: any = {};
        attributesForMapping.forEach((attribute: keyof typeof attributeProviderMap) => {
          const attributeKey: any = attributeProviderMap[attribute];
          if (attributeKey && attributeKey[`${lowerCaseEl}`] && attributeKey[`${lowerCaseEl}`].scope) {
            if (scopes.indexOf(attributeKey[`${lowerCaseEl}`].scope) === -1) {
              scopes.push(attributeKey[`${lowerCaseEl}`].scope);
            }
          }
          if (providerName === 'Google' && !scopes.includes('openid')) {
            scopes.unshift('openid');
          }
          if (attributeKey && attributeKey[`${lowerCaseEl}`] && attributeKey[`${lowerCaseEl}`].attr) {
            maps[attribute] = attributeKey[`${lowerCaseEl}`].attr;
          }
        });
        return {
          ProviderName: providerName,
          authorize_scopes: scopes.join(delimiter),
          AttributeMapping: maps,
        };
      }),
    );
    res.hostedUIProviderCreds = JSON.stringify(
      oAuthProviders.map((el: any) => {
        const lowerCaseEl = el.toLowerCase();
        if (el === 'SignInWithApple') {
          return {
            ProviderName: el,
            client_id: coreAnswers[`${lowerCaseEl}ClientIdUserPool`],
            team_id: coreAnswers[`${lowerCaseEl}TeamIdUserPool`],
            key_id: coreAnswers[`${lowerCaseEl}KeyIdUserPool`],
            private_key: coreAnswers[`${lowerCaseEl}PrivateKeyUserPool`],
          };
        }
        return {
          ProviderName: el,
          client_id: coreAnswers[`${lowerCaseEl}AppIdUserPool`],
          client_secret: coreAnswers[`${lowerCaseEl}AppSecretUserPool`],
        };
      }),
    );
  }
  return res;
};

/*
  Format hosted UI oAuth data per lambda spec
*/
export const structureOAuthMetadata = (coreAnswers: any, context: $TSContext, defaults: any, amplify: any): any => {
  if (coreAnswers.useDefault === 'default' && context.updatingAuth) {
    delete context.updatingAuth.oAuthMetadata;
    return null;
  }
  const answers = { ...context.updatingAuth, ...coreAnswers };
  let {
    AllowedOAuthFlows, AllowedOAuthScopes, CallbackURLs, LogoutURLs,
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
      AllowedOAuthScopes = defaults(amplify.getProjectDetails(amplify)).AllowedOAuthScopes;
    }
    if (!answers.AllowedOAuthFlows) {
      AllowedOAuthFlows = defaults(amplify.getProjectDetails(amplify)).AllowedOAuthFlows;
    } else {
      AllowedOAuthFlows = Array.isArray(AllowedOAuthFlows) ? AllowedOAuthFlows : [AllowedOAuthFlows];
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
};

/*
  Deserialize oAuthData for CLI update flow
*/
const parseOAuthMetaData = (previousAnswers: any): void => {
  if (previousAnswers && previousAnswers.oAuthMetadata) {
    previousAnswers = Object.assign(previousAnswers, JSON.parse(previousAnswers.oAuthMetadata));
    delete previousAnswers.oAuthMetadata;
  }
};

/**
 * Deserialize oAuthCredentials for CLI update flow
 */
export const parseOAuthCreds = (providers: string[], metadata: any, envCreds: any): Record<string, unknown> => {
  const providerKeys: Record<string, unknown> = {};
  try {
    const parsedMetaData = JSON.parse(metadata);
    const parsedCreds = JSON.parse(envCreds);
    providers.map(providerName => providerName.toLowerCase()).forEach((providerName: string) => {
      const provider: {authorize_scopes: string} | undefined = parsedMetaData.find((currentProvider: any) => currentProvider.ProviderName === providerName);
      const creds = parsedCreds.find((currentProvider: any) => currentProvider.ProviderName === providerName);
      if (providerName === 'SignInWithApple') {
        providerKeys[`${providerName}ClientIdUserPool`] = creds?.client_id;
        providerKeys[`${providerName}TeamIdUserPool`] = creds?.team_id;
        providerKeys[`${providerName}KeyIdUserPool`] = creds?.key_id;
        providerKeys[`${providerName}PrivateKeyUserPool`] = creds?.private_key;
      } else {
        providerKeys[`${providerName}AppIdUserPool`] = creds?.client_id;
        providerKeys[`${providerName}AppSecretUserPool`] = creds?.client_secret;
      }
      providerKeys[`${providerName}AuthorizeScopes`] = provider?.authorize_scopes?.split?.(',');
    });
  } catch (e) {
    return {};
  }
  return providerKeys;
};

/*
  Handle updates
*/
/* eslint-disable no-param-reassign */
const handleUpdates = (context: $TSContext, coreAnswers: any): any => {
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
    const oAuthCreds = parseOAuthCreds(authProvidersUserPool, hostedUIProviderMeta, hostedUIProviderCreds);
    context.updatingAuth = Object.assign(context.updatingAuth, oAuthCreds);
  }

  if (context.updatingAuth && context.updatingAuth.authSelections === 'identityPoolOnly') {
    coreAnswers.authSelections = 'identityPoolAndUserPool';
  }
};
/* eslint-enable no-param-reassign */

/*
  Adding lambda triggers
*/
const lambdaFlow = async (context: $TSContext, answers: any):Promise<any> => {
  const triggers = await context.amplify.triggerFlow(context, 'cognito', 'auth', answers);
  return triggers || answers;
};

export const getIAMPolicies = (context: $TSContext, resourceName: any, crudOptions: any):any => {
  let policy = {};
  const actions: any[] = [];

  crudOptions.forEach((crudOption: any) => {
    switch (crudOption) {
      case 'create':
        actions.push(
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
      case 'update':
        actions.push(
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
      case 'read':
        actions.push(
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
      case 'delete':
        actions.push(
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
      default:
        console.log(`${crudOption} not supported`);
    }
  });

  let userPoolReference;

  const { amplifyMeta } = context.amplify.getProjectDetails();

  const authResource = _.get(amplifyMeta, [category, resourceName], undefined);

  if (!authResource) {
    throw new Error(`Cannot get resource: ${resourceName} from '${category}' category.`);
  }

  if (authResource.serviceType === 'imported') {
    const userPoolId = _.get(authResource, ['output', 'UserPoolId'], undefined);

    if (!userPoolId) {
      throw new Error(`Cannot read the UserPoolId attribute value from the output section of resource: '${resourceName}'.`);
    }

    userPoolReference = userPoolId;
  } else {
    userPoolReference = {
      Ref: `${category}${resourceName}UserPoolId`,
    };
  }

  policy = {
    Effect: 'Allow',
    Action: actions,
    Resource: [
      {
        'Fn::Join': ['', ['arn:aws:cognito-idp:', { Ref: 'AWS::Region' }, ':', { Ref: 'AWS::AccountId' }, ':userpool/', userPoolReference]],
      },
    ],
  };

  const attributes = ['UserPoolId'];

  return { policy, attributes };
};
