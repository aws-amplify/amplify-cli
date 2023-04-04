import {
  AmplifyCategories,
  AmplifySupportedService,
  exitOnNextTick,
  JSONUtilities,
  pathManager,
  stateManager,
} from '@aws-amplify/amplify-cli-core';
import {
  addTextractPolicies,
  generateLambdaAccessForRekognition,
  generateStorageAccessForRekognition,
  removeTextractPolicies,
} from '../assets/identifyCFNGenerate';
import identifyAssets from '../assets/identifyQuestions';
import regionMapper from '../assets/regionMapping';
import getAllDefaults from '../default-values/identify-defaults';
import { enableGuestAuth } from './enable-guest-auth';
import {
  invokeS3AddResource,
  invokeS3GetAllDefaults,
  invokeS3GetResourceName,
  invokeS3GetUserInputs,
  invokeS3RegisterAdminTrigger,
  invokeS3RemoveAdminLambdaTrigger,
} from './storage-api';
import { byValue, prompter, alphanumeric, between } from '@aws-amplify/amplify-prompts';
import { AmplifyError } from '@aws-amplify/amplify-cli-core';

const path = require('path');
const fs = require('fs-extra');
const os = require('os');
const uuid = require('uuid');

// Predictions Info
const templateFilename = 'identify-template.json.ejs';
const identifyTypes = ['identifyText', 'identifyEntities', 'identifyLabels'];
let service = 'Rekognition';
const category = AmplifyCategories.PREDICTIONS;
const storageCategory = AmplifyCategories.STORAGE;
const functionCategory = AmplifyCategories.FUNCTION;
const parametersFileName = 'parameters.json';
const s3defaultValuesFilename = 's3-defaults.js';
const prefixForAdminTrigger = 'protected/predictions/index-faces/';
// TODO support appsync

const PREDICTIONS_WALKTHROUGH_MODE = {
  ADD: 'ADD',
  UPDATE: 'UPDATE',
};

async function addWalkthrough(context) {
  while (!checkIfAuthExists(context)) {
    if (
      await prompter.yesOrNo(
        'You need to add auth (Amazon Cognito) to your project in order to add storage for user files. Do you want to add auth now?',
      )
    ) {
      await context.amplify.invokePluginMethod(context, 'auth', undefined, 'add', [context]);
      break;
    } else {
      context.usageData.emitSuccess();
      exitOnNextTick(0);
    }
  }

  return await configure(context, undefined, PREDICTIONS_WALKTHROUGH_MODE.ADD);
}

async function updateWalkthrough(context) {
  const { amplify } = context;
  const { amplifyMeta } = amplify.getProjectDetails();

  const predictionsResources = [];

  Object.keys(amplifyMeta[category]).forEach((resourceName) => {
    if (identifyTypes.includes(amplifyMeta[category][resourceName].identifyType)) {
      predictionsResources.push({
        name: resourceName,
        value: { name: resourceName, identifyType: amplifyMeta[category][resourceName].identifyType },
      });
    }
  });
  if (predictionsResources.length === 0) {
    throw new AmplifyError('ResourceDoesNotExistError', {
      message: 'No resources to update. You need to add a resource.',
    });
  }
  let resourceObj = predictionsResources[0].value;
  if (predictionsResources.length > 1) {
    resourceObj = await prompter.pick('Which identify resource would you like to update?', predictionsResources);
  }

  return await configure(context, resourceObj, PREDICTIONS_WALKTHROUGH_MODE.UPDATE);
}

async function createAndRegisterAdminLambdaS3Trigger(context, predictionsResourceName, s3ResourceName, configMode) {
  //In Add mode, predictions cloudformation is not yet created, hence do not use this in add-function
  const predictionsResourceSavedName = configMode === PREDICTIONS_WALKTHROUGH_MODE.ADD ? undefined : predictionsResourceName;
  let predictionsTriggerFunctionName = await createNewFunction(context, predictionsResourceSavedName, s3ResourceName);
  // adding additional lambda trigger
  const adminTriggerFunctionParams = {
    tag: 'adminTriggerFunction',
    category: 'predictions', //function is owned by storage category
    permissions: ['CREATE_AND_UPDATE', 'READ', 'DELETE'], //permissions to access S3
    triggerFunction: predictionsTriggerFunctionName,
    triggerEvents: ['s3:ObjectCreated:*', 's3:ObjectRemoved:*'], //s3 events to trigger S3
    triggerPrefix: [{ prefix: prefixForAdminTrigger, prefixTransform: 'NONE' }], //trigger only if events are seen on the p
  };
  const s3UserInputs = await invokeS3RegisterAdminTrigger(context, s3ResourceName, adminTriggerFunctionParams);
  return s3UserInputs;
}

async function configure(context, predictionsResourceObj, configMode /*add/update*/) {
  const { amplify } = context;
  const defaultValues = getAllDefaults(amplify.getProjectDetails());
  const projectBackendDirPath = pathManager.getBackendDirPath();
  let identifyType;

  let parameters = {};
  if (predictionsResourceObj) {
    const predictionsResourceDirPath = path.join(projectBackendDirPath, category, predictionsResourceObj.name);
    const predictionsParametersFilePath = path.join(predictionsResourceDirPath, parametersFileName);
    try {
      parameters = amplify.readJsonFile(predictionsParametersFilePath);
    } catch (e) {
      parameters = {};
    }
    identifyType = predictionsResourceObj.identifyType;
    parameters.resourceName = predictionsResourceObj.name;
    Object.assign(defaultValues, parameters);
  }
  let answers = {};

  // only ask this for add
  if (!parameters.resourceName) {
    answers.identifyType = await prompter.pick('What would you like to identify?', [
      {
        name: 'Identify Text',
        value: 'identifyText',
      },
      {
        name: 'Identify Entities',
        value: 'identifyEntities',
      },
      {
        name: 'Identify Labels',
        value: 'identifyLabels',
      },
    ]);

    // check if that type is already created
    const resourceType = resourceAlreadyExists(context, answers.identifyType);
    if (resourceType) {
      throw new AmplifyError('ResourceAlreadyExistsError', {
        message: `${resourceType} has already been added to this project.`,
      });
    }

    answers.resourceName = await prompter.input('Provide a friendly name for your resource', {
      initial: `${answers.identifyType}${defaultValues.resourceName}`,
      validate: alphanumeric(),
    });
    identifyType = answers.identifyType;
    parameters.resourceName = answers.resourceName;
  }

  Object.assign(answers, await followUpQuestions(identifyType, parameters));
  delete answers.setup;
  Object.assign(defaultValues, answers);

  // auth permissions
  if (answers.access === 'authAndGuest') {
    await enableGuestAuth(context, defaultValues.resourceName, true);
  }

  let s3Resource = {};
  let predictionsTriggerFunctionName;
  if (answers.adminTask) {
    const s3ResourceName = await invokeS3GetResourceName(context);
    const predictionsResourceName = parameters.resourceName;

    // Check is storage already exists in the project
    if (s3ResourceName) {
      let s3UserInputs = await invokeS3GetUserInputs(context, s3ResourceName);
      s3Resource.bucketName = s3UserInputs.bucketName;
      s3Resource.resourceName = s3UserInputs.resourceName;
      // Check if any lambda triggers are already existing in the project.
      if (!s3UserInputs.adminTriggerFunction) {
        s3UserInputs = await createAndRegisterAdminLambdaS3Trigger(context, predictionsResourceName, s3Resource.resourceName, configMode);
        predictionsTriggerFunctionName = s3UserInputs.adminTriggerFunction.triggerFunction;
      } else {
        predictionsTriggerFunctionName = s3UserInputs.adminTriggerFunction.triggerFunction;
      }
    } else {
      //create S3 bucket
      s3Resource = await addS3ForIdentity(context, answers.access, undefined);
      //create admin lambda and register with s3 as trigger
      const s3UserInputs = await createAndRegisterAdminLambdaS3Trigger(
        context,
        predictionsResourceName,
        s3Resource.resourceName,
        configMode,
      );
      predictionsTriggerFunctionName = s3UserInputs.adminTriggerFunction.triggerFunction;
    }
    s3Resource.functionName = predictionsTriggerFunctionName;

    /**
     * Update function name
     */
    const functionResourceDirPath = path.join(projectBackendDirPath, functionCategory, predictionsTriggerFunctionName);
    const functionParametersFilePath = path.join(functionResourceDirPath, parametersFileName);
    let functionParameters;
    try {
      functionParameters = amplify.readJsonFile(functionParametersFilePath);
    } catch (e) {
      functionParameters = {};
    }
    functionParameters.resourceName = answers.resourceName || parameters.resourceName;
    const functionJsonString = JSON.stringify(functionParameters, null, 4);
    fs.writeFileSync(functionParametersFilePath, functionJsonString, 'utf8');
  } else if (parameters.resourceName) {
    const s3ResourceName = s3ResourceAlreadyExists();
    if (s3ResourceName) {
      let s3UserInputs = await invokeS3GetUserInputs(context, s3ResourceName);
      if (
        s3UserInputs.adminLambdaTrigger &&
        s3UserInputs.adminLambdaTrigger.triggerFunction &&
        s3UserInputs.adminLambdaTrigger.triggerFunction !== 'NONE'
      ) {
        await invokeS3RemoveAdminLambdaTrigger(context, s3ResourceName);
      }
    }
  }

  const { resourceName } = defaultValues;
  delete defaultValues.service;
  delete defaultValues.region;
  const resourceDirPath = path.join(projectBackendDirPath, category, resourceName);
  // write to file
  fs.ensureDirSync(resourceDirPath);
  const parametersFilePath = path.join(resourceDirPath, parametersFileName);
  const jsonString = JSON.stringify(defaultValues, null, 4);
  fs.writeFileSync(parametersFilePath, jsonString, 'utf8');
  const options = {};
  options.dependsOn = [];
  defaultValues.adminTask = answers.adminTask;
  if (answers.adminTask) {
    defaultValues.storageResourceName = s3Resource.resourceName;
    defaultValues.functionName = s3Resource.functionName;
    options.dependsOn.push({
      category: functionCategory,
      resourceName: predictionsTriggerFunctionName,
      attributes: ['Name', 'Arn', 'LambdaExecutionRole'],
    });
    options.dependsOn.push({
      category: storageCategory,
      resourceName: s3Resource.resourceName,
      attributes: ['BucketName'],
    });

    if (answers.folderPolicies === 'app' && parameters.resourceName && configMode != PREDICTIONS_WALKTHROUGH_MODE.ADD) {
      addStorageIAMResourcesToIdentifyCFNFile(parameters.resourceName, s3Resource.resourceName);
    }
  }

  /**
   * Generate Predictions cloudformation
   */
  Object.assign(defaultValues, options);

  const { dependsOn } = defaultValues;
  let amplifyMetaValues = {
    resourceName,
    service,
    dependsOn,
    identifyType,
  };
  if (configMode === PREDICTIONS_WALKTHROUGH_MODE.UPDATE) {
    // update CFN template
    updateCFN(context, resourceName, identifyType);
  }
  if (configMode === PREDICTIONS_WALKTHROUGH_MODE.ADD) {
    await copyCfnTemplate(context, category, resourceName, defaultValues);
  }
  addRegionMapping(context, resourceName, identifyType);
  return amplifyMetaValues;
}

function addRegionMapping(context, resourceName, identifyType) {
  const regionMapping = regionMapper.getRegionMapping(context, service, identifyType);
  const projectBackendDirPath = context.amplify.pathManager.getBackendDirPath();
  const identifyCFNFilePath = path.join(projectBackendDirPath, category, resourceName, `${resourceName}-template.json`);
  const identifyCFNFile = context.amplify.readJsonFile(identifyCFNFilePath);
  identifyCFNFile.Mappings = regionMapping;
  const identifyCFNJSON = JSON.stringify(identifyCFNFile, null, 4);
  fs.writeFileSync(identifyCFNFilePath, identifyCFNJSON, 'utf8');
}

function updateCFN(context, resourceName, identifyType) {
  if (identifyType === 'identifyText') {
    const projectBackendDirPath = context.amplify.pathManager.getBackendDirPath();
    const identifyCFNFilePath = path.join(projectBackendDirPath, category, resourceName, `${resourceName}-template.json`);
    const identifyCFNFile = context.amplify.readJsonFile(identifyCFNFilePath);
    let identifyCFNFileJSON;
    if (service === 'RekognitionAndTextract') {
      // add textract policies
      identifyCFNFileJSON = addTextractPolicies(identifyCFNFile);
    } else {
      // remove textract policies
      identifyCFNFileJSON = removeTextractPolicies(identifyCFNFile);
    }
    fs.writeFileSync(identifyCFNFilePath, identifyCFNFileJSON, 'utf8');
    context.amplify.updateamplifyMetaAfterResourceUpdate(category, resourceName, 'service', service);
  }
}

async function copyCfnTemplate(context, categoryName, resourceName, options) {
  const { amplify } = context;
  const targetDir = amplify.pathManager.getBackendDirPath();
  const pluginDir = __dirname;
  const copyJobs = [
    {
      dir: pluginDir,
      template: `../cloudformation-templates/${templateFilename}`,
      target: `${targetDir}/${categoryName}/${resourceName}/${resourceName}-template.json`,
    },
  ];

  // copy over the files
  return await context.amplify.copyBatch(context, copyJobs, options);
}

// eslint-disable-next-line consistent-return
async function followUpQuestions(identifyType, parameters) {
  switch (identifyType) {
    case 'identifyText': {
      return followUpIdentifyTextQuestions(parameters);
    }
    case 'identifyEntities': {
      return followUpIdentifyEntitiesQuestions(parameters);
    }
    case 'identifyLabels': {
      return followUpIdentifyLabelsQuestions(parameters);
    }
  }
}

async function followUpIdentifyTextQuestions(parameters) {
  const answers = {
    identifyDoc: await prompter.yesOrNo('Would you also like to identify documents?', parameters?.identifyDoc ?? false),
    access: await askIdentifyAccess(parameters),
  };

  if (answers.identifyDoc) {
    service = 'RekognitionAndTextract';
  }

  Object.assign(answers, { format: answers.identifyDoc ? 'ALL' : 'PLAIN' });
}

async function askIdentifyAccess(parameters) {
  return await prompter.pick(
    'Who should have access?',
    [
      {
        name: 'Auth users only',
        value: 'auth',
      },
      {
        name: 'Auth and Guest users',
        value: 'authAndGuest',
      },
    ],
    {
      initial: byValue(parameters.access ?? 'auth'),
    },
  );
}

async function followUpIdentifyEntitiesQuestions(parameters) {
  const answers = {};

  answers.setup = await prompter.pick('Would you like to use the default configuration?', [
    {
      name: 'Default Configuration',
      value: 'default',
    },
    {
      name: 'Advanced Configuration',
      value: 'advanced',
    },
  ]);

  if (answers.setup === 'advanced') {
    answers.celebrityDetectionEnabled = await prompter.yesOrNo(
      'Would you like to enable celebrity detection?',
      parameters?.celebrityDetectionEnabled ?? true,
    );
    answers.adminTask = await prompter.yesOrNo(
      'Would you like to identify entities from a collection of images?',
      parameters?.adminTask ?? false,
    );

    if (answers.adminTask) {
      answers.maxEntities = await prompter.input('How many entities would you like to identify?', {
        initial: parameters?.maxEntities ?? 50,
        validate: between(1, 100, 'Please enter a number between 1 and 100!'),
        transform: (input) => Number.parseInt(input, 10),
      });
      answers.folderPolicies = await prompter.pick(
        'Would you like to allow users to add images to this collection?',
        [
          {
            name: 'Yes',
            value: 'app',
          },
          {
            name: 'No',
            value: 'admin',
          },
        ],
        {
          initial: parameters.folderPolicies ? byValue(parameters.folderPolicies) : 0,
        },
      );
    }
  }

  answers.access = await askIdentifyAccess(parameters);

  if (answers.setup && answers.setup === 'default') {
    Object.assign(answers, { celebrityDetectionEnabled: true });
  }

  if (!answers.adminTask) {
    answers.maxEntities = 0;
    answers.adminTask = false;
    answers.folderPolicies = '';
  }
  if (answers.folderPolicies === 'app') {
    answers.adminAuthProtected = 'ALLOW';
    if (answers.access === 'authAndGuest') {
      answers.adminGuestProtected = 'ALLOW';
    }
  }

  return answers;
}

async function followUpIdentifyLabelsQuestions(parameters) {
  const answers = {
    setup: await prompter.pick('Would you like to use the default configuration', [
      {
        name: 'Default Configuration',
        value: 'default',
      },
      {
        name: 'Advanced Configuration',
        value: 'advanced',
      },
    ]),
  };

  if (answers.setup === 'advanced') {
    answers.type = await prompter.pick(
      'What kind of label detection?',
      [
        {
          name: 'Only identify unsafe labels',
          value: 'UNSAFE',
        },
        {
          name: 'Identify labels',
          value: 'LABELS',
        },
        {
          name: 'Identify all kinds',
          value: 'ALL',
        },
      ],
      {
        initial: byValue(parameters.type ?? 'LABELS'),
      },
    );
  }

  answers.access = await askIdentifyAccess(parameters);

  if (answers.setup === 'default') {
    Object.assign(answers, { type: 'LABELS' });
  }
}

function checkIfAuthExists(context) {
  const { amplify } = context;
  const { amplifyMeta } = amplify.getProjectDetails();
  let authExists = false;
  const authServiceName = 'Cognito';
  const authCategory = 'auth';

  if (amplifyMeta[authCategory] && Object.keys(amplifyMeta[authCategory]).length > 0) {
    const categoryResources = amplifyMeta[authCategory];
    Object.keys(categoryResources).forEach((resource) => {
      if (categoryResources[resource].service === authServiceName) {
        authExists = true;
      }
    });
  }
  return authExists;
}

function resourceAlreadyExists(context, identifyType) {
  const { amplify } = context;
  const { amplifyMeta } = amplify.getProjectDetails();
  let type;

  if (amplifyMeta[category] && context.commandName !== 'update') {
    const categoryResources = amplifyMeta[category];
    Object.keys(categoryResources).forEach((resource) => {
      if (categoryResources[resource].identifyType === identifyType) {
        type = identifyType;
      }
    });
  }
  return type;
}

async function addS3ForIdentity(context, storageAccess, bucketName) {
  const defaultValuesSrc = `${__dirname}/../default-values/${s3defaultValuesFilename}`;
  const { getAllAuthDefaultPerm, getAllAuthAndGuestDefaultPerm } = require(defaultValuesSrc);
  let s3UserInputs = await invokeS3GetAllDefaults(context, storageAccess); //build the predictions specific s3 bucket

  let answers = {};

  answers = { ...answers, storageAccess, resourceName: s3UserInputs.resourceName };

  /**
   * Ask bucket name questions
   */
  if (!bucketName) {
    const question = {
      name: identifyAssets.s3bucket.key,
      message: identifyAssets.s3bucket.question,
      validate: (value) => {
        const regex = new RegExp('^[a-zA-Z0-9-]+$');
        return regex.test(value) ? true : 'Bucket name can only use the following characters: a-z 0-9 -';
      },
    };
    s3UserInputs.bucketName = await prompter.input(question.message, {
      validate: question.validate,
      initial: s3UserInputs.bucketName,
    });
  } else {
    s3UserInputs.bucketName = bucketName;
  }

  /**
   * Get default auth params for S3
   */

  let allowUnauthenticatedIdentities; // default to undefined since if S3 does not require unauth access the IdentityPool can still have that enabled
  if (answers.storageAccess === 'authAndGuest') {
    s3UserInputs = getAllAuthAndGuestDefaultPerm(s3UserInputs);
    allowUnauthenticatedIdentities = true;
  } else {
    s3UserInputs = getAllAuthDefaultPerm(s3UserInputs);
  }

  /**
   * Create S3 bucket and add admin trigger.
   */
  const resultS3UserInput = await invokeS3AddResource(context, s3UserInputs);
  // getting requirement satisfaction map
  const storageRequirements = { authSelections: 'identityPoolAndUserPool', allowUnauthenticatedIdentities };

  const checkResult = await context.amplify.invokePluginMethod(context, 'auth', undefined, 'checkRequirements', [
    storageRequirements,
    context,
    storageCategory,
    s3UserInputs.resourceName,
  ]);

  // If auth is imported and configured, we have to throw the error instead of printing since there is no way to adjust the auth
  // configuration.
  if (checkResult.authImported === true && checkResult.errors && checkResult.errors.length > 0) {
    throw new AmplifyError('ConfigurationError', {
      message: 'The imported auth config is not compatible with the specified predictions config',
      details: checkResult.errors.join(os.EOL),
      resolution: 'Manually configure the imported auth resource according to the details above',
    });
  }

  if (checkResult.errors && checkResult.errors.length > 0) {
    context.print.warning(checkResult.errors.join(os.EOL));
  }

  // If auth is not imported and there were errors, adjust or enable auth configuration
  if (!checkResult.authEnabled || !checkResult.requirementsMet) {
    try {
      // If this is not set as requirement, then explicitly configure it to disabled.
      if (storageRequirements.allowUnauthenticatedIdentities === undefined) {
        storageRequirements.allowUnauthenticatedIdentities = false;
      }
      await context.amplify.invokePluginMethod(context, 'auth', undefined, 'externalAuthEnable', [
        context,
        storageCategory,
        s3UserInputs.resourceName,
        storageRequirements,
      ]);
    } catch (error) {
      context.print.error(error);
      throw error;
    }
  }

  // At this point we have a valid auth configuration either imported or added/updated.

  return {
    bucketName: resultS3UserInput.bucketName,
    resourceName: resultS3UserInput.resourceName,
    functionName: resultS3UserInput.adminTriggerFunction ? resultS3UserInput.adminTriggerFunction.triggerFunction : undefined,
  };
}

function s3ResourceAlreadyExists() {
  const amplifyMeta = stateManager.getMeta();
  let resourceName;

  if (amplifyMeta[storageCategory]) {
    const categoryResources = amplifyMeta[storageCategory];
    Object.keys(categoryResources).forEach((resource) => {
      if (categoryResources[resource].service === AmplifySupportedService.S3) {
        resourceName = resource;
      }
    });
  }

  return resourceName;
}

async function postCFNGenUpdateLambdaResourceInPredictions(context, predictionsResourceName, functionName, s3ResourceName) {
  const projectBackendDirPath = pathManager.getBackendDirPath();
  const identifyCFNFilePath = path.join(
    projectBackendDirPath,
    category,
    predictionsResourceName,
    `${predictionsResourceName}-template.json`,
  );
  let identifyCFNFile;
  identifyCFNFile = JSONUtilities.readJson(identifyCFNFilePath);

  identifyCFNFile = generateLambdaAccessForRekognition(identifyCFNFile, functionName, s3ResourceName);
  JSONUtilities.writeJson(identifyCFNFilePath, identifyCFNFile);

  const amplifyMeta = stateManager.getMeta();
  const dependsOnResources = amplifyMeta.predictions[predictionsResourceName].dependsOn;
  dependsOnResources.push({
    category: functionCategory,
    resourceName: functionName,
    attributes: ['Name', 'Arn', 'LambdaExecutionRole'],
  });
  dependsOnResources.push({
    category: storageCategory,
    resourceName: s3ResourceName,
    attributes: ['BucketName'],
  });

  // Update DependsOn
  context.amplify.updateamplifyMetaAfterResourceUpdate(category, predictionsResourceName, 'dependsOn', dependsOnResources);
}

async function createNewFunction(context, predictionsResourceName, s3ResourceName) {
  const targetDir = pathManager.getBackendDirPath();
  const [shortId] = uuid.v4().split('-');
  const functionName = `RekognitionIndexFacesTrigger${shortId}`;
  const pluginDir = __dirname;

  const defaults = {
    functionName: `${functionName}`,
    roleName: `${functionName}LambdaRole${shortId}`,
  };

  const copyJobs = [
    {
      dir: pluginDir,
      template: '../triggers/s3/lambda-cloudformation-template.json.ejs',
      target: `${targetDir}/function/${functionName}/${functionName}-cloudformation-template.json`,
    },
    {
      dir: pluginDir,
      template: '../triggers/s3/event.json',
      target: `${targetDir}/function/${functionName}/src/event.json`,
    },
    {
      dir: pluginDir,
      template: '../triggers/s3/index.js',
      target: `${targetDir}/function/${functionName}/src/index.js`,
    },
    {
      dir: pluginDir,
      template: '../triggers/s3/package.json.ejs',
      target: `${targetDir}/function/${functionName}/src/package.json`,
    },
  ];

  // copy over the files
  await context.amplify.copyBatch(context, copyJobs, defaults);
  if (predictionsResourceName) {
    await postCFNGenUpdateLambdaResourceInPredictions(context, predictionsResourceName, functionName, s3ResourceName);
  }
  // Update amplify-meta and backend-config

  const backendConfigs = {
    service: AmplifySupportedService.LAMBDA,
    providerPlugin: 'awscloudformation',
    build: true,
  };

  await context.amplify.updateamplifyMetaAfterResourceAdd(functionCategory, functionName, backendConfigs);

  context.print.success(`Successfully added resource ${functionName} locally`);
  return functionName;
}

function addStorageIAMResourcesToIdentifyCFNFile(predictionsResourceName, s3ResourceName) {
  const projectBackendDirPath = pathManager.getBackendDirPath();
  const identifyCFNFilePath = path.join(
    projectBackendDirPath,
    category,
    predictionsResourceName,
    `${predictionsResourceName}-template.json`,
  );
  let identifyCFNFile = JSONUtilities.readJson(identifyCFNFilePath);
  identifyCFNFile = generateStorageAccessForRekognition(identifyCFNFile, s3ResourceName, prefixForAdminTrigger);
  const identifyCFNString = JSON.stringify(identifyCFNFile, null, 4);
  fs.writeFileSync(identifyCFNFilePath, identifyCFNString, 'utf8');
}

module.exports = { addWalkthrough, updateWalkthrough };
