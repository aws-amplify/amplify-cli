const path = require('path');
const fs = require('fs-extra');

import { byValue, printer } from 'amplify-prompts';
import { prompterAdapter, PrompterInput } from '../../../prompter-adapter';

const category = 'interactions';
const parametersFileName = 'lex-params.json';
const cfnParametersFilename = 'parameters.json';
const serviceName = 'Lex';
const fuzzy = require('fuzzy');
import { ResourceDoesNotExistError, exitOnNextTick } from 'amplify-cli-core';

async function addWalkthrough(context, defaultValuesFilename, serviceMetadata) {
  return configure(context, defaultValuesFilename, serviceMetadata);
}

function updateWalkthrough(context, defaultValuesFilename, serviceMetadata) {
  // const resourceName = resourceAlreadyExists(context);
  const { amplify } = context;
  context.exeInfo = amplify.getProjectDetails();
  const { amplifyMeta } = context.exeInfo;

  const lexResources = {};

  Object.keys(amplifyMeta[category]).forEach(resourceName => {
    if (amplifyMeta[category][resourceName].service === serviceName && amplifyMeta[category][resourceName].mobileHubMigrated !== true) {
      lexResources[resourceName] = amplifyMeta[category][resourceName];
    }
  });

  if (!amplifyMeta[category] || Object.keys(lexResources).length === 0) {
    const errMessage = 'No resources to update. You need to add a resource.';
    printer.error(errMessage);
    context.usageData.emitError(new ResourceDoesNotExistError(errMessage));
    exitOnNextTick(0);
  }

  return prompterAdapter.prompt({
    message: 'Specify the resource that you would want to update',
    type: PrompterInput.LIST,
    choices: Object.keys(lexResources)
  }).then(answer => configure(context, defaultValuesFilename, serviceMetadata, answer));
}

// Goes through Lex walkthrough
async function configure(context, defaultValuesFilename, serviceMetadata, resourceName) {
  const { amplify } = context;
  context.exeInfo = amplify.getProjectDetails();

  const { inputs, samples } = serviceMetadata;
  const defaultValuesSrc = `${__dirname}/../default-values/${defaultValuesFilename}`;
  const { getAllDefaults } = require(defaultValuesSrc);
  const defaultValues = getAllDefaults(amplify.getProjectDetails());
  const projectBackendDirPath = context.amplify.pathManager.getBackendDirPath();

  printer.blankLine();
  printer.info('Welcome to the Amazon Lex chatbot wizard');
  printer.info('You will be asked a series of questions to help determine how to best construct your chatbot.');
  printer.blankLine();

  let startChoice;

  if (!resourceName) {
    resourceName = await prompterAdapter.prompt({
      ...inputs.resourceQuestion,
      options: {
        initial: defaultValues[inputs.resourceQuestion.key]
      }
    });
    startChoice = await prompterAdapter.prompt({
      ...inputs.startQuestion,
      options: {
        initial: byValue(defaultValues[inputs.startQuestion.key] || resourceName)
      }
    });
  } else {
    startChoice = { startChoice: 'Update an existing chatbot' };
  }

  Object.entries(inputs).forEach(([key, value]) => {
    const defaultValue = defaultValues[key] || resourceName;
    value.options = {
      initial: value.type === 'list' ? byValue(defaultValue) : defaultValue
    }
    // confirm only
    value.initial = defaultValue;
  });

  let botName;
  let intentName;
  let answers;
  let parameters;
  let deleteIntentConfirmed = false;

  if (startChoice === 'Start with a sample') {
    // TODO: get list of samples from Lex, if possible
    // Currently samples are hardcoded in supported-services
    botName = await prompterAdapter.prompt(inputs.sampleChatbotQuestion);

    const coppa = await prompterAdapter.prompt(inputs.coppaQuestion);
    if (coppa) {
      printer.blankLine();
      printer.info('You must obtain any required verifiable parental consent under COPPA.');
      printer.blankLine();
    }

    const intents = samples[botName];

    answers = {
      resourceName,
      intents,
      outputVoice: 'Matthew',
      botName,
      coppa,
    };
  } else if (startChoice === 'Update an existing chatbot') {
    if (resourceName) {
      const resourceDirPath = path.join(projectBackendDirPath, category, resourceName);
      const parametersFilePath = path.join(resourceDirPath, parametersFileName);
      try {
        parameters = context.amplify.readJsonFile(parametersFilePath);
      } catch (e) {
        parameters = {};
      }
    } else {
      printer.error('No chat bots to update');
    }

    let utterances = [];
    const intents = [];
    let slots = [];
    let newSlotTypes = [];
    const intentChoice = await prompterAdapter.prompt(inputs.addUpdateIntentQuestion);
    if (intentChoice === 'Update an existing intent') {
      const intentList = parameters.intents.map(x => x.intentName);
      intentName = await prompterAdapter.prompt({
        ...inputs.chooseIntentQuestion,
        choices: intentList,
      });

      if (await prompterAdapter.prompt(inputs.addUtteranceQuestion)) {
        utterances = await addUtterance(inputs);
      }

      let slotReturn = [];
      if (await prompterAdapter.prompt(inputs.addSlotQuestion)) {
        slotReturn = await addSlot(context, intentName, botName, resourceName, serviceMetadata, parameters);
      }
      if (slotReturn.length > 1) {
        newSlotTypes = slotReturn[1];
      }
      slots = slotReturn[0];
    } else if (intentChoice === 'Add an intent') {
      do {
        intents.push(await addIntent(context, botName, resourceName, serviceMetadata, intents, parameters));
      } while (await prompterAdapter.prompt(inputs.addAnotherIntentQuestion));
    } else if (intentChoice === 'Delete an intent') {
      const intentList = parameters.intents.map(x => x.intentName);
      intentName = await prompterAdapter.prompt({
        ...inputs.chooseIntentQuestion,
        choices: intentList,
      });
      deleteIntentConfirmed = await prompterAdapter.prompt(inputs.deleteIntentConfirmation);
    } else {
      printer.error('Valid option not chosen');
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
  } else if (startChoice === 'Start from scratch') {
    botName = await prompterAdapter.prompt(inputs.botNameQuestion);
    const outputVoice = await prompterAdapter.prompt(inputs.outputVoiceQuestion);
    const sessionTimeout = await prompterAdapter.prompt(inputs.sessionTimeoutQuestion);
    const coppa = await prompterAdapter.prompt(inputs.coppaQuestion);
    if (coppa) {
      printer.blankLine();
      printer.info('You must obtain any required verifiable parental consent under COPPA.');
      printer.blankLine();
    }

    printer.blankLine();
    printer.info('First create an intent for your new chatbot. An intent represents an action that the user wants to perform.');
    printer.blankLine();

    const intents = [];
    do {
      intents.push(await addIntent(context, botName, resourceName, serviceMetadata, intents, parameters));
    } while (await prompterAdapter.prompt(inputs.addAnotherIntentQuestion));

    answers = {
      resourceName,
      botName,
      intents,
      outputVoice,
      sessionTimeout,
      coppa,
    };
  } else {
    printer.error('Valid option not chosen');
  }

  if (parameters) {
    if (answers.intentName) {
      if (deleteIntentConfirmed) {
        parameters.intents = parameters.intents.filter(intent => intent.intentName !== answers.intentName);
      } else {
        parameters.intents.forEach(intent => {
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
      printer.error('Valid option not chosen');
    } else {
      parameters.intents = parameters.intents.concat(answers.intents);
    }
    answers = parameters;
  }
  return answers;
}

async function addIntent(context, botName, resourceName, serviceMetadata, intents, parameters) {
  const { inputs } = serviceMetadata;
  let intentName = await prompterAdapter.prompt(inputs.intentNameQuestion);

  // Checks for duplicate intent names
  while (
    intents.filter(intent => intent.intentName === intentName).length > 0 ||
    (parameters && parameters.intents.filter(intent => intent.intentName === intentName).length > 0)
  ) {
    printer.blankLine();
    printer.info('Intent names must be unique');
    printer.blankLine();
    intentName = await prompterAdapter.prompt(inputs.intentNameQuestion);
  }

  const utterances = await addUtterance(inputs);

  printer.blankLine();
  printer.info('Now, add a slot to your intent. A slot is data the user must provide to fulfill the intent.');
  printer.blankLine();

  let slots = [];
  let newSlotTypes = [];
  const slotReturn = await addSlot(context, intentName, botName, resourceName, serviceMetadata, parameters);
  if (slotReturn.length > 1) {
    newSlotTypes = slotReturn[1];
  }
  slots = slotReturn[0];

  let confirmationQuestion;
  let cancelMessage;
  if (await prompterAdapter.prompt(inputs.addConfirmationQuestion)) {
    confirmationQuestion = await prompterAdapter.prompt(inputs.confirmationQuestionQuestion);
    cancelMessage = await prompterAdapter.prompt(inputs.cancelMessageQuestion);
  }

  let intentFulfillment = await prompterAdapter.prompt(inputs.intentFulfillmentQuestion);

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

async function addUtterance(inputs) {
  const utterances = [];
  do {
    utterances.push(await prompterAdapter.prompt(inputs.utteranceQuestion));
  } while (await prompterAdapter.prompt(inputs.addAnotherUtteranceQuestion));

  return utterances;
}

async function addSlot(context, intentName, botName, resourceName, serviceMetadata, parameters) {
  const { inputs } = serviceMetadata;
  const slots = [];
  const newSlotTypes = [];
  let newSlotTypeAdded = false;

  do {
    const slot = {
      name: '',
      type: '',
      prompt: '',
      required: true,
      customType: false,
    };
    slot.name = await prompterAdapter.prompt(inputs.slotNameQuestion);

    // Checks for duplicate slot names
    while (
      slots.filter(existingSlot => existingSlot.name === slot.name).length > 0 ||
      (parameters &&
        parameters.intents.filter(intent => intent.intentName === intentName)[0] &&
        parameters.intents
          .filter(intent => intent.intentName === intentName)[0]
          .slots.filter(existingSlot => existingSlot.name === slot.name).length > 0)
    ) {
      printer.blankLine();
      printer.info('Slot names must be unique');
      printer.blankLine();
      slot.name = await prompterAdapter.prompt(inputs.slotNameQuestion);
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

    slot.prompt = await prompterAdapter.prompt(inputs.slotPromptQuestion);
    slot.required = await prompterAdapter.prompt(inputs.slotRequiredQuestion);

    slots.push(slot);
  } while (await prompterAdapter.prompt(inputs.addAnotherSlotQuestion));

  if (newSlotTypeAdded) {
    return [slots, newSlotTypes];
  }

  return [slots];
}

async function getSlotType(context, serviceMetadata, newSlotTypes, parameters) {
  const { inputs } = serviceMetadata;
  let slotType;

  const slotTypeChoice = await prompterAdapter.prompt(inputs.slotTypeChoiceQuestion);
  function searchSlotTypes(builtInSlotTypes) {
    return function (answers, input = '') {
      return new Promise(resolve => {
        const fuzzyResult = fuzzy.filter(input, builtInSlotTypes);
        resolve(fuzzyResult.map(el => el.original));
      });
    };
  }
  if (slotTypeChoice === 'Amazon built-in slot type') {
    let slotTypeOptions = '';
    let builtInSlotTypes = [];
    let builtInSlotTypesReturn;
    do {
      builtInSlotTypesReturn = await context.amplify.executeProviderUtils(
        context,
        'awscloudformation',
        'getBuiltInSlotTypes',
        slotTypeOptions,
      );
      builtInSlotTypes = builtInSlotTypes.concat(builtInSlotTypesReturn.slotTypes.map(builtinSlotType => builtinSlotType.signature));
      slotTypeOptions = builtInSlotTypesReturn.nextToken;
    } while (slotTypeOptions);

    slotType = await prompterAdapter.prompt({
      ...inputs.slotTypeQuestion,
      choices: builtInSlotTypes
    });
    return [slotType[inputs[15].key], false];
  } else if (slotTypeChoice === "Slot type I've already made") {
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
    slotType = await prompterAdapter.prompt({
      ...inputs.slotTypeQuestion,
      choices: slotTypes,
    });
    return [slotType, true];
  } else if (slotTypeChoice === 'Create a new slot type') {
    slotType = await prompterAdapter.prompt(inputs.slotTypeNameQuestion);

    const slotTypeDescription = await prompterAdapter.prompt(inputs.slotTypeDescriptionQuestion);
    const slotValues = [];
    do {
      let slotValue = await prompterAdapter.prompt(inputs.slotTypeValueQuestion);

      // Checks for duplicate slot values
      while (slotValues.filter(existingSlotValue => existingSlotValue === slotValue).length > 0) {
        printer.blankLine();
        printer.info('Slot values must be unique');
        printer.blankLine();
        slotValue = await prompterAdapter.prompt(inputs.slotTypeValueQuestion);
      }

      slotValues.push(slotValue);
    } while (await prompterAdapter.prompt(inputs.continueAddingSlotValuesQuestion));

    return {
      slotType,
      slotTypeDescription,
      slotValues,
    };
  }

  printer.error('Valid option not chosen');
  return undefined;
}

async function askLambda(context) {
  const projectRegion = context.exeInfo.amplifyMeta.providers.awscloudformation.Region;
  const accountID = context.exeInfo.amplifyMeta.providers.awscloudformation.AuthRoleArn.split(':')[4];

  const lambdaFunctions = await context.amplify.executeProviderUtils(context, 'awscloudformation', 'getLambdaFunctions', {
    region: projectRegion,
  });

  const lambdaOptions = lambdaFunctions.map(lambdaFunction => ({
    value: {
      resourceName: lambdaFunction.FunctionName.replace(/[^0-9a-zA-Z]/gi, ''),
      Arn: lambdaFunction.FunctionArn,
      FunctionName: lambdaFunction.FunctionName,
    },
    name: `${lambdaFunction.FunctionName}`,
  }));

  if (lambdaOptions.length === 0) {
    printer.error(`You do not have any lambda functions configured in the region ${projectRegion}`);
    return null;
  }

  const lambdaChoice = await prompterAdapter.prompt({
    type: 'list',
    message: 'Select a Lambda function',
    choices: lambdaOptions,
    pickAtLeast: 1,
    returnSize: 1,
  });

  return {
    region: projectRegion,
    accountId: accountID,
    lambdaArn: lambdaChoice.Arn,
    lambdaName: lambdaChoice.FunctionName,
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
    printer.error(`Error reading api-params.json file for ${resourceName} resource`);
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
      'Fn::GetAtt': ['AuthRole', 'Arn'],
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

  crudOptions.forEach(crudOption => {
    switch (crudOption) {
      case 'create':
        actions.push('lex:Create*', 'lex:Post*');
        break;
      case 'update':
        actions.push('lex:Put*');
        break;
      case 'read':
        actions.push('lex:Get*');
        break;
      case 'delete':
        actions.push('lex:Delete*');
        break;
      default:
        console.log(`${crudOption} not supported`);
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
  addWalkthrough,
  updateWalkthrough,
  migrate,
  getIAMPolicies,
};
