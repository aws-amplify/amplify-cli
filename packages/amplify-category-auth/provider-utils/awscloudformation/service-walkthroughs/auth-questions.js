const inquirer = require('inquirer');
const chalk = require('chalk');
const chalkpipe = require('chalk-pipe');
const thirdPartyMap = require('../assets/string-maps').authProviders;


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
  /*
    create key/value pairs of third party auth providers,
    where key = name accepted by updateIdentityPool API call and value = id entered by user
    TODO: evaluate need for abstracted version of this operation
  */
  if (coreAnswers.thirdPartyAuth) {
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

  return {
    ...coreAnswers,
  };
}

module.exports = { serviceWalkthrough };
