const inquirer = require('inquirer');
const chalk = require('chalk');
const chalkpipe = require('chalk-pipe');
const thirdPartyMap = require('../assets/string-maps').authProviders;

async function serviceWalkthrough(
  context,
  defaultValuesFilename,
  stringMapsFilename,
  serviceMetadata,
) {
  const { inputs } = serviceMetadata;
  const { amplify } = context;
  const { parseInputs } = require(`${__dirname}/../question-factories/core-questions.js`);
  const projectType = amplify.getProjectConfig().frontend;


  let coreAnswers = {};
  /* eslint-disable */

  // QUESTION LOOP
  for (let i = 0; i < inputs.length; i = i + 1) {
    // If we are on the second or higher question, we first check to see if the user selected 'learn more' and if learn more text is present on the question object.
    if (i > 0 && new RegExp(/learn/i).test(coreAnswers[inputs[i-1].key]) && inputs[i-1].learnMore) {
      // To support line breaks between paragraphs for readability, we splut up the string and joint with template string hard returns
      const helpTextArray = inputs[i-1].learnMore.split("\n");
      // !IMPORTANT! Do no change indentation or carriage returns in template string. !IMPORTANT!
      const helpText = `
${helpTextArray.join(`
        
`)}
      
`;
      inputs[i-1].prefix = chalkpipe(null, chalk.green)(helpText);  // Assign prefix text with chalkpipe 
      i-- // Decrement the loop iterator by one to 'rewind' to the last question with the suffix displayed.

    };
  /* eslint-enable */

    // If user selected default, jump out of the loop
    if (coreAnswers.useDefault === 'default') {
      break;
    }

    const q = await parseInputs(
      inputs[i],
      amplify,
      defaultValuesFilename,
      stringMapsFilename,
      coreAnswers,
      context,
    );

    // Update answers with spreading of previous values and those returning from question prompt
    coreAnswers = { ...coreAnswers, ...(await inquirer.prompt(q)) };
  }


  // POST-QUESTION LOOP PARSING
  /*
    create key/value pairs of third party auth providers,
    where key = name accepted by updateIdentityPool API call and value = id entered by user
    TODO: evalutate need for abstracted version of this operation
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
