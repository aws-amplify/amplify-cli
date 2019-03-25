const inquirer = require('inquirer');
const chalk = require('chalk');
const chalkpipe = require('chalk-pipe');
const { authProviders, attributeProviderMap } = require('../assets/string-maps');


async function serviceWalkthrough(
  context,
  defaultValuesFilename,
  stringMapsFilename,
  serviceMetadata,
  coreAnswers = {},
) {
  let { inputs } = serviceMetadata;
  const { amplify } = context;
  const { parseInputs } = require(`${__dirname}/../question-factories/core-questions.js`);
  const projectType = amplify.getProjectConfig().frontend;
  const defaultValuesSrc = `${__dirname}/../assets/${defaultValuesFilename}`;
  const { getAllDefaults } = require(defaultValuesSrc);

  if (context.updatingAuth && context.updatingAuth.oAuthMetadata) {
    parseOAuthMetaData(context.updatingAuth);
  }

  if (context.updatingAuth && context.updatingAuth.authProvidersUserPool) {
    const { resourceName, authProvidersUserPool, hostedUIProviderMeta } = context.updatingAuth;
    const { hostedUIProviderCreds } = context.amplify.loadEnvResourceParameters(context, 'auth', resourceName);
    /* eslint-disable */
    const oAuthCreds = parseOAuthCreds(context, authProvidersUserPool, hostedUIProviderMeta, resourceName, hostedUIProviderCreds);
    /* eslint-enable */
    context.updatingAuth = Object.assign(context.updatingAuth, oAuthCreds);
  }

  if (context.updatingAuth) {
    inputs = filterInputs(coreAnswers, context, inputs);
  }


  // QUESTION LOOP
  let j = 0;
  while (j < inputs.length) {
    const questionObj = inputs[j];

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

    // LEARN MORE BLOCK
    if (new RegExp(/learn/i).test(answer[questionObj.key]) && questionObj.learnMore) {
      const helpText = `\n${questionObj.learnMore.replace(new RegExp('[\\n]', 'g'), '\n\n')}\n\n`;
      questionObj.prefix = chalkpipe(null, chalk.green)(helpText);
    // ITERATOR BLOCK
    } else if (
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
    // INCREMENT QUESTION LOOP COUNTER
    } else if (coreAnswers.useDefault === 'default') {
      if (!context.updatingAuth) {
        const attributeInputs = inputs.filter(i => ['requiredAttributes', 'usernameAttributes'].includes(i.key));
        for (let a = 0; a < attributeInputs.length; a += 1) {
          const attributeQuestion = await parseInputs(
            attributeInputs[a],
            amplify,
            defaultValuesFilename,
            stringMapsFilename,
            coreAnswers,
            context,
          );
          attributeQuestion.when = true;
          const attributeAnswer = await inquirer.prompt(attributeQuestion);
          coreAnswers = { ...coreAnswers, ...attributeAnswer };
        }
      }
      break;
    } else {
      j += 1;
      coreAnswers = { ...coreAnswers, ...answer };
    }
  }

  // POST-QUESTION LOOP PARSING
  // formatting data for identity pool providers
  if (coreAnswers.thirdPartyAuth) {
    identityPoolProviders(coreAnswers, projectType);
  }

  // formatting data for user pool providers / hosted UI
  if (coreAnswers.authProvidersUserPool) {
    /* eslint-disable */
    coreAnswers = Object.assign(coreAnswers, userPoolProviders(coreAnswers.authProvidersUserPool, coreAnswers, context.updatingAuth));
    /* eslint-enable */
  }

  // making sure that on create we have write attributes based on required Attributes
  if (!context.updatingAuth && !coreAnswers.userpoolClientWriteAttributes) {
    const writeDefaults = { userpoolClientWriteAttributes: coreAnswers.requiredAttributes };
    coreAnswers = Object.assign(coreAnswers, writeDefaults);
  }

  // formatting oAuthMetaData
  structureoAuthMetaData(coreAnswers, context, getAllDefaults, amplify);

  if (coreAnswers.usernameAttributes) {
    if (coreAnswers.usernameAttributes === 'username') {
      delete coreAnswers.usernameAttributes;
    } else {
      coreAnswers.usernameAttributes = coreAnswers.usernameAttributes.split(', ');
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
  answers.requiredAttributes = answers.requiredAttributes.concat('username');
  const res = {};
  if (oAuthProviders) {
    res.hostedUIProviderMeta = JSON.stringify(oAuthProviders
      .map((el) => {
        const delimmiter = el === 'Facebook' ? ',' : ' ';
        const scopes = [];
        const maps = {};
        answers.requiredAttributes.forEach((a) => {
          const attributeKey = attributeProviderMap[a];
          if (attributeKey && attributeKey[`${el.toLowerCase()}`] && attributeKey[`${el.toLowerCase()}`].scope) {
            if (scopes.indexOf(attributeKey[`${el.toLowerCase()}`].scope) === -1) {
              scopes.push(attributeKey[`${el.toLowerCase()}`].scope);
            }
          }
          if (el === 'Google') {
            scopes.unshift('open_id');
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
function parseOAuthCreds(context, providers, metadata, resourceName, envCreds) {
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
function filterInputs(coreAnswers, context, inputs) {
  if (context.updateFlow && context.updateFlow.type && context.updateFlow.type !== 'all') {
    coreAnswers.updateFlow = context.updateFlow.type;
    inputs = inputs.filter(i => i.updateGroups && i.updateGroups.includes(coreAnswers.updateFlow));
  } else if (!context.updateFlow || context.updateFlow.type === 'all') {
    inputs = inputs.filter(i => !i.updateGroups || i.updateGroups.includes('all'));
  }
  return inputs;
}

module.exports = { serviceWalkthrough, userPoolProviders, parseOAuthCreds };
