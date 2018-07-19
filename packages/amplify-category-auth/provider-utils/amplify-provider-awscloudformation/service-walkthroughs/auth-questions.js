const inquirer = require('inquirer');
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
  let appClientAnswers = {};

  const defaultPromptInputs = [
    {
      key: 'useDefault',
      question: 'Do you want to use a default IAM user pool/identity pool template?',
      type: 'confirm',
      default: true,
    },
    {
      key: 'authSelections',
      question: 'Select the authentication/authorization services that you want to use:',
      required: true,
      type: 'list',
      map: 'authSelections',
    },
    {
      key: 'resourceName',
      set: 'core',
      question: 'Please provide a friendly name for your resource that will be used to label this category in the project:',
      validation: {
        operator: 'regex',
        value: '^[a-zA-Z0-9]+$',
        onErrorMsg: 'Resource name should be alphanumeric',
      },
      required: true,
    },
  ];

  const coreQuestionInputs = inputs.filter(i => i.set === 'core');

  const appClientInputs = inputs.filter(i => i.set === 'app-client');

  const defaultQuestions = parseInputs(
    defaultPromptInputs,
    amplify,
    defaultValuesFilename,
    stringMapsFilename,
  );

  const defaultConfigAnswer = await inquirer.prompt(defaultQuestions);

  const coreQuestions = parseInputs(
    coreQuestionInputs,
    amplify,
    defaultValuesFilename,
    stringMapsFilename,
    {
      ...defaultConfigAnswer,
    },
  );

  if (defaultConfigAnswer.useDefault === false) {
    coreAnswers = await inquirer.prompt(coreQuestions);

    if (defaultConfigAnswer.authSelections === 'identityPoolAndUserPool') {
      const appClientQuestions = parseInputs(
        appClientInputs,
        amplify,
        defaultValuesFilename,
        stringMapsFilename,
        {
          ...defaultConfigAnswer,
          ...coreAnswers,
        },
      );
      appClientAnswers = await inquirer.prompt(appClientQuestions);
    }
  }

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
    ...defaultConfigAnswer,
    ...coreAnswers,
    ...appClientAnswers,
    ...roles,
  };
}

module.exports = { serviceWalkthrough };
