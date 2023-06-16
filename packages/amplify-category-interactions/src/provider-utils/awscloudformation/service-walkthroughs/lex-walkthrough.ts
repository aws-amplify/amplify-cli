import { $TSAny, $TSContext, $TSMeta, AmplifyError, AmplifyFault } from '@aws-amplify/amplify-cli-core';
import { alphanumeric, and, between, matchRegex, maxLength, minLength, printer, prompter } from '@aws-amplify/amplify-prompts';
import fs from 'fs-extra';
import path from 'path';
import { JSONUtilities } from '@aws-amplify/amplify-cli-core';
import { LexSlot, LexSlotType, LexSamples } from '../../supported-services';

const category = 'interactions';
const parametersFileName = 'lex-params.json';
const cfnParametersFilename = 'parameters.json';
const serviceName = 'Lex';

type LexAnswers = {
  resourceName: string;
  botName: string;
  intentName?: string;
  outputVoice?: string;
  utterances?: string[];
  intents?: { intentName: string }[];
  slots?: LexSlot[];
  newSlotTypes?: string[];
  coppa?: boolean;
  sessionTimeout?: number;
};

export const addWalkthrough = async (context: $TSContext, defaultValuesFilename: string, serviceMetadata: string): Promise<LexAnswers> => {
  return configure(context, defaultValuesFilename, serviceMetadata);
};

export const updateWalkthrough = async (
  context: $TSContext,
  defaultValuesFilename: string,
  serviceMetadata: $TSMeta,
): Promise<LexAnswers> => {
  // const resourceName = resourceAlreadyExists(context);
  const { amplify } = context;
  context.exeInfo = amplify.getProjectDetails();
  const { amplifyMeta } = context.exeInfo;

  const lexResources: $TSAny = {};

  Object.keys(amplifyMeta[category]).forEach((resourceName) => {
    if (amplifyMeta[category][resourceName].service === serviceName && amplifyMeta[category][resourceName].mobileHubMigrated !== true) {
      lexResources[resourceName] = amplifyMeta[category][resourceName];
    }
  });

  if (!amplifyMeta[category] || Object.keys(lexResources).length === 0) {
    throw new AmplifyFault('ResourceNotFoundFault', {
      message: 'No resources to update. You need to add a resource.',
    });
  }

  const answer = await prompter.pick('Specify the resource that you would want to update', Object.keys(lexResources));
  return configure(context, defaultValuesFilename, serviceMetadata, answer);
};

// Goes through Lex walkthrough
const configure = async (
  context: $TSContext,
  defaultValuesFilename: string,
  serviceMetadata: $TSMeta,
  resourceName?: string,
): Promise<LexAnswers> => {
  const { amplify } = context;
  context.exeInfo = amplify.getProjectDetails();

  const { samples } = serviceMetadata;
  const defaultValuesSrc = `${__dirname}/../default-values/${defaultValuesFilename}`;
  const { getAllDefaults } = require(defaultValuesSrc);
  const defaultValues = getAllDefaults(amplify.getProjectDetails());

  printer.blankLine();
  printer.info('Welcome to the Amazon Lex chatbot wizard');
  printer.info('You will be asked a series of questions to help determine how to best construct your chatbot.');
  printer.blankLine();

  let startChoice;

  const resolvedResourceName =
    resourceName ||
    (await prompter.input('Provide a friendly resource name that will be used to label this category in the project:', {
      validate: alphanumeric(),
      initial: defaultValues['resourceName'],
    }));

  if (!resourceName) {
    startChoice = await prompter.pick('Would you like to start with a sample chatbot or start from scratch?', [
      'Start with a sample',
      'Start from scratch',
    ]);
  } else {
    startChoice = 'Update an existing chatbot';
  }

  let answers: LexAnswers;
  let parameters;
  let deleteIntentConfirmed = false;

  if (startChoice === 'Start with a sample') {
    // TODO: get list of samples from Lex, if possible
    // Currently samples are hardcoded in supported-services
    answers = await startWithSampleBotWalkthrough(samples, resolvedResourceName);
  } else if (startChoice === 'Update an existing chatbot') {
    ({ parameters, deleteIntentConfirmed, answers } = await updateExistingBotWalkthrough(resolvedResourceName, parameters, context));
  } else if (startChoice === 'Start from scratch') {
    answers = await startBotFromScratchWalkthrough(resolvedResourceName, context, parameters, defaultValuesFilename);
  } else {
    throw new AmplifyError('InputValidationError', {
      message: 'Valid option not chosen',
    });
  }

  if (parameters) {
    if (answers.intentName) {
      if (deleteIntentConfirmed) {
        parameters.intents = parameters.intents.filter(
          (intent: { intentName: string | undefined }) => intent.intentName !== answers.intentName,
        );
      } else {
        parameters.intents.forEach(
          (intent: { intentName: string | undefined; utterances: string[]; slots: LexSlot[]; newSlotTypes: string[] }) => {
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
          },
        );
      }
    } else if (!answers.intents) {
      throw new AmplifyError('InputValidationError', {
        message: 'Valid option not chosen',
      });
    } else {
      parameters.intents = parameters.intents.concat(answers.intents);
    }
    answers = parameters;
  }
  return answers;
};

const addIntent = async (
  context: $TSContext,
  resourceName: string,
  intents: { intentName: string }[],
  parameters: $TSAny,
): Promise<$TSAny> => {
  let intentName = await askIntent();

  // Checks for duplicate intent names
  while (
    intents.filter((intent) => intent.intentName === intentName).length > 0 ||
    (parameters && parameters.intents.filter((intent: $TSAny) => intent.intentName === intentName).length > 0)
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

  const { slots, newSlotTypes } = await addSlot(context, intentName, resourceName, parameters);

  let confirmationQuestion;
  let cancelMessage;
  if (await prompter.yesOrNo('Would you like to add a confirmation prompt to your intent?', false)) {
    confirmationQuestion = await prompter.input('Enter a confirmation message (e.g. Are you sure you want to order a {Drink_name}?):', {
      validate: and([minLength(1), maxLength(1000)], 'Confirmation questions can have a maximum of 1000 characters and cannot be empty'),
    });
    cancelMessage = await prompter.input(
      'Enter a cancel message for when the user says no to the confirmation message (e.g. Okay. Your order will not be placed.):',
      { validate: and([minLength(1), maxLength(1000)], 'Cancel messages can have a maximum of 1000 characters and cannot be empty') },
    );
  }

  const intentFulfillment = await prompter.pick<'one', string>('How would you like the intent to be fulfilled?', [
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
};

const askIntent = async (): Promise<string> => {
  return prompter.input('Give a unique name for the new intent:', {
    validate: matchRegex(
      /^([A-Za-z]_?){1,100}$/,
      'Intent name can only contain letters and underscores, cannot be empty, and must be no longer than 100 characters',
    ),
  });
};

const addUtterance = async (resourceName: string): Promise<string[]> => {
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
};

const addSlot = async (context: $TSContext, intentName: string, resourceName: string, parameters: $TSAny): Promise<$TSAny> => {
  const slots = [];
  const newSlotTypes = [];

  do {
    const slot: LexSlot = {
      name: '',
      type: '',
      prompt: '',
      required: true,
      customType: false,
    };
    slot.name = await askSlotName();

    // Checks for duplicate slot names
    while (
      slots.filter((existingSlot) => existingSlot.name === slot.name).length > 0 ||
      (parameters &&
        parameters.intents.filter((intent: { intentName: string }) => intent.intentName === intentName)[0] &&
        parameters.intents
          .filter((intent: { intentName: string }) => intent.intentName === intentName)[0]
          .slots.filter((existingSlot: { name: string }) => existingSlot.name === slot.name).length > 0)
    ) {
      printer.blankLine();
      printer.info('Slot names must be unique');
      printer.blankLine();
      slot.name = await askSlotName();
    }

    const slotType: LexSlotType = await getSlotType(context, newSlotTypes, parameters);
    slot.type = slotType.slotType;
    slot.customType = slotType.customType ?? false;
    if (slotType.slotTypeDescription) {
      newSlotTypes.push(slotType);
    }

    slot.prompt = await prompter.input('Enter a prompt for your slot (e.g. What city?)', {
      initial: resourceName,
      validate: matchRegex(/^.{1,1000}$/, 'Prompts can have a maximum of 1000 characters and cannot be empty'),
    });
    slot.required = await prompter.yesOrNo('Should this slot be required?', true);

    slots.push(slot);
  } while (await prompter.yesOrNo('Would you like to add another slot?', true));

  return {
    slots,
    newSlotTypes,
  };
};

const askSlotName = async (): Promise<string> => {
  return prompter.input('Enter a name for your slot (e.g. Location)', {
    validate: matchRegex(
      /^([A-Za-z]_?){1,100}$/,
      'Slot name can only contain letters, must be no longer than 100 characters, and cannot be empty',
    ),
  });
};

const getSlotType = async (context: $TSContext, newSlotTypes: LexSlotType[], parameters: $TSAny): Promise<LexSlotType> => {
  let slotType;

  const slotTypeChoice = await prompter.pick(
    "Would you like to choose an Amazon built-in slot type, a slot type you've already made, or create a new slot type?",
    ['Amazon built-in slot type', "Slot type I've already made", 'Create a new slot type'],
  );

  if (slotTypeChoice === 'Amazon built-in slot type') {
    let slotTypeOptions = '';
    let builtInSlotTypes: $TSAny[] = [];
    let builtInSlotTypesReturn;
    do {
      builtInSlotTypesReturn = await context.amplify.executeProviderUtils(
        context,
        'awscloudformation',
        'getBuiltInSlotTypes',
        slotTypeOptions,
      );
      builtInSlotTypes = builtInSlotTypes.concat(
        builtInSlotTypesReturn.slotTypes.map((builtinSlotType: { signature: LexSlotType }) => builtinSlotType.signature),
      );
      slotTypeOptions = builtInSlotTypesReturn.nextToken;
    } while (slotTypeOptions);

    slotType = await prompter.pick('Choose a slot type:', builtInSlotTypes);
    return {
      slotType,
      customType: false,
    };
  } else if (slotTypeChoice === "Slot type I've already made") {
    let slotTypes = await context.amplify.executeProviderUtils(context, 'awscloudformation', 'getSlotTypes');
    slotTypes = slotTypes.slotTypes.map((cloudSlotType: LexSlot) => cloudSlotType.name);
    if (newSlotTypes) {
      slotTypes = slotTypes.concat(newSlotTypes.map((newSlotType) => newSlotType.slotType));
    }
    if (parameters) {
      if (parameters.intents) {
        for (let i = 0; i < parameters.intents.length; i++) {
          if (parameters.intents[i].newSlotTypes) {
            slotTypes = slotTypes.concat(
              parameters.intents[i].newSlotTypes.map((paramsSlotType: { slotType: LexSlotType }) => paramsSlotType.slotType),
            );
          }
        }
      }
    }
    slotTypes = slotTypes.filter((value: string, index: number, self: string[]) => self.indexOf(value) === index);
    slotType = await prompter.pick('Choose a slot type:', slotTypes);
    return {
      slotType,
      customType: true,
    };
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
      customType: true,
    };
  }

  throw new AmplifyError('InputValidationError', {
    message: 'Valid option not chosen',
  });
};

const askSlotTypeValue = async (): Promise<string> => {
  return prompter.input('Add a possible value for your slot:', {
    validate: matchRegex(/^.{1,1000}$/, 'Slot values can have a maximum of 1000 characters and cannot be empty'),
  });
};

const askLambda = async (
  context: $TSContext,
): Promise<{ region: string; accountId: string; lambdaArn: string; lambdaName: string } | null> => {
  const projectRegion = context.exeInfo.amplifyMeta.providers.awscloudformation.Region;
  const accountID = context.exeInfo.amplifyMeta.providers.awscloudformation.AuthRoleArn.split(':')[4];

  const lambdaFunctions = await context.amplify.executeProviderUtils(context, 'awscloudformation', 'getLambdaFunctions', {
    region: projectRegion,
  });

  const lambdaOptions = lambdaFunctions.map((lambdaFunction: { FunctionName: string; FunctionArn: string }) => ({
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

  const lambdaChoice = await prompter.pick<'one', { resourceName: string; Arn: string; FunctionName: string }>(
    'Select a Lambda function',
    lambdaOptions,
  );

  return {
    region: projectRegion,
    accountId: accountID,
    lambdaArn: lambdaChoice.Arn,
    lambdaName: lambdaChoice.FunctionName,
  };
};

export const migrate = async (context: $TSContext, projectPath: string, resourceName: string): Promise<void> => {
  const { amplify } = context;

  const targetDir = amplify.pathManager.getBackendDirPath();
  const resourceDirPath = path.join(targetDir, category, resourceName);
  const parametersFilePath = path.join(resourceDirPath, parametersFileName);
  const defaultValuesSrc = `${__dirname}/../default-values/lex-defaults.js`;
  const { getAllDefaults } = require(defaultValuesSrc);
  const defaultValues = getAllDefaults(amplify.getProjectDetails());

  let parameters;
  try {
    parameters = JSONUtilities.readJson(parametersFilePath);
  } catch (e) {
    throw new AmplifyFault('FileNotFoundFault', {
      message: `Error reading api-params.json file for ${resourceName} resource`,
    });
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
};

export const getIAMPolicies = (resourceName: string, crudOptions: string[]): $TSAny => {
  let policy = {};
  const actions: string[] = [];

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
};
const startWithSampleBotWalkthrough = async (samples: LexSamples, resourceName: string): Promise<LexAnswers> => {
  const botName = await prompter.pick('Choose a sample chatbot:', ['BookTrip', 'OrderFlowers', 'ScheduleAppointment']);

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

  return {
    resourceName: resourceName,
    intents,
    outputVoice: 'Matthew',
    botName,
    coppa,
  };
};

const updateExistingBotWalkthrough = async (resourceName: string, parameters: $TSAny, context: $TSContext): Promise<$TSAny> => {
  if (resourceName) {
    const projectBackendDirPath = context.amplify.pathManager.getBackendDirPath();
    const resourceDirPath = path.join(projectBackendDirPath, category, resourceName);
    const parametersFilePath = path.join(resourceDirPath, parametersFileName);
    parameters = JSONUtilities.readJson(parametersFilePath, { throwIfNotExist: false });
  } else {
    throw new AmplifyError('InputValidationError', {
      message: 'No chat bots to update',
    });
  }

  let deleteIntentConfirmed = false;
  let utterances: string[] = [];
  const intents: { intentName: string }[] = [];
  let slots = [];
  let newSlotTypes = [];
  const intentChoice = await prompter.pick('Would you like to add an intent or choose and existing intent?', [
    'Update an existing intent',
    'Add an intent',
    'Delete an intent',
  ]);

  let intentName = '';

  if (intentChoice === 'Update an existing intent') {
    const intentList = parameters.intents.map((x: { intentName: string }) => x.intentName);
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
    const intentList = parameters.intents.map((x: { intentName: string }) => x.intentName);
    intentName = await prompter.pick('Choose an intent: ', intentList);
    deleteIntentConfirmed = await prompter.yesOrNo('Are you sure you want to delete this intent?', false);
  } else {
    printer.error('Valid option not chosen');
  }
  const answers = {
    resourceName: resourceName,
    botName: parameters.botName,
    intentName,
    utterances,
    intents,
    slots,
    newSlotTypes,
  };

  return { parameters, deleteIntentConfirmed, answers };
};

const startBotFromScratchWalkthrough = async (
  resourceName: string,
  context: $TSContext,
  parameters: $TSAny,
  defaultValuesFilename: string,
): Promise<LexAnswers> => {
  const defaultValuesSrc = `${__dirname}/../default-values/${defaultValuesFilename}`;
  const { getAllDefaults } = require(defaultValuesSrc);
  const defaultValues = getAllDefaults(context.amplify.getProjectDetails());

  const botName = await prompter.input('Enter a name for your bot:', {
    initial: defaultValues['botName'] || resourceName,
    validate: matchRegex(
      /^([A-Za-z]_?){2,50}$/,
      'The bot name must contain only letters and non-consecutive underscores, start with a letter, and be between 2-50 characters',
    ),
  });
  const outputVoice = await prompter.pick<'one', $TSAny>('Choose an output voice:', [
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

  const intents: { intentName: string }[] = [];
  do {
    intents.push(await addIntent(context, resourceName, intents, parameters));
  } while (await prompter.yesOrNo('Would you like to create another intent?', false));

  return {
    resourceName: resourceName,
    botName,
    intents,
    outputVoice,
    sessionTimeout,
    coppa,
  };
};
