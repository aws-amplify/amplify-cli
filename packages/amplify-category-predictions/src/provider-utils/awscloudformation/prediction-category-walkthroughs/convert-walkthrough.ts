import convertAssets from '../assets/convertQuestions';
import getAllDefaults from '../default-values/convert-defaults';
import regionMapper from '../assets/regionMapping';
import { enableGuestAuth } from './enable-guest-auth';

const inquirer = require('inquirer');
const path = require('path');
const fs = require('fs-extra');
const { ResourceAlreadyExistsError, ResourceDoesNotExistError, exitOnNextTick } = require('amplify-cli-core');
// Predictions Info
const category = 'predictions';
const parametersFileName = 'parameters.json';
const templateFilename = 'convert-template.json.ejs';
const convertTypes = ['translateText', 'speechGenerator', 'transcription'];
let service = '';
// Needs Cognito Authentication
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
    if (convertTypes.includes(amplifyMeta[category][resourceName].convertType)) {
      predictionsResources.push({
        name: resourceName,
        value: { name: resourceName, convertType: amplifyMeta[category][resourceName].convertType },
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
  if (predictionsResources.length > 1) {
    const resourceAnswer = await inquirer.prompt({
      type: 'list',
      name: 'resource',
      message: 'Which convert resource would you like to update',
      choices: predictionsResources,
    });
    resourceObj = resourceAnswer.resource;
  }

  return configure(context, resourceObj);
}

async function configure(context: any, resourceObj: any) {
  const { amplify } = context;
  const defaultValues = getAllDefaults(amplify.getProjectDetails());
  let convertType = '';

  const projectBackendDirPath = context.amplify.pathManager.getBackendDirPath();

  let parameters = {};
  if (resourceObj) {
    const resourceDirPath = path.join(projectBackendDirPath, category, resourceObj.name);
    const parametersFilePath = path.join(resourceDirPath, parametersFileName);
    try {
      parameters = amplify.readJsonFile(parametersFilePath);
    } catch (e) {
      parameters = {};
    }
    convertType = resourceObj.convertType;
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'resourceName' does not exist on type '{}... Remove this comment to see the full error message
    parameters.resourceName = resourceObj.name;
    Object.assign(defaultValues, parameters);
  }
  let answers = {};

  // only ask this for add
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'resourceName' does not exist on type '{}... Remove this comment to see the full error message
  if (!parameters.resourceName) {
    answers = await inquirer.prompt(convertAssets.setup.type());
    // check if that type is already created
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'convertType' does not exist on type '{}'... Remove this comment to see the full error message
    const resourceType = resourceAlreadyExists(context, answers.convertType);
    if (resourceType) {
      const errMessage = `${resourceType} has already been added to this project.`;
      context.print.warning(errMessage);
      context.usageData.emitError(new ResourceAlreadyExistsError(errMessage));
      exitOnNextTick(0);
    }

    // @ts-expect-error ts-migrate(2339) FIXME: Property 'convertType' does not exist on type '{}'... Remove this comment to see the full error message
    Object.assign(answers, await inquirer.prompt(convertAssets.setup.name(`${answers.convertType}${defaultValues.resourceName}`)));
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'convertType' does not exist on type '{}'... Remove this comment to see the full error message
    defaultValues.convertPolicyName = `${answers.convertType}${defaultValues.convertPolicyName}`;
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'convertType' does not exist on type '{}'... Remove this comment to see the full error message
    convertType = answers.convertType;
  }

  Object.assign(answers, await followupQuestions(context, convertType, parameters));
  Object.assign(defaultValues, answers);

  // auth permissions
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'access' does not exist on type '{}'.
  if (answers.access === 'authAndGuest') {
    await enableGuestAuth(context, defaultValues.resourceName, true);
  }

  const { resourceName } = defaultValues;
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'service' does not exist on type '{ resou... Remove this comment to see the full error message
  delete defaultValues.service;
  delete defaultValues.region;
  const resourceDirPath = path.join(projectBackendDirPath, category, resourceName);
  const amplifyMetaValues = {
    resourceName,
    service,
    convertType,
  };
  // write params and previous answers to file
  fs.ensureDirSync(resourceDirPath);
  const parametersFilePath = path.join(resourceDirPath, parametersFileName);
  const jsonString = JSON.stringify(defaultValues, null, 4);
  fs.writeFileSync(parametersFilePath, jsonString, 'utf8');
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'resourceName' does not exist on type '{}... Remove this comment to see the full error message
  if (!parameters.resourceName) {
    await copyCfnTemplate(context, category, resourceName, defaultValues);
  }
  addRegionMapping(context, resourceName, convertType);
  return amplifyMetaValues;
}

function addRegionMapping(context: any, resourceName: any, convertType: any) {
  const regionMapping = regionMapper.getRegionMapping(context, service, convertType);
  const projectBackendDirPath = context.amplify.pathManager.getBackendDirPath();
  const identifyCFNFilePath = path.join(projectBackendDirPath, category, resourceName, `${resourceName}-template.json`);
  const identifyCFNFile = context.amplify.readJsonFile(identifyCFNFilePath);
  identifyCFNFile.Mappings = regionMapping;
  const identifyCFNJSON = JSON.stringify(identifyCFNFile, null, 4);
  fs.writeFileSync(identifyCFNFilePath, identifyCFNJSON, 'utf8');
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

async function followupQuestions(context: any, convertType: any, parameters: any) {
  // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
  const typeQuestions = convertAssets.convertTypes[convertType];
  service = typeQuestions.service;
  if (convertType === 'speechGenerator') {
    Object.assign(parameters, await getVoiceOptions(context));
  }
  const answers = await inquirer.prompt(typeQuestions.questions(parameters));
  // ask questions based on convert type
  if (convertType === 'speechGenerator') {
    Object.assign(answers, await inquirer.prompt(typeQuestions.voiceQuestion(answers.language, parameters)));
  }
  if (convertType === 'translateText') {
    const targetOptions = filterLang(answers.sourceLang);
    Object.assign(answers, await inquirer.prompt(typeQuestions.targetQuestion(targetOptions, parameters)));
  }
  Object.assign(answers, await inquirer.prompt(typeQuestions.authAccess.prompt(parameters)));
  return answers;
}

function filterLang(srcLang: any) {
  let targetOptions = [...convertAssets.translateOptions];
  const denyCombos = Object.assign({}, convertAssets.deniedCombos);
  targetOptions = targetOptions.filter(lang => {
    // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
    if (denyCombos[srcLang] && denyCombos[srcLang].includes(lang.value)) {
      return false;
    }
    if (lang.value === srcLang) {
      return false;
    }
    return true;
  });
  return targetOptions;
}

async function getVoiceOptions(context: any) {
  const polly = await context.amplify.executeProviderUtils(context, 'awscloudformation', 'getPollyVoices');
  const speechLanguages: any = [];
  const voiceID = {};
  polly.Voices.forEach((voice: any) => {
    speechLanguages[voice.LanguageCode] = { name: `${voice.LanguageName}`, value: `${voice.LanguageCode}` };
    // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
    (voiceID[voice.LanguageCode] = voiceID[voice.LanguageCode] || []).push({
      name: `${voice.Name} - ${voice.Gender}`,
      value: `${voice.Id}`,
    });
  });
  return { languages: Object.values(speechLanguages), voices: voiceID };
}

function resourceAlreadyExists(context: any, convertType: any) {
  const { amplify } = context;
  const { amplifyMeta } = amplify.getProjectDetails();
  let type;

  if (amplifyMeta[category] && context.commandName !== 'update') {
    const categoryResources = amplifyMeta[category];
    Object.keys(categoryResources).forEach(resource => {
      if (categoryResources[resource].convertType === convertType) {
        type = convertType;
      }
    });
  }
  return type;
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

module.exports = { addWalkthrough, updateWalkthrough };
