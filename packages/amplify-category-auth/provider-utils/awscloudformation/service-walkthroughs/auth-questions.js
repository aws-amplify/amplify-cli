const inquirer = require('inquirer');
const chalk = require('chalk');
const chalkpipe = require('chalk-pipe');
const thirdPartyMap = require('../assets/string-maps').authProviders;
const facebook = require('../assets/cognito-defaults').faceBookAttributeMap;
const google = require('../assets/cognito-defaults').googleAttributeMap;
const amazon = require('../assets/cognito-defaults').amazonAttributeMap;


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

  if (context.updatingAuth && context.updatingAuth.oAuthMetadata) {
    parseOAuthMetaData(context.updatingAuth);
  }

  if (context.updatingAuth && context.updatingAuth.authProvidersUserPool) {
    parseOAuthCreds(context, amplify);
  }

  // loop through questions
  let j = 0;
  while (j < inputs.length) {
    const questionObj = inputs[j];
    const q = await parseInputs(
      questionObj,
      amplify,
      defaultValuesFilename,
      stringMapsFilename,
      coreAnswers,
      context,
    );
    const answer = await inquirer.prompt(q);
    // user has selected learn more. Don't advance the question
    if (new RegExp(/learn/i).test(answer[questionObj.key]) && questionObj.learnMore) {
      const helpText = `\n${questionObj.learnMore.replace(new RegExp('[\\n]', 'g'), '\n\n')}\n\n`;
      questionObj.prefix = chalkpipe(null, chalk.green)(helpText);
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
    } else {
      // next question
      j += 1;
      coreAnswers = { ...coreAnswers, ...answer };
    }
    if (coreAnswers.useDefault === 'default') {
      break;
    }
  }

  // POST-QUESTION LOOP PARSING

  // formatting data for identity pool providers
  if (coreAnswers.thirdPartyAuth) {
    identityPoolProviders(coreAnswers, projectType);
  }

  // formatting data for user pool providers / hosted UI
  if (coreAnswers.authProvidersUserPool) {
    userPoolProviders(coreAnswers);
  }

  // formatting oAuthMetaData
  if (coreAnswers.hostedUI) {
    structureoAuthMetaData(coreAnswers);
  }

  return {
    ...coreAnswers,
  };
}

/*
  create key/value pairs of third party auth providers,
  where key = name accepted by updateIdentityPool API call and value = id entered by user
  TODO: evaluate need for abstracted version of this operation
*/
function identityPoolProviders(coreAnswers, projectType) {
  coreAnswers.selectedParties = {};
  thirdPartyMap.forEach((e) => {
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

function userPoolProviders(coreAnswers) {
  const maps = { facebook, google, amazon };
  if (coreAnswers.authProvidersUserPool) {
    coreAnswers.hostedUIProviderMeta = JSON.stringify(coreAnswers.authProvidersUserPool
      .map(el => ({ ProviderName: el, authorize_scopes: coreAnswers[`${el.toLowerCase()}AuthorizeScopes`].join(), AttributeMapping: maps[`${el.toLowerCase()}`] })));
    coreAnswers.hostedUIProviderCreds = JSON.stringify(coreAnswers.authProvidersUserPool
      .map(el => ({ ProviderName: el, client_id: coreAnswers[`${el.toLowerCase()}AppIdUserPool`], client_secret: coreAnswers[`${el.toLowerCase()}AppSecretUserPool`] })));
  }
}

function structureoAuthMetaData(coreAnswers) {
  if (coreAnswers.hostedUI) {
    const {
      AllowedOAuthFlows,
      AllowedOAuthScopes,
      CallbackURLs,
      LogoutURLs,
    } = coreAnswers;
    coreAnswers.oAuthMetadata = JSON.stringify({
      AllowedOAuthFlows,
      AllowedOAuthScopes,
      CallbackURLs,
      LogoutURLs,
    });
  }
}

function parseOAuthMetaData(previousAnswers) {
  if (previousAnswers && previousAnswers.oAuthMetadata) {
    previousAnswers = Object.assign(previousAnswers, JSON.parse(previousAnswers.oAuthMetadata));
    delete previousAnswers.oAuthMetadata;
  }
}

function parseOAuthCreds(context, amplify) {
  const previousAnswers = context.updatingAuth;
  if (previousAnswers && previousAnswers.authProvidersUserPool) {
    const providers = previousAnswers.authProvidersUserPool;
    const parsedMetaData = JSON.parse(previousAnswers.hostedUIProviderMeta);
    const rawCreds = amplify.loadEnvResourceParameters(context, 'auth', previousAnswers.resourceName);
    if (rawCreds) {
      const parsedCreds = JSON.parse(rawCreds.hostedUIProviderCreds);
      providers.forEach((el) => {
        const provider = parsedMetaData.find(i => i.ProviderName === el);
        const creds = parsedCreds.find(i => i.ProviderName === el);
        previousAnswers[`${el.toLowerCase()}AppIdUserPool`] = creds.client_id;
        previousAnswers[`${el.toLowerCase()}AppSecretUserPool`] = creds.client_secret;
        previousAnswers[`${el.toLowerCase()}AuthorizeScopes`] = provider.authorize_scopes.split(',');
      });
    }
  }
}

module.exports = { serviceWalkthrough };
