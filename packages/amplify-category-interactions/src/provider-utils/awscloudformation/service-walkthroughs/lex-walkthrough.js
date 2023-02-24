const path = require('path');
const fs = require('fs-extra');

import { printer, prompter, alphanumeric, matchRegex, between, and, minLength, maxLength } from 'amplify-prompts';

const category = 'interactions';
const parametersFileName = 'lex-params.json';
const cfnParametersFilename = 'parameters.json';
const serviceName = 'Lex';
import { ResourceDoesNotExistError, exitOnNextTick } from 'amplify-cli-core';

async function addWalkthrough(context, defaultValuesFilename, serviceMetadata) {
  return configure(context, defaultValuesFilename, serviceMetadata);
}

async function updateWalkthrough(context, defaultValuesFilename, serviceMetadata) {
  // const resourceName = resourceAlreadyExists(context);
  const { amplify } = context;
  context.exeInfo = amplify.getProjectDetails();
  const { amplifyMeta } = context.exeInfo;

  const lexResources = {};

  Object.keys(amplifyMeta[category]).forEach((resourceName) => {
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

  const answer = await prompter.pick('Specify the resource that you would want to update', Object.keys(lexResources));
  return configure(context, defaultValuesFilename, serviceMetadata, answer);
}

// Goes through Lex walkthrough
async function configure(context, defaultValuesFilename, serviceMetadata, resourceName) {
  const { amplify } = context;
  context.exeInfo = amplify.getProjectDetails();

  const { samples } = serviceMetadata;
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
    resourceName = await prompter.input('Provide a friendly resource name that will be used to label this category in the project:', {
      validate: alphanumeric(),
      initial: defaultValues['resourceName'],
    });
    startChoice = await prompter.pick('Would you like to start with a sample chatbot or start from scratch?', [
      'Start with a sample',
      'Start from scratch',
    ]);
  } else {
    startChoice = { startChoice: 'Update an existing chatbot' };
  }

  let botName;
  let intentName;
  let answers;
  let parameters;
  let deleteIntentConfirmed = false;

  if (startChoice === 'Start with a sample') {
    // TODO: get list of samples from Lex, if possible
    // Currently samples are hardcoded in supported-services
    botName = await prompter.pick('Choose a sample chatbot:', ['BookTrip', 'OrderFlowers', 'ScheduleAppointment']);

    const coppa = await prompter.yesOrNo(
      "Please indicate if your use of this bot is subject to the Children's Online Privacy Protection Act(COPPA).\nLearn more: https://www.ftc.gov/tips-advice/business-center/guidance/complying-coppa-frequently-asked-questions",
      false,
    );
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
    const intentChoice = await prompter.pick('Would you like to add an intent or choose and existing intent?', [
      'Update an existing intent',
      'Add an intent',
      'Delete an intent',
    ]);
    if (intentChoice === 'Update an existing intent') {
      const intentList = parameters.intents.map((x) => x.intentName);
      intentName = await prompter.pick('Choose an intent: ', intentList);

      if (await prompter.yesOrNo('Would you like to add an utterance?', true)) {
        utterances = await addUtterance(resourceName);
      }

      let slotReturn = [];
      if (await prompter.yesOrNo('Would you like to add a slot?', true)) {
        slotReturn = await addSlot(context, intentName, resourceName, parameters);
      }
      if (slotReturn.length > 1) {
        newSlotTypes = slotReturn[1];
      }
      slots = slotReturn[0];
    } else if (intentChoice === 'Add an intent') {
      do {
        intents.push(await addIntent(context, resourceName, intents, parameters));
      } while (await prompter.yesOrNo('Would you like to create another intent?', false));
    } else if (intentChoice === 'Delete an intent') {
      const intentList = parameters.intents.map((x) => x.intentName);
      intentName = await prompter.pick('Choose an intent: ', intentList);
      deleteIntentConfirmed = await prompter.yesOrNo('Are you sure you want to delete this intent?', false);
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
    botName = await prompter.input('Enter a name for your bot:', {
      initial: defaultValues['botName'] || resourceName,
      validate: matchRegex(
        /^([A-Za-z]_?){2,50}$/,
        'The bot name must contain only letters and non-consecutive underscores, start with a letter, and be between 2-50 characters',
      ),
    });
    const outputVoice = await prompter.pick('Choose an output voice:', [
      {
        name: 'None. This is only a text based application.',
        value: false,
      },
      {
        name: 'Male',
        value: 'Matthew',
      },
      {
        name: 'Female',
        value: 'Joanna',
      },
    ]);
    const sessionTimeout = await prompter.input('After how long should the session timeout (in minutes)?', {
      initial: 5,
      validate: between(1, 1440, 'Session timeout must be a number and must be greater than 0 and less than 1440.'),
      transform: (input) => parseInt(input, 10),
    });
    const coppa = await prompter.yesOrNo(
      "Please indicate if your use of this bot is subject to the Children's Online Privacy Protection Act(COPPA).\nLearn more: https://www.ftc.gov/tips-advice/business-center/guidance/complying-coppa-frequently-asked-questions",
      false,
    );
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
      intents.push(await addIntent(context, resourceName, intents, parameters));
    } while (await prompter.yesOrNo('Would you like to create another intent?', false));

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
        parameters.intents = parameters.intents.filter((intent) => intent.intentName !== answers.intentName);
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
      printer.error('Valid option not chosen');
    } else {
      parameters.intents = parameters.intents.concat(answers.intents);
    }
    answers = parameters;
  }
  return answers;
}

async function addIntent(context, resourceName, intents, parameters) {
  let intentName = await askIntent();

  // Checks for duplicate intent names
  while (
    intents.filter((intent) => intent.intentName === intentName).length > 0 ||
    (parameters && parameters.intents.filter((intent) => intent.intentName === intentName).length > 0)
  ) {
    printer.blankLine();
    printer.info('Intent names must be unique');
    printer.blankLine();
    intentName = await askIntent();
  }

  const utterances = await addUtterance(resourceName);

  printer.blankLine();
  printer.info('Now, add a slot to your intent. A slot is data the user must provide to fulfill the intent.');
  printer.blankLine();

  let slots = [];
  let newSlotTypes = [];
  const slotReturn = await addSlot(context, intentName, resourceName, parameters);
  if (slotReturn.length > 1) {
    newSlotTypes = slotReturn[1];
  }
  slots = slotReturn[0];

  let confirmationQuestion;
  let cancelMessage;
  if (await prompter.yesOrNo('Would you like to add a confirmation prompt to your intent?', false)) {
    confirmationQuestion = await prompter.input('Enter a confirmation message (e.g. Are you sure you want to order a {Drink_name}?):', {
      validate: and(minLength(1), maxLength(1000), 'Confirmation questions can have a maximum of 1000 characters and cannot be empty'),
    });
    cancelMessage = await prompter.input(
      'Enter a cancel message for when the user says no to the confirmation message (e.g. Okay. Your order will not be placed.):',
      { validate: and(minLength(1), maxLength(1000), 'Cancel messages can have a maximum of 1000 characters and cannot be empty') },
    );
  }

  let intentFulfillment = await prompter.pick('How would you like the intent to be fulfilled?', [
    {
      name: 'AWS Lambda Function',
      value: 'lambdaFunction',
    },
    {
      name: 'Return parameters to client',
      value: 'returnParameters',
    },
  ]);

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

async function askIntent() {
  return prompter.input('Give a unique name for the new intent:', {
    validate: matchRegex(
      /^([A-Za-z]_?){1,100}$/,
      'Intent name can only contain letters and underscores, cannot be empty, and must be no longer than 100 characters',
    ),
  });
}

async function addUtterance(resourceName) {
  const utterances = [];
  do {
    utterances.push(
      await prompter.input('Enter a sample utterance (spoken or typed phrase that invokes your intent. e.g. Book a hotel)', {
        validate: matchRegex(/^.{1,200}$/, 'Utterances can be a maximum of 200 characters and cannot be empty'),
        initial: resourceName,
      }),
    );
  } while (await prompter.yesOrNo('Would you like to add another utterance?', false));

  return utterances;
}

async function addSlot(context, intentName, resourceName, parameters) {
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
    slot.name = await askSlotName(resourceName);

    // Checks for duplicate slot names
    while (
      slots.filter((existingSlot) => existingSlot.name === slot.name).length > 0 ||
      (parameters &&
        parameters.intents.filter((intent) => intent.intentName === intentName)[0] &&
        parameters.intents
          .filter((intent) => intent.intentName === intentName)[0]
          .slots.filter((existingSlot) => existingSlot.name === slot.name).length > 0)
    ) {
      printer.blankLine();
      printer.info('Slot names must be unique');
      printer.blankLine();
      slot.name = await askSlotName(resourceName);
    }

    slot.type = await getSlotType(context, newSlotTypes, parameters);
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

    slot.prompt = await prompter.prompt('Enter a prompt for your slot (e.g. What city?)', {
      initial: resourceName,
      validate: matchRegex(/^.{1,1000}$/, 'Prompts can have a maximum of 1000 characters and cannot be empty'),
    });
    slot.required = await prompter.yesOrNo('Should this slot be required?', true);

    slots.push(slot);
  } while (await prompter.yesOrNo('Would you like to add another slot?', true));

  if (newSlotTypeAdded) {
    return [slots, newSlotTypes];
  }

  return [slots];
}

async function askSlotName() {
  return prompter.input('Enter a name for your slot (e.g. Location)', {
    validate: matchRegex(
      /^([A-Za-z]_?){1,100}$/,
      'Slot name can only contain letters, must be no longer than 100 characters, and cannot be empty',
    ),
  });
}

async function getSlotType(context, newSlotTypes, parameters) {
  let slotType;

  const slotTypeChoice = await prompter.pick(
    "Would you like to choose an Amazon built-in slot type, a slot type you've already made, or create a new slot type?",
    ['Amazon built-in slot type', "Slot type I've already made", 'Create a new slot type'],
  );

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
      builtInSlotTypes = builtInSlotTypes.concat(builtInSlotTypesReturn.slotTypes.map((builtinSlotType) => builtinSlotType.signature));
      slotTypeOptions = builtInSlotTypesReturn.nextToken;
    } while (slotTypeOptions);

    slotType = await prompter.pick('Choose a slot type:', builtInSlotTypes);
    return [slotType, false];
  } else if (slotTypeChoice === "Slot type I've already made") {
    let slotTypes = await context.amplify.executeProviderUtils(context, 'awscloudformation', 'getSlotTypes');
    slotTypes = slotTypes.slotTypes.map((cloudSlotType) => cloudSlotType.name);
    if (newSlotTypes) {
      slotTypes = slotTypes.concat(newSlotTypes.map((newSlotType) => newSlotType.slotType));
    }
    if (parameters) {
      if (parameters.intents) {
        for (let i = 0; i < parameters.intents.length; i++) {
          if (parameters.intents[i].newSlotTypes) {
            slotTypes = slotTypes.concat(parameters.intents[i].newSlotTypes.map((paramsSlotType) => paramsSlotType.slotType));
          }
        }
      }
    }
    slotTypes = slotTypes.filter((value, index, self) => self.indexOf(value) === index);
    slotType = await prompter.pick('Choose a slot type:', slotTypes);
    return [slotType, true];
  } else if (slotTypeChoice === 'Create a new slot type') {
    slotType = await prompter.input('What would you like to name your slot type?', {
      validate: matchRegex(
        /^([A-Za-z]_?){1,100}$/,
        'The slot name must contain only letters and non-consecutive underscores, start with a letter, and be no more than 100 characters',
      ),
    });

    const slotTypeDescription = await prompter.input('Give a description of your slot type:', {
      validate: matchRegex(/^.{1,1000}$/, 'Slot type descriptions can have a maximum of 1000 characters and cannot be empty'),
    });
    const slotValues = [];
    do {
      let slotValue = await askSlotTypeValue();

      // Checks for duplicate slot values
      while (slotValues.filter((existingSlotValue) => existingSlotValue === slotValue).length > 0) {
        printer.blankLine();
        printer.info('Slot values must be unique');
        printer.blankLine();
        slotValue = await askSlotTypeValue();
      }

      slotValues.push(slotValue);
    } while (await prompter.yesOrNo('Add another slot value?', true));

    return {
      slotType,
      slotTypeDescription,
      slotValues,
    };
  }

  printer.error('Valid option not chosen');
  return undefined;
}

async function askSlotTypeValue() {
  return prompter.prompt('Add a possible value for your slot:', {
    validate: matchRegex(/^.{1,1000}$/, 'Slot values can have a maximum of 1000 characters and cannot be empty'),
  });
}

async function askLambda(context) {
  const projectRegion = context.exeInfo.amplifyMeta.providers.awscloudformation.Region;
  const accountID = context.exeInfo.amplifyMeta.providers.awscloudformation.AuthRoleArn.split(':')[4];

  const lambdaFunctions = await context.amplify.executeProviderUtils(context, 'awscloudformation', 'getLambdaFunctions', {
    region: projectRegion,
  });

  const lambdaOptions = lambdaFunctions.map((lambdaFunction) => ({
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

  const lambdaChoice = await prompter.pick('Select a Lambda function', lambdaOptions);

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

  crudOptions.forEach((crudOption) => {
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
