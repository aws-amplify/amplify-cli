"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIAMPolicies = exports.migrate = exports.updateWalkthrough = exports.addWalkthrough = void 0;
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const amplify_cli_core_2 = require("@aws-amplify/amplify-cli-core");
const category = 'interactions';
const parametersFileName = 'lex-params.json';
const cfnParametersFilename = 'parameters.json';
const serviceName = 'Lex';
const addWalkthrough = async (context, defaultValuesFilename, serviceMetadata) => {
    return configure(context, defaultValuesFilename, serviceMetadata);
};
exports.addWalkthrough = addWalkthrough;
const updateWalkthrough = async (context, defaultValuesFilename, serviceMetadata) => {
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
        throw new amplify_cli_core_1.AmplifyFault('ResourceNotFoundFault', {
            message: 'No resources to update. You need to add a resource.',
        });
    }
    const answer = await amplify_prompts_1.prompter.pick('Specify the resource that you would want to update', Object.keys(lexResources));
    return configure(context, defaultValuesFilename, serviceMetadata, answer);
};
exports.updateWalkthrough = updateWalkthrough;
const configure = async (context, defaultValuesFilename, serviceMetadata, resourceName) => {
    const { amplify } = context;
    context.exeInfo = amplify.getProjectDetails();
    const { samples } = serviceMetadata;
    const defaultValuesSrc = `${__dirname}/../default-values/${defaultValuesFilename}`;
    const { getAllDefaults } = require(defaultValuesSrc);
    const defaultValues = getAllDefaults(amplify.getProjectDetails());
    amplify_prompts_1.printer.blankLine();
    amplify_prompts_1.printer.info('Welcome to the Amazon Lex chatbot wizard');
    amplify_prompts_1.printer.info('You will be asked a series of questions to help determine how to best construct your chatbot.');
    amplify_prompts_1.printer.blankLine();
    let startChoice;
    const resolvedResourceName = resourceName ||
        (await amplify_prompts_1.prompter.input('Provide a friendly resource name that will be used to label this category in the project:', {
            validate: (0, amplify_prompts_1.alphanumeric)(),
            initial: defaultValues['resourceName'],
        }));
    if (!resourceName) {
        startChoice = await amplify_prompts_1.prompter.pick('Would you like to start with a sample chatbot or start from scratch?', [
            'Start with a sample',
            'Start from scratch',
        ]);
    }
    else {
        startChoice = 'Update an existing chatbot';
    }
    let answers;
    let parameters;
    let deleteIntentConfirmed = false;
    if (startChoice === 'Start with a sample') {
        answers = await startWithSampleBotWalkthrough(samples, resolvedResourceName);
    }
    else if (startChoice === 'Update an existing chatbot') {
        ({ parameters, deleteIntentConfirmed, answers } = await updateExistingBotWalkthrough(resolvedResourceName, parameters, context));
    }
    else if (startChoice === 'Start from scratch') {
        answers = await startBotFromScratchWalkthrough(resolvedResourceName, context, parameters, defaultValuesFilename);
    }
    else {
        throw new amplify_cli_core_1.AmplifyError('InputValidationError', {
            message: 'Valid option not chosen',
        });
    }
    if (parameters) {
        if (answers.intentName) {
            if (deleteIntentConfirmed) {
                parameters.intents = parameters.intents.filter((intent) => intent.intentName !== answers.intentName);
            }
            else {
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
                            }
                            else {
                                intent.newSlotTypes = answers.newSlotTypes;
                            }
                        }
                    }
                });
            }
        }
        else if (!answers.intents) {
            throw new amplify_cli_core_1.AmplifyError('InputValidationError', {
                message: 'Valid option not chosen',
            });
        }
        else {
            parameters.intents = parameters.intents.concat(answers.intents);
        }
        answers = parameters;
    }
    return answers;
};
const addIntent = async (context, resourceName, intents, parameters) => {
    let intentName = await askIntent();
    while (intents.filter((intent) => intent.intentName === intentName).length > 0 ||
        (parameters && parameters.intents.filter((intent) => intent.intentName === intentName).length > 0)) {
        amplify_prompts_1.printer.blankLine();
        amplify_prompts_1.printer.info('Intent names must be unique');
        amplify_prompts_1.printer.blankLine();
        intentName = await askIntent();
    }
    const utterances = await addUtterance(resourceName);
    amplify_prompts_1.printer.blankLine();
    amplify_prompts_1.printer.info('Now, add a slot to your intent. A slot is data the user must provide to fulfill the intent.');
    amplify_prompts_1.printer.blankLine();
    const { slots, newSlotTypes } = await addSlot(context, intentName, resourceName, parameters);
    let confirmationQuestion;
    let cancelMessage;
    if (await amplify_prompts_1.prompter.yesOrNo('Would you like to add a confirmation prompt to your intent?', false)) {
        confirmationQuestion = await amplify_prompts_1.prompter.input('Enter a confirmation message (e.g. Are you sure you want to order a {Drink_name}?):', {
            validate: (0, amplify_prompts_1.and)([(0, amplify_prompts_1.minLength)(1), (0, amplify_prompts_1.maxLength)(1000)], 'Confirmation questions can have a maximum of 1000 characters and cannot be empty'),
        });
        cancelMessage = await amplify_prompts_1.prompter.input('Enter a cancel message for when the user says no to the confirmation message (e.g. Okay. Your order will not be placed.):', { validate: (0, amplify_prompts_1.and)([(0, amplify_prompts_1.minLength)(1), (0, amplify_prompts_1.maxLength)(1000)], 'Cancel messages can have a maximum of 1000 characters and cannot be empty') });
    }
    const intentFulfillment = await amplify_prompts_1.prompter.pick('How would you like the intent to be fulfilled?', [
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
const askIntent = async () => {
    return amplify_prompts_1.prompter.input('Give a unique name for the new intent:', {
        validate: (0, amplify_prompts_1.matchRegex)(/^([A-Za-z]_?){1,100}$/, 'Intent name can only contain letters and underscores, cannot be empty, and must be no longer than 100 characters'),
    });
};
const addUtterance = async (resourceName) => {
    const utterances = [];
    do {
        utterances.push(await amplify_prompts_1.prompter.input('Enter a sample utterance (spoken or typed phrase that invokes your intent. e.g. Book a hotel)', {
            validate: (0, amplify_prompts_1.matchRegex)(/^.{1,200}$/, 'Utterances can be a maximum of 200 characters and cannot be empty'),
            initial: resourceName,
        }));
    } while (await amplify_prompts_1.prompter.yesOrNo('Would you like to add another utterance?', false));
    return utterances;
};
const addSlot = async (context, intentName, resourceName, parameters) => {
    var _a;
    const slots = [];
    const newSlotTypes = [];
    do {
        const slot = {
            name: '',
            type: '',
            prompt: '',
            required: true,
            customType: false,
        };
        slot.name = await askSlotName();
        while (slots.filter((existingSlot) => existingSlot.name === slot.name).length > 0 ||
            (parameters &&
                parameters.intents.filter((intent) => intent.intentName === intentName)[0] &&
                parameters.intents
                    .filter((intent) => intent.intentName === intentName)[0]
                    .slots.filter((existingSlot) => existingSlot.name === slot.name).length > 0)) {
            amplify_prompts_1.printer.blankLine();
            amplify_prompts_1.printer.info('Slot names must be unique');
            amplify_prompts_1.printer.blankLine();
            slot.name = await askSlotName();
        }
        const slotType = await getSlotType(context, newSlotTypes, parameters);
        slot.type = slotType.slotType;
        slot.customType = (_a = slotType.customType) !== null && _a !== void 0 ? _a : false;
        if (slotType.slotTypeDescription) {
            newSlotTypes.push(slotType);
        }
        slot.prompt = await amplify_prompts_1.prompter.input('Enter a prompt for your slot (e.g. What city?)', {
            initial: resourceName,
            validate: (0, amplify_prompts_1.matchRegex)(/^.{1,1000}$/, 'Prompts can have a maximum of 1000 characters and cannot be empty'),
        });
        slot.required = await amplify_prompts_1.prompter.yesOrNo('Should this slot be required?', true);
        slots.push(slot);
    } while (await amplify_prompts_1.prompter.yesOrNo('Would you like to add another slot?', true));
    return {
        slots,
        newSlotTypes,
    };
};
const askSlotName = async () => {
    return amplify_prompts_1.prompter.input('Enter a name for your slot (e.g. Location)', {
        validate: (0, amplify_prompts_1.matchRegex)(/^([A-Za-z]_?){1,100}$/, 'Slot name can only contain letters, must be no longer than 100 characters, and cannot be empty'),
    });
};
const getSlotType = async (context, newSlotTypes, parameters) => {
    let slotType;
    const slotTypeChoice = await amplify_prompts_1.prompter.pick("Would you like to choose an Amazon built-in slot type, a slot type you've already made, or create a new slot type?", ['Amazon built-in slot type', "Slot type I've already made", 'Create a new slot type']);
    if (slotTypeChoice === 'Amazon built-in slot type') {
        let slotTypeOptions = '';
        let builtInSlotTypes = [];
        let builtInSlotTypesReturn;
        do {
            builtInSlotTypesReturn = await context.amplify.executeProviderUtils(context, 'awscloudformation', 'getBuiltInSlotTypes', slotTypeOptions);
            builtInSlotTypes = builtInSlotTypes.concat(builtInSlotTypesReturn.slotTypes.map((builtinSlotType) => builtinSlotType.signature));
            slotTypeOptions = builtInSlotTypesReturn.nextToken;
        } while (slotTypeOptions);
        slotType = await amplify_prompts_1.prompter.pick('Choose a slot type:', builtInSlotTypes);
        return {
            slotType,
            customType: false,
        };
    }
    else if (slotTypeChoice === "Slot type I've already made") {
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
        slotType = await amplify_prompts_1.prompter.pick('Choose a slot type:', slotTypes);
        return {
            slotType,
            customType: true,
        };
    }
    else if (slotTypeChoice === 'Create a new slot type') {
        slotType = await amplify_prompts_1.prompter.input('What would you like to name your slot type?', {
            validate: (0, amplify_prompts_1.matchRegex)(/^([A-Za-z]_?){1,100}$/, 'The slot name must contain only letters and non-consecutive underscores, start with a letter, and be no more than 100 characters'),
        });
        const slotTypeDescription = await amplify_prompts_1.prompter.input('Give a description of your slot type:', {
            validate: (0, amplify_prompts_1.matchRegex)(/^.{1,1000}$/, 'Slot type descriptions can have a maximum of 1000 characters and cannot be empty'),
        });
        const slotValues = [];
        do {
            let slotValue = await askSlotTypeValue();
            while (slotValues.filter((existingSlotValue) => existingSlotValue === slotValue).length > 0) {
                amplify_prompts_1.printer.blankLine();
                amplify_prompts_1.printer.info('Slot values must be unique');
                amplify_prompts_1.printer.blankLine();
                slotValue = await askSlotTypeValue();
            }
            slotValues.push(slotValue);
        } while (await amplify_prompts_1.prompter.yesOrNo('Add another slot value?', true));
        return {
            slotType,
            slotTypeDescription,
            slotValues,
            customType: true,
        };
    }
    throw new amplify_cli_core_1.AmplifyError('InputValidationError', {
        message: 'Valid option not chosen',
    });
};
const askSlotTypeValue = async () => {
    return amplify_prompts_1.prompter.input('Add a possible value for your slot:', {
        validate: (0, amplify_prompts_1.matchRegex)(/^.{1,1000}$/, 'Slot values can have a maximum of 1000 characters and cannot be empty'),
    });
};
const askLambda = async (context) => {
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
        amplify_prompts_1.printer.error(`You do not have any lambda functions configured in the region ${projectRegion}`);
        return null;
    }
    const lambdaChoice = await amplify_prompts_1.prompter.pick('Select a Lambda function', lambdaOptions);
    return {
        region: projectRegion,
        accountId: accountID,
        lambdaArn: lambdaChoice.Arn,
        lambdaName: lambdaChoice.FunctionName,
    };
};
const migrate = async (context, projectPath, resourceName) => {
    const { amplify } = context;
    const targetDir = amplify.pathManager.getBackendDirPath();
    const resourceDirPath = path_1.default.join(targetDir, category, resourceName);
    const parametersFilePath = path_1.default.join(resourceDirPath, parametersFileName);
    const defaultValuesSrc = `${__dirname}/../default-values/lex-defaults.js`;
    const { getAllDefaults } = require(defaultValuesSrc);
    const defaultValues = getAllDefaults(amplify.getProjectDetails());
    let parameters;
    try {
        parameters = amplify_cli_core_2.JSONUtilities.readJson(parametersFilePath);
    }
    catch (e) {
        throw new amplify_cli_core_1.AmplifyFault('FileNotFoundFault', {
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
    await context.amplify.copyBatch(context, copyJobs, defaultValues, true, false);
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
    const cfnParametersFilePath = path_1.default.join(resourceDirPath, cfnParametersFilename);
    const jsonString = JSON.stringify(cfnParameters, null, 4);
    fs_extra_1.default.writeFileSync(cfnParametersFilePath, jsonString, 'utf8');
};
exports.migrate = migrate;
const getIAMPolicies = (resourceName, crudOptions) => {
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
};
exports.getIAMPolicies = getIAMPolicies;
const startWithSampleBotWalkthrough = async (samples, resourceName) => {
    const botName = await amplify_prompts_1.prompter.pick('Choose a sample chatbot:', ['BookTrip', 'OrderFlowers', 'ScheduleAppointment']);
    const coppa = await amplify_prompts_1.prompter.yesOrNo("Please indicate if your use of this bot is subject to the Children's Online Privacy Protection Act(COPPA).\nLearn more: https://www.ftc.gov/tips-advice/business-center/guidance/complying-coppa-frequently-asked-questions", false);
    if (coppa) {
        amplify_prompts_1.printer.blankLine();
        amplify_prompts_1.printer.info('You must obtain any required verifiable parental consent under COPPA.');
        amplify_prompts_1.printer.blankLine();
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
const updateExistingBotWalkthrough = async (resourceName, parameters, context) => {
    if (resourceName) {
        const projectBackendDirPath = context.amplify.pathManager.getBackendDirPath();
        const resourceDirPath = path_1.default.join(projectBackendDirPath, category, resourceName);
        const parametersFilePath = path_1.default.join(resourceDirPath, parametersFileName);
        parameters = amplify_cli_core_2.JSONUtilities.readJson(parametersFilePath, { throwIfNotExist: false });
    }
    else {
        throw new amplify_cli_core_1.AmplifyError('InputValidationError', {
            message: 'No chat bots to update',
        });
    }
    let deleteIntentConfirmed = false;
    let utterances = [];
    const intents = [];
    let slots = [];
    let newSlotTypes = [];
    const intentChoice = await amplify_prompts_1.prompter.pick('Would you like to add an intent or choose and existing intent?', [
        'Update an existing intent',
        'Add an intent',
        'Delete an intent',
    ]);
    let intentName = '';
    if (intentChoice === 'Update an existing intent') {
        const intentList = parameters.intents.map((x) => x.intentName);
        intentName = await amplify_prompts_1.prompter.pick('Choose an intent: ', intentList);
        if (await amplify_prompts_1.prompter.yesOrNo('Would you like to add an utterance?', true)) {
            utterances = await addUtterance(resourceName);
        }
        let slotReturn = [];
        if (await amplify_prompts_1.prompter.yesOrNo('Would you like to add a slot?', true)) {
            slotReturn = await addSlot(context, intentName, resourceName, parameters);
        }
        if (slotReturn.length > 1) {
            newSlotTypes = slotReturn[1];
        }
        slots = slotReturn[0];
    }
    else if (intentChoice === 'Add an intent') {
        do {
            intents.push(await addIntent(context, resourceName, intents, parameters));
        } while (await amplify_prompts_1.prompter.yesOrNo('Would you like to create another intent?', false));
    }
    else if (intentChoice === 'Delete an intent') {
        const intentList = parameters.intents.map((x) => x.intentName);
        intentName = await amplify_prompts_1.prompter.pick('Choose an intent: ', intentList);
        deleteIntentConfirmed = await amplify_prompts_1.prompter.yesOrNo('Are you sure you want to delete this intent?', false);
    }
    else {
        amplify_prompts_1.printer.error('Valid option not chosen');
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
const startBotFromScratchWalkthrough = async (resourceName, context, parameters, defaultValuesFilename) => {
    const defaultValuesSrc = `${__dirname}/../default-values/${defaultValuesFilename}`;
    const { getAllDefaults } = require(defaultValuesSrc);
    const defaultValues = getAllDefaults(context.amplify.getProjectDetails());
    const botName = await amplify_prompts_1.prompter.input('Enter a name for your bot:', {
        initial: defaultValues['botName'] || resourceName,
        validate: (0, amplify_prompts_1.matchRegex)(/^([A-Za-z]_?){2,50}$/, 'The bot name must contain only letters and non-consecutive underscores, start with a letter, and be between 2-50 characters'),
    });
    const outputVoice = await amplify_prompts_1.prompter.pick('Choose an output voice:', [
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
    const sessionTimeout = await amplify_prompts_1.prompter.input('After how long should the session timeout (in minutes)?', {
        initial: 5,
        validate: (0, amplify_prompts_1.between)(1, 1440, 'Session timeout must be a number and must be greater than 0 and less than 1440.'),
        transform: (input) => parseInt(input, 10),
    });
    const coppa = await amplify_prompts_1.prompter.yesOrNo("Please indicate if your use of this bot is subject to the Children's Online Privacy Protection Act(COPPA).\nLearn more: https://www.ftc.gov/tips-advice/business-center/guidance/complying-coppa-frequently-asked-questions", false);
    if (coppa) {
        amplify_prompts_1.printer.blankLine();
        amplify_prompts_1.printer.info('You must obtain any required verifiable parental consent under COPPA.');
        amplify_prompts_1.printer.blankLine();
    }
    amplify_prompts_1.printer.blankLine();
    amplify_prompts_1.printer.info('First create an intent for your new chatbot. An intent represents an action that the user wants to perform.');
    amplify_prompts_1.printer.blankLine();
    const intents = [];
    do {
        intents.push(await addIntent(context, resourceName, intents, parameters));
    } while (await amplify_prompts_1.prompter.yesOrNo('Would you like to create another intent?', false));
    return {
        resourceName: resourceName,
        botName,
        intents,
        outputVoice,
        sessionTimeout,
        coppa,
    };
};
//# sourceMappingURL=lex-walkthrough.js.map