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
    return undefined;
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

async function configure(context, resourceObj) {
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
    parameters.resourceName = resourceObj.name;
    Object.assign(defaultValues, parameters);
  }
  let answers = {};

  // only ask this for add
  if (!parameters.resourceName) {
    answers = await inquirer.prompt(convertAssets.setup.type());
    // check if that type is already created
    const resourceType = resourceAlreadyExists(context, answers.convertType);
    if (resourceType) {
      const errMessage = `${resourceType} has already been added to this project.`;
      context.print.warning(errMessage);
      context.usageData.emitError(new ResourceAlreadyExistsError(errMessage));
      exitOnNextTick(0);
    }

    Object.assign(answers, await inquirer.prompt(convertAssets.setup.name(`${answers.convertType}${defaultValues.resourceName}`)));
    defaultValues.convertPolicyName = `${answers.convertType}${defaultValues.convertPolicyName}`;
    convertType = answers.convertType;
  }

  Object.assign(answers, await followupQuestions(context, convertType, parameters));
  Object.assign(defaultValues, answers);

  // auth permissions
  if (answers.access === 'authAndGuest') {
    await enableGuestAuth(context, defaultValues.resourceName, true);
  }

  const { resourceName } = defaultValues;
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
  if (!parameters.resourceName) {
    await copyCfnTemplate(context, category, resourceName, defaultValues);
  }
  addRegionMapping(context, resourceName, convertType);
  return amplifyMetaValues;
}

function addRegionMapping(context, resourceName, convertType) {
  const regionMapping = regionMapper.getRegionMapping(context, service, convertType);
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

async function followupQuestions(context, convertType, parameters) {
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

function filterLang(srcLang) {
  let targetOptions = [...convertAssets.translateOptions];
  const denyCombos = Object.assign({}, convertAssets.deniedCombos);
  targetOptions = targetOptions.filter(lang => {
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

async function getVoiceOptions(context) {
  const polly = await context.amplify.executeProviderUtils(context, 'awscloudformation', 'getPollyVoices');
  const speechLanguages = [];
  const voiceID = {};
  polly.Voices.forEach(voice => {
    speechLanguages[voice.LanguageCode] = { name: `${voice.LanguageName}`, value: `${voice.LanguageCode}` };
    (voiceID[voice.LanguageCode] = voiceID[voice.LanguageCode] || []).push({
      name: `${voice.Name} - ${voice.Gender}`,
      value: `${voice.Id}`,
    });
  });
  return { languages: Object.values(speechLanguages), voices: voiceID };
}

function resourceAlreadyExists(context, convertType) {
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

module.exports = { addWalkthrough, updateWalkthrough };
