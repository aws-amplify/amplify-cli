const inquirer = require('inquirer');
const path = require('path');
const fs = require('fs-extra');

const category = 'interactions';
const parametersFileName = 'lex-params.json';
const cfnParametersFilename = 'parameters.json';
const serviceName = 'Lex';
const fuzzy = require('fuzzy');

async function addWalkthrough(context, defaultValuesFilename, serviceMetadata) {
  return configure(context, defaultValuesFilename, serviceMetadata);
}

function updateWalkthrough(context, defaultValuesFilename, serviceMetadata) {
  // const resourceName = resourceAlreadyExists(context);
  const { amplify } = context;
  context.exeInfo = amplify.getProjectDetails();
  const { amplifyMeta } = context.exeInfo;

  const lexResources = {};

  Object.keys(amplifyMeta[category]).forEach((resourceName) => {
    if (amplifyMeta[category][resourceName].service === serviceName) {
      lexResources[resourceName] = amplifyMeta[category][resourceName];
    }
  });

  if (!amplifyMeta[category] || Object.keys(lexResources).length === 0) {
    context.print.error('No resources to update. You need to add a resource.');
    process.exit(0);
    return;
  }
  const resources = Object.keys(lexResources);
  const question = [{
    name: 'resourceName',
    message: 'Specify the resource that you would want to update',
    type: 'list',
    choices: resources,
  }];

  return inquirer.prompt(question)
    .then(answer => configure(
      context, defaultValuesFilename,
      serviceMetadata, answer.resourceName,
    ));
}

// Goes through Lex walkthrough
async function configure(context, defaultValuesFilename, serviceMetadata, resourceName) {
  const { amplify, print } = context;
  context.exeInfo = amplify.getProjectDetails();

  const { inputs, samples } = serviceMetadata;

  const defaultValuesSrc = `${__dirname}/../default-values/${defaultValuesFilename}`;
  const { getAllDefaults } = require(defaultValuesSrc);

  const defaultValues = getAllDefaults(amplify.getProjectDetails());

  const projectBackendDirPath = context.amplify.pathManager.getBackendDirPath();

  print.info('');
  print.info('Welcome to the Amazon Lex chatbot wizard');
  print.info('You will be asked a series of questions to help determine how to best construct your chatbot.');
  print.info('');

  // Ask resource name question

  const resourceQuestion = {
    type: inputs[0].type,
    name: inputs[0].key,
    message: inputs[0].question,
    validate: amplify.inputValidation(inputs[0]),
    default: (answer) => {
      const defaultValue = defaultValues[inputs[0].key];
      return answer.resourceName || defaultValue;
    },
  };

  let answer = {};
  let startChoice;

  if (!resourceName) {
    answer = await inquirer.prompt(resourceQuestion);
    resourceName = answer.resourceName;

    // If it is a new chatbot, ask if they want to start with a sample or from scratch
    const startQuestion = {
      type: inputs[1].type,
      name: inputs[1].key,
      message: inputs[1].question,
      choices: inputs[1].options,
    };

    startChoice = await inquirer.prompt(startQuestion);
  } else {
    startChoice = { startChoice: 'Update an existing chatbot' };
  }

  const botNameQuestion = {
    type: inputs[3].type,
    name: inputs[3].key,
    message: inputs[3].question,
    validate: amplify.inputValidation(inputs[3]),
    // default: defaultValues[inputs[3].key]
  };

  const coppaQuestion = {
    type: inputs[4].type,
    name: inputs[4].key,
    message: inputs[4].question,
    default: inputs[4].default,
  };

  let botName;
  let intentName;
  let answers;
  let parameters;
  let deleteIntentConfirmed = false;

  if (startChoice[inputs[1].key] === 'Start with a sample') {
    // TODO: get list of samples from Lex, if possible
    // Currently samples are hardcoded in supported-services.json
    const sampleChatbotQuestion = {
      type: inputs[2].type,
      name: inputs[2].key,
      message: inputs[2].question,
      choices: inputs[2].options,
    };
    botName = await inquirer.prompt(sampleChatbotQuestion);
    botName = botName[inputs[2].key];

    let coppa = await inquirer.prompt(coppaQuestion);
    coppa = coppa[inputs[4].key];
    if (coppa) {
      print.info('');
      print.info('You must obtain any required verifiable parental consent under COPPA.');
      print.info('');
    }

    const intents = samples[botName];

    answers = {
      resourceName,
      intents,
      outputVoice: 'Matthew',
      botName,
      coppa,
    };
  } else if (startChoice[inputs[1].key] === 'Update an existing chatbot') {
    if (resourceName) {
      const resourceDirPath = path.join(projectBackendDirPath, category, resourceName);
      const parametersFilePath = path.join(resourceDirPath, parametersFileName);
      try {
        parameters = context.amplify.readJsonFile(parametersFilePath);
      } catch (e) {
        parameters = {};
      }
    } else {
      context.print.error('No chatbots to update');
    }

    const addUpdateIntentQuestion = {
      type: inputs[6].type,
      name: inputs[6].key,
      message: inputs[6].question,
      choices: inputs[6].options,
    };
    let utterances = [];
    const intents = [];
    let slots = [];
    let newSlotTypes = [];
    const intentChoice = await inquirer.prompt(addUpdateIntentQuestion);
    if (intentChoice[inputs[6].key] === 'Update an existing intent') {
      const intentList = parameters.intents.map(x => x.intentName);
      const chooseIntent = {
        type: inputs[7].type,
        name: inputs[7].key,
        message: inputs[7].question,
        choices: intentList,
      };
      intentName = await inquirer.prompt(chooseIntent);
      intentName = intentName[inputs[7].key];

      const addUtteranceQuestion = {
        type: inputs[8].type,
        name: inputs[8].key,
        message: inputs[8].question,
        default: inputs[8].default,
      };
      const addUtteranceAnswer = await inquirer.prompt(addUtteranceQuestion);
      if (addUtteranceAnswer[inputs[8].key]) {
        utterances = (await addUtterance(context, intentName, botName, resourceName, serviceMetadata));
      }

      const addSlotQuestion = {
        type: inputs[9].type,
        name: inputs[9].key,
        message: inputs[9].question,
        default: inputs[9].default,
      };
      const addSlotAnswer = await inquirer.prompt(addSlotQuestion);

      let slotReturn = [];
      if (addSlotAnswer[inputs[9].key]) {
        slotReturn = await addSlot(context, intentName, botName, resourceName, serviceMetadata, parameters);
      }
      if (slotReturn.length > 1) {
        newSlotTypes = slotReturn[1];
      }
      slots = slotReturn[0];
    } else if (intentChoice[inputs[6].key] === 'Add an intent') {
      let continueAddingIntents = true;
      const addAnotherIntentQuestion = {
        type: inputs[23].type,
        name: inputs[23].key,
        message: inputs[23].question,
        default: inputs[23].default,
      };
      while (continueAddingIntents) {
        intents.push(await addIntent(context, botName, resourceName, serviceMetadata, intents, parameters));
        continueAddingIntents = await inquirer.prompt(addAnotherIntentQuestion);
        continueAddingIntents = continueAddingIntents[inputs[23].key];
      }
    } else if (intentChoice[inputs[6].key] === 'Delete an intent') {
      const intentList = parameters.intents.map(x => x.intentName);
      const chooseIntent = {
        type: inputs[7].type,
        name: inputs[7].key,
        message: inputs[7].question,
        choices: intentList,
      };
      intentName = await inquirer.prompt(chooseIntent);
      intentName = intentName[inputs[7].key];

      const deleteIntentConfirmation = {
        type: inputs[31].type,
        name: inputs[31].key,
        message: inputs[31].question,
      };
      deleteIntentConfirmed = await inquirer.prompt(deleteIntentConfirmation);
      deleteIntentConfirmed = deleteIntentConfirmed[inputs[31].key];
    } else {
      context.print.error('Valid option not chosen');
    }
    answers = {
      resourceName,
      botName: parameters.botName,
      intentName,
      utterances,
      intents,
      slots,
      newSlotTypes,
    };
  } else if (startChoice[inputs[1].key] === 'Start from scratch') {
    botName = await inquirer.prompt(botNameQuestion);
    botName = botName[inputs[3].key];

    const outputVoiceQuestion = {
      type: inputs[10].type,
      name: inputs[10].key,
      message: inputs[10].question,
      choices: inputs[10].options,
    };
    let outputVoice = await inquirer.prompt(outputVoiceQuestion);
    outputVoice = outputVoice[inputs[10].key];

    const sessionTimeoutQuestion = {
      type: inputs[11].type,
      name: inputs[11].key,
      message: inputs[11].question,
      default: defaultValues[inputs[11].key],
    };
    let sessionTimeout = await inquirer.prompt(sessionTimeoutQuestion);
    sessionTimeout = sessionTimeout[inputs[11].key];

    let coppa = await inquirer.prompt(coppaQuestion);
    coppa = coppa[inputs[4].key];
    if (coppa) {
      print.info('');
      print.info('You must obtain any required verifiable parental consent under COPPA.');
      print.info('');
    }

    print.info('');
    print.info('First create an intent for your new chatbot. An intent represents an action that the user wants to perform.');
    print.info('');

    let continueAddingIntents = true;
    const addAnotherIntentQuestion = {
      type: inputs[23].type,
      name: inputs[23].key,
      message: inputs[23].question,
      default: inputs[23].default,
    };
    const intents = [];
    while (continueAddingIntents) {
      intents.push(await addIntent(context, botName, resourceName, serviceMetadata, intents, parameters));
      continueAddingIntents = await inquirer.prompt(addAnotherIntentQuestion);
      continueAddingIntents = continueAddingIntents[inputs[23].key];
    }

    answers = {
      resourceName,
      botName,
      intents,
      outputVoice,
      sessionTimeout,
      coppa,
    };
  } else {
    context.print.error('Valid option not chosen');
  }

  if (parameters) {
    if (answers.intentName) {
      if (deleteIntentConfirmed) {
        parameters.intents = parameters.intents.filter(intent => intent.intentName !== answers.intentName);
      } else {
        parameters.intents.forEach((intent) => {
          if (intent.intentName === answers.intentName) {
            if (answers.utterances) {
              intent.utterances = intent.utterances.concat(answers.utterances);
            }
            if (answers.slots) {
              intent.slots = intent.slots.concat(answers.slots);
            }
            if (answers.newSlotTypes) {
              if (intent.newSlotTypes) {
                intent.newSlotTypes = intent.newSlotTypes.concat(answers.newSlotTypes);
              } else {
                intent.newSlotTypes = answers.newSlotTypes;
              }
            }
          }
        });
      }
    } else if (!answers.intents) {
      context.print.error('Valid option not chosen');
    } else {
      parameters.intents = parameters.intents.concat(answers.intents);
    }
    answers = parameters;
  }
  return answers;
}

async function addIntent(context, botName, resourceName, serviceMetadata, intents, parameters) {
  const { inputs } = serviceMetadata;
  const { amplify, print } = context;

  const intentNameQuestion = {
    type: inputs[12].type,
    name: inputs[12].key,
    message: inputs[12].question,
    validate: amplify.inputValidation(inputs[12]),
  };

  let intentName;
  intentName = await inquirer.prompt(intentNameQuestion);
  intentName = intentName[inputs[12].key];

  // Checks for duplicate intent names
  while ((intents.filter(intent => intent.intentName === intentName).length > 0)
          || (parameters && parameters.intents.filter(intent => intent.intentName === intentName).length > 0)) {
    print.info('');
    print.info('Intent names must be unique');
    print.info('');
    intentName = await inquirer.prompt(intentNameQuestion);
    intentName = intentName[inputs[12].key];
  }

  const utterances = await addUtterance(context, intentName, botName, resourceName, serviceMetadata);

  print.info('');
  print.info('Now, add a slot to your intent. A slot is data the user must provide to fulfill the intent.');
  print.info('');

  let slots = [];
  let newSlotTypes = [];
  const slotReturn = await addSlot(context, intentName, botName, resourceName, serviceMetadata, parameters);
  if (slotReturn.length > 1) {
    newSlotTypes = slotReturn[1];
  }
  slots = slotReturn[0];

  const addConfirmationQuestion = {
    type: inputs[18].type,
    name: inputs[18].key,
    message: inputs[18].question,
    default: inputs[18].default,
  };
  let confirmationQuestion;
  let cancelMessage;
  const addConfirmation = await inquirer.prompt(addConfirmationQuestion);
  if (addConfirmation[inputs[18].key]) {
    const confirmationQuestionQuestion = {
      type: inputs[19].type,
      name: inputs[19].key,
      message: inputs[19].question,
      validate: amplify.inputValidation(inputs[19]),
    };
    confirmationQuestion = await inquirer.prompt(confirmationQuestionQuestion);
    confirmationQuestion = confirmationQuestion[inputs[19].key];

    const cancelMessageQuestion = {
      type: inputs[20].type,
      name: inputs[20].key,
      message: inputs[20].question,
      validate: amplify.inputValidation(inputs[20]),
    };
    cancelMessage = await inquirer.prompt(cancelMessageQuestion);
    cancelMessage = cancelMessage[inputs[20].key];
  }

  const intentFulfillmentQuestion = {
    type: inputs[21].type,
    name: inputs[21].key,
    message: inputs[21].question,
    choices: inputs[21].options,
  };
  let intentFulfillment = await inquirer.prompt(intentFulfillmentQuestion);
  intentFulfillment = intentFulfillment[inputs[21].key];

  let lambda;
  if (intentFulfillment === 'lambdaFunction') {
    lambda = await askLambda(context);
  }

  return {
    lambda,
    cancelMessage,
    confirmationQuestion,
    slots,
    utterances,
    intentName,
    newSlotTypes,
  };
}

async function addUtterance(context, intentName, botName, resourceName, serviceMetadata) {
  const { inputs } = serviceMetadata;
  const { amplify } = context;
  const addAnotherUtteranceQuestion = {
    type: inputs[24].type,
    name: inputs[24].key,
    message: inputs[24].question,
    default: inputs[24].default,
  };
  const utteranceQuestion = {
    type: inputs[13].type,
    name: inputs[13].key,
    message: inputs[13].question,
    validate: amplify.inputValidation(inputs[13]),
  };
  let addAnotherUtterance = true;
  const utterances = [];
  while (addAnotherUtterance) {
    let utterance = await inquirer.prompt(utteranceQuestion);
    utterance = utterance[inputs[13].key];
    utterances.push(utterance);

    addAnotherUtterance = await inquirer.prompt(addAnotherUtteranceQuestion);
    addAnotherUtterance = addAnotherUtterance[inputs[24].key];
  }
  return utterances;
}

async function addSlot(context, intentName, botName, resourceName, serviceMetadata, parameters) {
  const { inputs } = serviceMetadata;
  const { amplify, print } = context;
  const addAnotherSlotQuestion = {
    type: inputs[25].type,
    name: inputs[25].key,
    message: inputs[25].question,
    default: inputs[25].default,
  };
  const slotNameQuestion = {
    type: inputs[14].type,
    name: inputs[14].key,
    message: inputs[14].question,
    validate: amplify.inputValidation(inputs[14]),
  };
  const slotPromptQuestion = {
    type: inputs[16].type,
    name: inputs[16].key,
    message: inputs[16].question,
    validate: amplify.inputValidation(inputs[16]),
  };
  const slotRequiredQuestion = {
    type: inputs[17].type,
    name: inputs[17].key,
    message: inputs[17].question,
    default: inputs[17].default,
  };
  let addAnotherSlot = true;
  const slots = [];
  let newSlotTypeAdded = false;
  const newSlotTypes = [];
  while (addAnotherSlot) {
    const slot = {
      name: '', type: '', prompt: '', required: true, customType: false,
    };
    slot.name = await inquirer.prompt(slotNameQuestion);
    slot.name = slot.name[inputs[14].key];

    // Checks for duplicate slot names
    while ((slots.filter(existingSlot => existingSlot.name === slot.name).length > 0)
            || (parameters && parameters.intents.filter(intent => intent.intentName === intentName)[0] && parameters.intents.filter(intent => intent.intentName === intentName)[0].slots.filter(existingSlot => existingSlot.name === slot.name).length > 0)) {
      print.info('');
      print.info('Slot names must be unique');
      print.info('');
      slot.name = await inquirer.prompt(slotNameQuestion);
      slot.name = slot.name[inputs[14].key];
    }

    slot.type = await getSlotType(context, serviceMetadata, newSlotTypes, parameters);
    if (slot.type.slotTypeDescription) {
      newSlotTypes.push({
        slotType: slot.type.slotType,
        slotTypeDescription: slot.type.slotTypeDescription,
        slotValues: slot.type.slotValues,
      });
      slot.customType = true;
      newSlotTypeAdded = true;
      slot.type = newSlotTypes[newSlotTypes.length - 1].slotType;
    } else if (slot.type[1]) {
      slot.customType = true;
      slot.type = slot.type[0];
    } else {
      slot.type = slot.type[0];
    }

    slot.prompt = await inquirer.prompt(slotPromptQuestion);
    slot.prompt = slot.prompt[inputs[16].key];

    slot.required = await inquirer.prompt(slotRequiredQuestion);
    slot.required = slot.required[inputs[17].key];

    slots.push(slot);

    addAnotherSlot = await inquirer.prompt(addAnotherSlotQuestion);
    addAnotherSlot = addAnotherSlot[inputs[25].key];
  }
  if (newSlotTypeAdded) { return [slots, newSlotTypes]; }
  return [slots];
}

async function getSlotType(context, serviceMetadata, newSlotTypes, parameters) {
  const { inputs } = serviceMetadata;
  const { amplify, print } = context;
  let slotType;
  inquirer.registerPrompt('autocomplete', require('inquirer-autocomplete-prompt'));

  const slotTypeChoiceQuestion = {
    type: inputs[26].type,
    name: inputs[26].key,
    message: inputs[26].question,
    choices: inputs[26].options,
  };
  const slotTypeChoice = await inquirer.prompt(slotTypeChoiceQuestion);
  if (slotTypeChoice[inputs[26].key] === 'Amazon built-in slot type') {
    let slotTypeOptions = '';
    let builtInSlotTypes = [];
    let builtInSlotTypesReturn;
    do {
      builtInSlotTypesReturn = await context.amplify.executeProviderUtils(context, 'awscloudformation', 'getBuiltInSlotTypes', slotTypeOptions);
      builtInSlotTypes = builtInSlotTypes.concat(builtInSlotTypesReturn.slotTypes.map(builtinSlotType => builtinSlotType.signature));
      slotTypeOptions = builtInSlotTypesReturn.nextToken;
    } while (slotTypeOptions);

    function searchSlotTypes(answers, input) {
      input = input || '';
      return new Promise(((resolve) => {
        const fuzzyResult = fuzzy.filter(input, builtInSlotTypes);
        resolve(fuzzyResult.map(el => el.original));
      }));
    }

    const slotTypeQuestion = {
      type: 'autocomplete',
      name: inputs[15].key,
      message: inputs[15].question,
      source: searchSlotTypes,
    };
    slotType = await inquirer.prompt(slotTypeQuestion);
    return [slotType[inputs[15].key], false];
  } else if (slotTypeChoice[inputs[26].key] === "Slot type I've already made") {
    let slotTypes = await context.amplify.executeProviderUtils(context, 'awscloudformation', 'getSlotTypes');
    slotTypes = slotTypes.slotTypes.map(cloudSlotType => cloudSlotType.name);
    if (newSlotTypes) {
      slotTypes = slotTypes.concat(newSlotTypes.map(newSlotType => newSlotType.slotType));
    }
    if (parameters) {
      if (parameters.intents) {
        for (let i = 0; i < parameters.intents.length; i++) {
          if (parameters.intents[i].newSlotTypes) {
            slotTypes = slotTypes.concat(parameters.intents[i].newSlotTypes.map(paramsSlotType => paramsSlotType.slotType));
          }
        }
      }
    }
    slotTypes = slotTypes.filter((value, index, self) => self.indexOf(value) === index);

    const slotTypeQuestion = {
      type: 'list',
      name: inputs[15].key,
      message: inputs[15].question,
      choices: slotTypes,
    };
    slotType = await inquirer.prompt(slotTypeQuestion);
    return [slotType[inputs[15].key], true];
  } else if (slotTypeChoice[inputs[26].key] === 'Create a new slot type') {
    const slotTypeNameQuestion = {
      type: inputs[27].type,
      name: inputs[27].key,
      message: inputs[27].question,
      validate: amplify.inputValidation(inputs[27]),
    };
    const slotTypeDescriptionQuestion = {
      type: inputs[28].type,
      name: inputs[28].key,
      message: inputs[28].question,
      validate: amplify.inputValidation(inputs[28]),
    };
    const slotTypeValueQuestion = {
      type: inputs[29].type,
      name: inputs[29].key,
      message: inputs[29].question,
      validate: amplify.inputValidation(inputs[29]),
    };
    const continueAddingSlotValuesQuestion = {
      type: inputs[30].type,
      name: inputs[30].key,
      message: inputs[30].question,
      default: inputs[30].default,
    };
    slotType = await inquirer.prompt(slotTypeNameQuestion);
    slotType = slotType[inputs[27].key];

    let slotTypeDescription = await inquirer.prompt(slotTypeDescriptionQuestion);
    slotTypeDescription = slotTypeDescription[inputs[28].key];

    let continueAddingSlotValues = true;
    const slotValues = [];
    while (continueAddingSlotValues) {
      let slotValue = await inquirer.prompt(slotTypeValueQuestion);
      slotValue = slotValue[inputs[29].key];

      // Checks for duplicate slot values
      while (slotValues.filter(existingSlotValue => existingSlotValue === slotValue).length > 0) {
        print.info('');
        print.info('Slot values must be unique');
        print.info('');
        slotValue = await inquirer.prompt(slotTypeValueQuestion);
        slotValue = slotValue[inputs[29].key];
      }

      slotValues.push(slotValue);

      continueAddingSlotValues = await inquirer.prompt(continueAddingSlotValuesQuestion);
      continueAddingSlotValues = continueAddingSlotValues[inputs[30].key];
    }

    return {
      slotType,
      slotTypeDescription,
      slotValues,
    };
  }

  context.print.error('Valid option not chosen');
}

async function askLambda(context) {
  const projectRegion = context.exeInfo.amplifyMeta.providers.awscloudformation.Region;
  const accountID = context.exeInfo.amplifyMeta.providers.awscloudformation.AuthRoleArn.split(':')[4];

  const lambdaFunctions = await context.amplify.executeProviderUtils(context, 'awscloudformation', 'getLambdaFunctions', { region: projectRegion });

  const lambdaOptions = lambdaFunctions.map(lambdaFunction => ({
    value: {
      resourceName: lambdaFunction.FunctionName.replace(/[^0-9a-zA-Z]/gi, ''),
      Arn: lambdaFunction.FunctionArn,
      FunctionName: lambdaFunction.FunctionName,
    },
    name: `${lambdaFunction.FunctionName}`,
  }));

  if (lambdaOptions.length === 0) {
    context.print.error(`You do not have any lambda functions configured in the region ${projectRegion}`);
    return null;
  }

  const lambdaCloudOptionQuestion = {
    type: 'list',
    name: 'lambdaChoice',
    message: 'Select a Lambda function',
    choices: lambdaOptions,
  };

  const lambdaCloudOptionAnswer = await inquirer.prompt([lambdaCloudOptionQuestion]);

  return {
    region: projectRegion,
    accountId: accountID,
    lambdaArn: lambdaCloudOptionAnswer.lambdaChoice.Arn,
    lambdaName: lambdaCloudOptionAnswer.lambdaChoice.FunctionName,
  };
}

async function migrate(context, projectPath, resourceName) {
  const { amplify } = context;

  const targetDir = amplify.pathManager.getBackendDirPath();
  const resourceDirPath = path.join(targetDir, category, resourceName);
  const parametersFilePath = path.join(resourceDirPath, parametersFileName);
  const defaultValuesSrc = `${__dirname}/../default-values/lex-defaults.js`;
  const { getAllDefaults } = require(defaultValuesSrc);
  const defaultValues = getAllDefaults(amplify.getProjectDetails());

  let parameters;
  try {
    parameters = amplify.readJsonFile(parametersFilePath);
  } catch (e) {
    context.print.error(`Error reading api-params.json file for ${resourceName} resource`);
    throw e;
  }
  Object.assign(defaultValues, parameters);
  const pluginDir = `${__dirname}/../`;
  const copyJobs = [
    {
      dir: pluginDir,
      template: 'cloudformation-templates/lex-cloudformation-template.json.ejs',
      target: `${targetDir}/${category}/${resourceName}/${resourceName}-cloudformation-template.json`,
    },
  ];

  // copy over the files
  await context.amplify.copyBatch(context, copyJobs, defaultValues, true, false);

  // Create parameters.json file
  const cfnParameters = {
    authRoleArn: {
      'Fn::GetAtt': [
        'AuthRole',
        'Arn',
      ],
    },
    authRoleName: {
      Ref: 'AuthRoleName',
    },
    unauthRoleName: {
      Ref: 'UnauthRoleName',
    },
  };

  const cfnParametersFilePath = path.join(resourceDirPath, cfnParametersFilename);
  const jsonString = JSON.stringify(cfnParameters, null, 4);
  fs.writeFileSync(cfnParametersFilePath, jsonString, 'utf8');
}

function getIAMPolicies(resourceName, crudOptions) {
  let policy = {};
  const actions = [];

  crudOptions.forEach((crudOption) => {
    switch (crudOption) {
      case 'create': actions.push(
        'lex:Create*',
        'lex:Post*',
      );
        break;
      case 'update': actions.push('lex:Put*');
        break;
      case 'read': actions.push('lex:Get*');
        break;
      case 'delete': actions.push('lex:Delete*');
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
            'arn:aws:lex:',
            { Ref: 'AWS::Region' },
            ':',
            { Ref: 'AWS::AccountId' },
            ':bot:',
            {
              Ref: `${category}${resourceName}BotName`,
            },
            ':*',
          ],
        ],
      },
    ],
  };

  const attributes = ['BotName'];

  return { policy, attributes };
}

module.exports = {
  addWalkthrough, updateWalkthrough, migrate, getIAMPolicies,
};
