import inferAssets from '../assets/inferQuestions';
import getAllDefaults from '../default-values/infer-defaults';
import regionMapper from '../assets/regionMapping';
import { ResourceAlreadyExistsError, ResourceDoesNotExistError, exitOnNextTick, open } from 'amplify-cli-core';
const inquirer = require('inquirer');
const path = require('path');
const fs = require('fs-extra');
import { enableGuestAuth } from './enable-guest-auth';

// Predictions Info
const category = 'predictions';
const parametersFileName = 'parameters.json';
const templateFilename = 'infer-template.json.ejs';
const inferTypes = ['inferModel'];
const service = 'SageMaker';

async function addWalkthrough(context) {
  while (!checkIfAuthExists(context)) {
    if (
      await context.amplify.confirmPrompt(
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

  return await configure(context);
}

async function updateWalkthrough(context) {
  const { amplify } = context;
  const { amplifyMeta } = amplify.getProjectDetails();

  const predictionsResources = [];

  Object.keys(amplifyMeta[category]).forEach(resourceName => {
    if (inferTypes.includes(amplifyMeta[category][resourceName].inferType)) {
      predictionsResources.push({
        name: resourceName,
        value: { name: resourceName, inferType: amplifyMeta[category][resourceName].inferType },
      });
    }
  });
  if (predictionsResources.length === 0) {
    const errMessage = 'No resources to update. You need to add a resource.';
    context.print.error(errMessage);
    context.usageData.emitError(new ResourceDoesNotExistError(errMessage));
    exitOnNextTick(0);
    return undefined;
  }
  let resourceObj = predictionsResources[0].value;
  if (predictionsResources > 1) {
    const resourceAnswer = await inquirer.prompt({
      type: 'list',
      name: 'resource',
      messages: 'Which infer resource would you like to update?',
      choices: predictionsResources,
    });
    resourceObj = resourceAnswer.resource;
  }

  return configure(context, resourceObj);
}

async function configure(context, resourceObj) {
  const { amplify } = context;
  const defaultValues = getAllDefaults(amplify.getProjectDetails());
  const projectBackendDirPath = context.amplify.pathManager.getBackendDirPath();

  let parameters = {};
  let inferType;
  if (resourceObj) {
    const resourceDirPath = path.join(projectBackendDirPath, category, resourceObj.name);
    const parametersFilePath = path.join(resourceDirPath, parametersFileName);
    try {
      parameters = amplify.readJsonFile(parametersFilePath);
    } catch (e) {
      parameters = {};
    }
    inferType = resourceObj.inferType;
    parameters.resourceName = resourceObj.name;
    Object.assign(defaultValues, parameters);
  }
  let answers = {};

  if (!parameters.resourceName) {
    answers = await inquirer.prompt(inferAssets.setup.type());
    // check if that type is already created
    const resourceType = resourceAlreadyExists(context, answers.inferType);
    if (resourceType) {
      const errMessage = `${resourceType} has already been added to this project.`;
      context.print.warning(errMessage);
      context.usageData.emitError(new ResourceAlreadyExistsError(errMessage));
      exitOnNextTick(0);
    }

    Object.assign(answers, await inquirer.prompt(inferAssets.setup.name(`${answers.inferType}${defaultValues.resourceName}`)));
    inferType = answers.inferType;
    if (inferType === 'modelInfer') {
      defaultValues.region = regionMapper.getAvailableRegion(context, 'SageMaker', defaultValues.region);
    }
  }

  Object.assign(answers, await followUpQuestions(context, inferAssets[inferType], inferType, defaultValues, parameters));
  answers = { ...answers, service };
  Object.assign(defaultValues, answers);

  // auth permissions
  if (answers.access === 'authAndGuest') {
    await enableGuestAuth(context, defaultValues.resourceName, true);
  }

  const { resourceName } = defaultValues;
  delete defaultValues.service;
  delete defaultValues.region;
  defaultValues.inferType = inferType;
  const resourceDirPath = path.join(projectBackendDirPath, category, resourceName);
  const amplifyMetaValues = {
    resourceName,
    service,
    inferType,
  };
  // write to file
  fs.ensureDirSync(resourceDirPath);
  const parametersFilePath = path.join(resourceDirPath, parametersFileName);
  const jsonString = JSON.stringify(defaultValues, null, 4);
  fs.writeFileSync(parametersFilePath, jsonString, 'utf8');
  if (!parameters.resourceName) {
    await copyCfnTemplate(context, category, resourceName, defaultValues);
  }
  addRegionMapping(context, resourceName, inferType);
  return amplifyMetaValues;
}

function addRegionMapping(context, resourceName, inferType) {
  const regionMapping = regionMapper.getRegionMapping(context, service, inferType);
  const projectBackendDirPath = context.amplify.pathManager.getBackendDirPath();
  const identifyCFNFilePath = path.join(projectBackendDirPath, category, resourceName, `${resourceName}-template.json`);
  const identifyCFNFile = context.amplify.readJsonFile(identifyCFNFilePath);
  identifyCFNFile.Mappings = regionMapping;
  const identifyCFNJSON = JSON.stringify(identifyCFNFile, null, 4);
  fs.writeFileSync(identifyCFNFilePath, identifyCFNJSON, 'utf8');
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

async function followUpQuestions(context, questionObj, inferType, defaultValues, parameters) {
  const answers = await inquirer.prompt(questionObj.endpointPrompt(parameters));
  if (answers.endpointConfig === 'import') {
    // attempt to get existing endpoints
    Object.assign(answers, await getEndpoints(context, questionObj, parameters));
  }
  if (answers.endpointConfig === 'create') {
    // create endpoint in console
    await createEndpoint(context, defaultValues);
    // import existing endpoint
    Object.assign(answers, await getEndpoints(context, questionObj, parameters));
  }

  Object.assign(answers, await inquirer.prompt(questionObj.authAccess.prompt(parameters)));
  return answers;
}

function checkIfAuthExists(context) {
  const { amplify } = context;
  const { amplifyMeta } = amplify.getProjectDetails();
  let authExists = false;
  const authServiceName = 'Cognito';
  const authCategory = 'auth';

  if (amplifyMeta[authCategory] && Object.keys(amplifyMeta[authCategory]).length > 0) {
    const categoryResources = amplifyMeta[authCategory];
    Object.keys(categoryResources).forEach(resource => {
      if (categoryResources[resource].service === authServiceName) {
        authExists = true;
      }
    });
  }
  return authExists;
}

function resourceAlreadyExists(context, inferType) {
  const { amplify } = context;
  const { amplifyMeta } = amplify.getProjectDetails();
  let type;

  if (amplifyMeta[category] && context.commandName !== 'update') {
    const categoryResources = amplifyMeta[category];
    Object.keys(categoryResources).forEach(resource => {
      if (categoryResources[resource].inferType === inferType) {
        type = inferType;
      }
    });
  }
  return type;
}

async function getEndpoints(context, questionObj, params) {
  const sagemaker = await context.amplify.executeProviderUtils(context, 'awscloudformation', 'getEndpoints');
  const endpoints = [];
  const endpointMap = {};
  sagemaker.Endpoints.forEach(endpoint => {
    endpoints.push({ name: `${endpoint.EndpointName}` });
    endpointMap[endpoint.EndpointName] = { endpointName: endpoint.EndpointName, endpointARN: endpoint.EndpointArn };
  });
  if (endpoints.length < 1) {
    const errMessage = 'No existing endpoints!';
    context.print.error(errMessage);
    context.usageData.emitError(new ResourceDoesNotExistError(errMessage));
    exitOnNextTick(0);
  }
  const { endpoint } = await inquirer.prompt(questionObj.importPrompt({ ...params, endpoints }));
  return endpointMap[endpoint];
}

async function createEndpoint(context, defaultValues) {
  const endpointConsoleUrl = `https://${defaultValues.region}.console.aws.amazon.com/sagemaker/home?region=${defaultValues.region}#/endpoints/create`;
  await open(endpointConsoleUrl, { wait: false });
  context.print.info('SageMaker Console:');
  context.print.success(endpointConsoleUrl);
  await inquirer.prompt({
    type: 'input',
    name: 'pressKey',
    message: 'Press enter to continue',
  });
}

module.exports = { addWalkthrough, updateWalkthrough };
