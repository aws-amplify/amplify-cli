import interpretAssets from '../assets/interpretQuestions';
import getAllDefaults from '../default-values/interpret-defaults';
import regionMapper from '../assets/regionMapping';
import { enableGuestAuth } from './enable-guest-auth';

const inquirer = require('inquirer');
const path = require('path');
const fs = require('fs-extra');
const { ResourceAlreadyExistsError, ResourceDoesNotExistError, exitOnNextTick } = require('amplify-cli-core');
// Predictions Info
const category = 'predictions';
const parametersFileName = 'parameters.json';
const templateFilename = 'interpret-template.json.ejs';
const interpretTypes = ['interpretText'];
const service = 'Comprehend';

async function addWalkthrough(context: any) {
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

  // @ts-expect-error ts-migrate(2554) FIXME: Expected 2 arguments, but got 1.
  return await configure(context);
}

async function updateWalkthrough(context: any) {
  const { amplify } = context;
  const { amplifyMeta } = amplify.getProjectDetails();

  const predictionsResources: any = [];

  Object.keys(amplifyMeta[category]).forEach(resourceName => {
    if (interpretTypes.includes(amplifyMeta[category][resourceName].interpretType)) {
      predictionsResources.push({
        name: resourceName,
        value: { name: resourceName, interpretType: amplifyMeta[category][resourceName].interpretType },
      });
    }
  });
  if (predictionsResources.length === 0) {
    const errMessage = 'No resources to update. You need to add a resource.';
    context.print.error(errMessage);
    context.usageData.emitError(new ResourceDoesNotExistError(errMessage));
    exitOnNextTick(0);
    return;
  }
  let resourceObj = predictionsResources[0].value;
  if (predictionsResources > 1) {
    const resourceAnswer = await inquirer.prompt({
      type: 'list',
      name: 'resource',
      messages: 'Which interpret resource would you like to update?',
      choices: predictionsResources,
    });
    resourceObj = resourceAnswer.resource;
  }

  return configure(context, resourceObj);
}

async function configure(context: any, resourceObj: any) {
  const { amplify } = context;
  const defaultValues = getAllDefaults(amplify.getProjectDetails());
  const projectBackendDirPath = context.amplify.pathManager.getBackendDirPath();

  let parameters = {};
  let interpretType;
  if (resourceObj) {
    const resourceDirPath = path.join(projectBackendDirPath, category, resourceObj.name);
    const parametersFilePath = path.join(resourceDirPath, parametersFileName);
    try {
      parameters = amplify.readJsonFile(parametersFilePath);
    } catch (e) {
      parameters = {};
    }
    interpretType = resourceObj.interpretType;
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'resourceName' does not exist on type '{}... Remove this comment to see the full error message
    parameters.resourceName = resourceObj.name;
    Object.assign(defaultValues, parameters);
  }
  let answers = {};

  // only ask this for add
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'resourceName' does not exist on type '{}... Remove this comment to see the full error message
  if (!parameters.resourceName) {
    answers = await inquirer.prompt(interpretAssets.setup.type());

    // check if that type is already created
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'interpretType' does not exist on type '{... Remove this comment to see the full error message
    const resourceType = resourceAlreadyExists(context, answers.interpretType);
    if (resourceType) {
      const errMessage = `${resourceType} has already been added to this project.`;
      context.print.warning(errMessage);
      context.usageData.emitError(new ResourceAlreadyExistsError(errMessage));
      exitOnNextTick(0);
    }

    // @ts-expect-error ts-migrate(2339) FIXME: Property 'interpretType' does not exist on type '{... Remove this comment to see the full error message
    Object.assign(answers, await inquirer.prompt(interpretAssets.setup.name(`${answers.interpretType}${defaultValues.resourceName}`)));
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'interpretType' does not exist on type '{... Remove this comment to see the full error message
    interpretType = answers.interpretType;
  }

  // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
  Object.assign(answers, await followupQuestions(context, interpretAssets[interpretType], interpretType, parameters));
  answers = { ...answers, service };
  Object.assign(defaultValues, answers);

  // auth permissions
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'access' does not exist on type '{}'.
  if (answers.access === 'authAndGuest') {
    await enableGuestAuth(context, defaultValues.resourceName, true);
  }

  const { resourceName } = defaultValues;
  // @ts-expect-error ts-migrate(2790) FIXME: The operand of a 'delete' operator must be optiona... Remove this comment to see the full error message
  delete defaultValues.service;
  delete defaultValues.region;
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'interpretType' does not exist on type '{... Remove this comment to see the full error message
  defaultValues.interpretType = interpretType;
  const resourceDirPath = path.join(projectBackendDirPath, category, resourceName);
  const amplifyMetaValues = {
    resourceName,
    service,
    interpretType,
  };
  // write to file
  fs.ensureDirSync(resourceDirPath);
  const parametersFilePath = path.join(resourceDirPath, parametersFileName);
  const jsonString = JSON.stringify(defaultValues, null, 4);
  fs.writeFileSync(parametersFilePath, jsonString, 'utf8');
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'resourceName' does not exist on type '{}... Remove this comment to see the full error message
  if (!parameters.resourceName) {
    await copyCfnTemplate(context, category, resourceName, defaultValues);
  }
  addRegionMapping(context, resourceName, interpretType);
  return amplifyMetaValues;
}

function addRegionMapping(context: any, resourceName: any, interpretType: any) {
  const regionMapping = regionMapper.getRegionMapping(context, service, interpretType);
  const projectBackendDirPath = context.amplify.pathManager.getBackendDirPath();
  const identifyCFNFilePath = path.join(projectBackendDirPath, category, resourceName, `${resourceName}-template.json`);
  const identifyCFNFile = context.amplify.readJsonFile(identifyCFNFilePath);
  identifyCFNFile.Mappings = regionMapping;
  const identifyCFNJSON = JSON.stringify(identifyCFNFile, null, 4);
  fs.writeFileSync(identifyCFNFilePath, identifyCFNJSON, 'utf8');
}

async function followupQuestions(context: any, questionObj: any, interpretType: any, parameters: any) {
  const answers = await inquirer.prompt(questionObj.questions(parameters));
  Object.assign(answers, await inquirer.prompt(questionObj.auth(parameters)));
  return answers;
}

async function copyCfnTemplate(context: any, categoryName: any, resourceName: any, options: any) {
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

function checkIfAuthExists(context: any) {
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

function resourceAlreadyExists(context: any, interpretType: any) {
  const { amplify } = context;
  const { amplifyMeta } = amplify.getProjectDetails();
  let type;

  if (amplifyMeta[category] && context.commandName !== 'update') {
    const categoryResources = amplifyMeta[category];
    Object.keys(categoryResources).forEach(resource => {
      if (categoryResources[resource].interpretType === interpretType) {
        type = interpretType;
      }
    });
  }
  return type;
}

module.exports = { addWalkthrough, updateWalkthrough };
