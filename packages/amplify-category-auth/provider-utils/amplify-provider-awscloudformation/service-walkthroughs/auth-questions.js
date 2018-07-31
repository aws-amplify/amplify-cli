const inquirer = require('inquirer');
const chalk = require('chalk');
const chalkpipe = require('chalk-pipe')
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

  let coreAnswers = {};
  const coreQuestionInputs = inputs;


  /* Begin looping through questions */
  for (let i=0; i < coreQuestionInputs.length; i ++) {

    /* 
      If we are on the second or higher question, we first check to see if the user selected 'learn more',
      and if they did we append the learn more text as a chalk-styled suffix to the last question
      and decrement the loop iterator by one to 'rewind' to the last question with the suffix displayed.
      */
    if (i > 0 && new RegExp(/learn/i).test(coreAnswers[coreQuestionInputs[i-1].key]) && coreQuestionInputs[i-1].learnMore) {
     
// !IMPORTANT! Do no change indentation in template string.
      const helpTextArray = coreQuestionInputs[i-1].learnMore.split("\n");
      const helpText = `
${helpTextArray.join(
`
        
`
      )}
      
`;
      
      coreQuestionInputs[i-1].prefix = chalkpipe(null, chalk.magenta)(helpText);
      i--

    };

    if (coreAnswers['useDefault'] === 'default'){
      break;
    }

    let q = parseInputs(
        coreQuestionInputs[i],
        amplify,
        defaultValuesFilename,
        stringMapsFilename,
        coreAnswers,
        context
    );

    coreAnswers = { ...coreAnswers, ...(await inquirer.prompt(q)) }
  };

  /*
    create key/value pairs of third party auth providers,
    where key = name accepted by updateIdentityPool API call and value = id entered by user
    TODO: evalutate need for abstracted version of this operation
  */
  if (coreAnswers.thirdPartyAuth) {
    coreAnswers.selectedParties = {};
    thirdPartyMap.forEach((e) => {
      if (coreAnswers[e.answerHashKey]) {
        coreAnswers.selectedParties[e.value] = coreAnswers[e.answerHashKey];
      }
      /*
        certain third party providers (such as Twitter) require multiple values,
        which Cognito requires to be a concatenated string -
        so here we build the string using 'concatKeys' defined in the thirdPartyMap
      */
      if (coreAnswers[e.answerHashKey] && e.concatKeys) {
        e.concatKeys.forEach((i) => {
          coreAnswers.selectedParties[e.value] = coreAnswers.selectedParties[e.value].concat(';', coreAnswers[i]);
        });
      }
    });
  }

  const roles = await context.amplify.executeProviderUtils(context, 'amplify-provider-awscloudformation', 'staticRoles');


  return {
    ...coreAnswers,
    ...roles,
  };
}

module.exports = { serviceWalkthrough };
