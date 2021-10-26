import identifyAssets from '../assets/identifyQuestions';
import getAllDefaults from '../default-values/identify-defaults';
import regionMapper from '../assets/regionMapping';
import {
  generateStorageCFNForLambda,
  generateStorageCFNForAdditionalLambda,
  generateLambdaAccessForRekognition,
  generateStorageAccessForRekognition,
  removeTextractPolicies,
  addTextractPolicies,
// @ts-expect-error ts-migrate(2306) FIXME: File '/Users/sachinrp/amplify-workspace/extOverrid... Remove this comment to see the full error message
} from '../assets/identifyCFNGenerate';
import { enableGuestAuth } from './enable-guest-auth';
import * as s3API from '@aws-amplify/amplify-category-storage'
const { ResourceDoesNotExistError, ResourceAlreadyExistsError, exitOnNextTick } = require('amplify-cli-core');
const inquirer = require('inquirer');
const path = require('path');
const fs = require('fs-extra');
const os = require('os');
const uuid = require('uuid');



// keep in sync with ServiceName in amplify-category-function, but probably it will not change
const FunctionServiceNameLambdaFunction = 'Lambda';

// Predictions Info
const templateFilename = 'identify-template.json.ejs';
const identifyTypes = ['identifyText', 'identifyEntities', 'identifyLabels'];
let service = 'Rekognition';
const category = 'predictions';
const storageCategory = 'storage';
const functionCategory = 'function';
const parametersFileName = 'parameters.json';
const amplifyMetaFilename = 'amplify-meta.json';
const s3defaultValuesFilename = 's3-defaults.js';
const s3TemplateFileName = 's3-cloudformation-template.json.ejs';
const s3CloudFormationTemplateFile = 's3-cloudformation-template.json';
const s3ServiceName = 'S3';
const prefixForAdminTrigger = 'protected/predictions/index-faces/';
// TODO support appsync

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
  return await configure(context, undefined);
}

async function updateWalkthrough(context: any) {
  const { amplify } = context;
  const { amplifyMeta } = amplify.getProjectDetails();

  const predictionsResources: any = [];

  Object.keys(amplifyMeta[category]).forEach(resourceName => {
    if (identifyTypes.includes(amplifyMeta[category][resourceName].identifyType)) {
      predictionsResources.push({
        name: resourceName,
        value: { name: resourceName, identifyType: amplifyMeta[category][resourceName].identifyType },
      });
    }
  });
  if (predictionsResources.length === 0) {
    const errMessage = 'No resources to update. You need to add a resource.';
    context.print.error(errMessage);
    context.usageData.emitError(new ResourceDoesNotExistError(errMessage));
    exitOnNextTick(0);
  }
  let resourceObj = predictionsResources[0].value;
  if (predictionsResources.length > 1) {
    const resourceAnswer = await inquirer.prompt({
      type: 'list',
      name: 'resource',
      message: 'Which identify resource would you like to update?',
      choices: predictionsResources,
    });
    resourceObj = resourceAnswer.resource;
  }

  return await configure(context, resourceObj);
}

async function configure(context: any, resourceObj: any) {
  const { amplify } = context;
  const defaultValues = getAllDefaults(amplify.getProjectDetails());
  const projectBackendDirPath = context.amplify.pathManager.getBackendDirPath();
  let identifyType;

  let parameters : any = {};
  if (resourceObj) {
    const resourceDirPath = path.join(projectBackendDirPath, category, resourceObj.name);
    const parametersFilePath = path.join(resourceDirPath, parametersFileName);
    try {
      parameters = amplify.readJsonFile(parametersFilePath);
    } catch (e) {
      parameters = {};
    }
    identifyType = resourceObj.identifyType;
    (parameters as any).resourceName = resourceObj.name;
    Object.assign(defaultValues, parameters);
  }
  let answers : any = {};

  // only ask this for add
  if (!(parameters as any).resourceName) {
    answers = await inquirer.prompt(identifyAssets.setup.type());

    // check if that type is already created
    const resourceType = resourceAlreadyExists(context, (answers as any) .identifyType);
    if (resourceType) {
      const errMessage = `${resourceType} has already been added to this project.`;
      context.print.warning(errMessage);
      context.usageData.emitError(new ResourceAlreadyExistsError(errMessage));
      exitOnNextTick(0);
    }

    Object.assign(answers, await inquirer.prompt(identifyAssets.setup.name(`${(answers as any).identifyType}${defaultValues.resourceName}`)));
    identifyType = (answers as any).identifyType;
  }

  // category specific questions
  // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
  Object.assign(answers, await followUpQuestions(identifyAssets[identifyType], identifyType, parameters));
  delete (answers as any).setup;
  Object.assign(defaultValues, answers);

  // auth permissions
  if ((answers as any).access === 'authAndGuest') {
    await enableGuestAuth(context, defaultValues.resourceName, true);
  }

  let s3Resource: any = {};
  let functionName;
  if ((answers as any) .adminTask) {
    const s3ResourceName = s3ResourceAlreadyExists(context);
    console.log("SACPCDEBUG: [PREDICTIONS] s3ResourceName : ", s3ResourceName );

    // Check is storage already exists in the project
    if (s3ResourceName) {
      const resourceDirPath = path.join(projectBackendDirPath, storageCategory, s3ResourceName);
      const parametersFilePath = path.join(resourceDirPath, parametersFileName);
      const bucketParameters = amplify.readJsonFile(parametersFilePath);


      s3Resource.bucketName = bucketParameters.bucketName;
      s3Resource.resourceName = s3ResourceName;
      // Check if any lambda triggers are already existing in the project.
      if (!bucketParameters.adminTriggerFunction) {
        if (!bucketParameters.triggerFunction || bucketParameters.triggerFunction === 'NONE') {
          functionName = await addTrigger(context, s3Resource, undefined, (parameters as any).resourceName);
          bucketParameters.adminTriggerFunction = functionName;
        } else {
          // adding additinal lambda trigger
          functionName = await addAdditionalLambdaTrigger(context, s3Resource, (parameters as any).resourceName);
          bucketParameters.adminTriggerFunction = functionName;
        }
      } else {
        functionName = bucketParameters.adminTriggerFunction;
      }

      s3Resource.functionName = functionName;
      // Check if parameters object is not empty
      if (Object.entries(bucketParameters).length !== 0 && bucketParameters.constructor === Object) {
        const jsonString = JSON.stringify(bucketParameters, null, 4);
        fs.writeFileSync(parametersFilePath, jsonString, 'utf8');
      }
    } else {
      s3Resource = await addS3ForIdentity(context, answers.access, undefined, parameters.resourceName);
      functionName = s3Resource.functionName;
    }

    const functionresourceDirPath = path.join(projectBackendDirPath, functionCategory, functionName);
    const functionparametersFilePath = path.join(functionresourceDirPath, parametersFileName);
    let functionParameters;
    try {
      functionParameters = amplify.readJsonFile(functionparametersFilePath);
    } catch (e) {
      functionParameters = {};
    }
    functionParameters.resourceName = answers.resourceName || parameters.resourceName;
    const functionjsonString = JSON.stringify(functionParameters, null, 4);
    fs.writeFileSync(functionparametersFilePath, functionjsonString, 'utf8');
  } else if (parameters.resourceName) {
    const s3ResourceName = s3ResourceAlreadyExists(context);
    if (s3ResourceName) {
      removeAdminLambdaTrigger(context, parameters.resourceName, s3ResourceName);
    }
  }

  const { resourceName } = defaultValues;
  // @ts-expect-error ts-migrate(2790) FIXME: The operand of a 'delete' operator must be optiona... Remove this comment to see the full error message
  delete defaultValues.service;
  delete defaultValues.region;
  const resourceDirPath = path.join(projectBackendDirPath, category, resourceName);
  // write to file
  fs.ensureDirSync(resourceDirPath);
  const parametersFilePath = path.join(resourceDirPath, parametersFileName);
  const jsonString = JSON.stringify(defaultValues, null, 4);
  fs.writeFileSync(parametersFilePath, jsonString, 'utf8');

  const options : any = {};
  options.dependsOn = [];
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'adminTask' does not exist on type '{ res... Remove this comment to see the full error message
  defaultValues.adminTask = answers.adminTask;
  if (answers.adminTask) {
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'storageResourceName' does not exist on t... Remove this comment to see the full error message
    defaultValues.storageResourceName = s3Resource.resourceName;
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'functionName' does not exist on type '{ ... Remove this comment to see the full error message
    defaultValues.functionName = s3Resource.functionName;
    options.dependsOn.push({
      category: functionCategory,
      resourceName: functionName,
      attributes: ['Name', 'Arn', 'LambdaExecutionRole'],
    });
    options.dependsOn.push({
      category: storageCategory,
      resourceName: s3Resource.resourceName,
      attributes: ['BucketName'],
    });

    if (answers.folderPolicies === 'app' && parameters.resourceName) {
      addStorageIAMResourcestoIdentifyCFNFile(context, parameters.resourceName, s3Resource.resourceName);
    }
  }
  Object.assign(defaultValues, options);

  // @ts-expect-error ts-migrate(2339) FIXME: Property 'dependsOn' does not exist on type '{ res... Remove this comment to see the full error message
  const { dependsOn } = defaultValues;
  const amplifyMetaValues = {
    resourceName,
    service,
    dependsOn,
    identifyType,
  };
  if (parameters.resourceName) {
    // update CFN template
    updateCFN(context, resourceName, identifyType);
  }
  if (!parameters.resourceName) {
    await copyCfnTemplate(context, category, resourceName, defaultValues);
  }
  addRegionMapping(context, resourceName, identifyType);
  return amplifyMetaValues;
}

function addRegionMapping(context: any, resourceName: any, identifyType: any) {
  const regionMapping = regionMapper.getRegionMapping(context, service, identifyType);
  const projectBackendDirPath = context.amplify.pathManager.getBackendDirPath();
  const identifyCFNFilePath = path.join(projectBackendDirPath, category, resourceName, `${resourceName}-template.json`);
  const identifyCFNFile = context.amplify.readJsonFile(identifyCFNFilePath);
  identifyCFNFile.Mappings = regionMapping;
  const identifyCFNJSON = JSON.stringify(identifyCFNFile, null, 4);
  fs.writeFileSync(identifyCFNFilePath, identifyCFNJSON, 'utf8');
}

function updateCFN(context: any, resourceName: any, identifyType: any) {
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

async function followUpQuestions(typeObj: any, identifyType: any, parameters: any) {
  const answers = await inquirer.prompt(typeObj.questions(parameters));
  Object.assign(answers, await inquirer.prompt(typeObj.auth(parameters)));
  if (answers.setup && answers.setup === 'default') {
    Object.assign(answers, typeObj.defaults);
  }
  if (identifyType === 'identifyText') {
    if (answers.identifyDoc) {
      service = 'RekognitionAndTextract';
    }
    Object.assign(answers, typeObj.formatFlag(answers.identifyDoc));
  }
  // default values for admin tasks are set
  if (identifyType === 'identifyEntities') {
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
  }

  return answers;
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

function resourceAlreadyExists(context: any, identifyType: any) {
  const { amplify } = context;
  const { amplifyMeta } = amplify.getProjectDetails();
  let type;

  if (amplifyMeta[category] && context.commandName !== 'update') {
    const categoryResources = amplifyMeta[category];
    Object.keys(categoryResources).forEach(resource => {
      if (categoryResources[resource].identifyType === identifyType) {
        type = identifyType;
      }
    });
  }
  return type;
}

async function addS3ForIdentity(context: any, storageAccess: any, bucketName: any, predictionsResourceName: any) {
  const defaultValuesSrc = `${__dirname}/../default-values/${s3defaultValuesFilename}`;
  const { getAllS3Defaults, getAllAuthDefaults, getAllAuthAndGuestDefaults } = require(defaultValuesSrc);
  const projectBackendDirPath = context.amplify.pathManager.getBackendDirPath();

  const defaultValues = getAllS3Defaults(context.amplify.getProjectDetails());

  const options = {
    providerPlugin: 'awscloudformation',
    service: s3ServiceName,
  };

  let answers : any = {};

  answers = { ...answers, storageAccess, resourceName: defaultValues.resourceName };

  if (!bucketName) {
    const question = {
      name: identifyAssets.s3bucket.key,
      message: identifyAssets.s3bucket.question,
      validate: (value: any) => {
        const regex = new RegExp('^[a-zA-Z0-9-]+$');
        return regex.test(value) ? true : 'Bucket name can only use the following characters: a-z 0-9 -';
      },
      default: () => {
        const defaultValue = defaultValues.bucketName;
        return defaultValue;
      },
    };
    const answers1 = await inquirer.prompt(question);
    answers = { ...answers, bucketName: answers1.bucketName };
  } else {
    answers = { ...answers, bucketName };
  }

  let allowUnauthenticatedIdentities; // default to undefined since if S3 does not require unauth access the IdentityPool can still have that enabled
  if (answers.storageAccess === 'authAndGuest') {
    Object.assign(answers, getAllAuthAndGuestDefaults());
    allowUnauthenticatedIdentities = true;
  } else {
    Object.assign(answers, getAllAuthDefaults());
  }
  const s3Resource = {
    resourceName: answers.resourceName,
  };
  answers.adminTriggerFunction = await addTrigger(context, s3Resource, options, predictionsResourceName);
  answers.triggerFunction = 'NONE';

  // getting requirement satisfaction map
  const storageRequirements = { authSelections: 'identityPoolAndUserPool', allowUnauthenticatedIdentities };

  const checkResult = await context.amplify.invokePluginMethod(context, 'auth', undefined, 'checkRequirements', [
    storageRequirements,
    context,
    storageCategory,
    answers.resourceName,
  ]);

  // If auth is imported and configured, we have to throw the error instead of printing since there is no way to adjust the auth
  // configuration.
  if (checkResult.authImported === true && checkResult.errors && checkResult.errors.length > 0) {
    throw new Error(checkResult.errors.join(os.EOL));
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
        answers.resourceName,
        storageRequirements,
      ]);
    } catch (error) {
      context.print.error(error);
      throw error;
    }
  }

  // At this point we have a valid auth configuration either imported or added/updated.

  Object.assign(defaultValues, answers);
  const resource = defaultValues.resourceName;
  const resourceDirPath = path.join(projectBackendDirPath, storageCategory, resource);
  delete defaultValues.resourceName;
  delete defaultValues.storageAccess;
  fs.ensureDirSync(resourceDirPath);
  const parametersFilePath = path.join(resourceDirPath, parametersFileName);
  const jsonString = JSON.stringify(defaultValues, null, 4);
  fs.writeFileSync(parametersFilePath, jsonString, 'utf8');

  if (!bucketName) {
    if (options) {
      Object.assign(defaultValues, options);
    }
    // Generate CFN file on add
    await s3CopyCfnTemplate(context, storageCategory, resource, defaultValues);

    context.amplify.updateamplifyMetaAfterResourceAdd(storageCategory, resource, options);
    const { print } = context;
    print.success('Successfully added storage resource locally');
  }

  return {
    bucketName: answers.bucketName,
    resourceName: resource,
    functionName: answers.adminTriggerFunction,
  };
}

async function s3CopyCfnTemplate(context: any, categoryName: any, resourceName: any, options: any) {
  const { amplify } = context;
  const targetDir = amplify.pathManager.getBackendDirPath();
  const pluginDir = __dirname;

  const copyJobs = [
    {
      dir: pluginDir,
      template: `../cloudformation-templates/${s3TemplateFileName}`,
      target: `${targetDir}/${categoryName}/${resourceName}/s3-cloudformation-template.json`,
    },
  ];

  // copy over the files
  return await context.amplify.copyBatch(context, copyJobs, options);
}

async function addTrigger(context: any, s3Resource: any, options: any, predictionsResourceName: any) {
  const functionName = await createNewFunction(context, predictionsResourceName, s3Resource.resourceName);

  if (s3Resource.bucketName) {
    // Update Cloudformtion file
    const projectBackendDirPath = context.amplify.pathManager.getBackendDirPath();
    const storageCFNFilePath = path.join(projectBackendDirPath, storageCategory, s3Resource.resourceName, s3CloudFormationTemplateFile);
    let storageCFNFile = context.amplify.readJsonFile(storageCFNFilePath);

    storageCFNFile = generateStorageCFNForLambda(storageCFNFile, functionName, prefixForAdminTrigger);

    const storageCFNString = JSON.stringify(storageCFNFile, null, 4);
    fs.writeFileSync(storageCFNFilePath, storageCFNString, 'utf8');

    // Update DependsOn
    context.amplify.updateamplifyMetaAfterResourceUpdate(storageCategory, s3Resource.resourceName, 'dependsOn', [
      {
        category: functionCategory,
        resourceName: functionName,
        attributes: ['Name', 'Arn', 'LambdaExecutionRole'],
      },
    ]);
  } else {
    options.dependsOn = [];
    options.dependsOn.push({
      category: functionCategory,
      resourceName: functionName,
      attributes: ['Name', 'Arn', 'LambdaExecutionRole'],
    });
  }

  return functionName;
}

async function addAdditionalLambdaTrigger(context: any, s3Resource: any, predictionsResourceName: any) {
  const functionName = await createNewFunction(context, predictionsResourceName, s3Resource.resourceName);

  const projectBackendDirPath = context.amplify.pathManager.getBackendDirPath();
  const storageCFNFilePath = path.join(projectBackendDirPath, storageCategory, s3Resource.resourceName, s3CloudFormationTemplateFile);
  let storageCFNFile = context.amplify.readJsonFile(storageCFNFilePath);
  const amplifyMetaFilePath = path.join(projectBackendDirPath, amplifyMetaFilename);
  const amplifyMetaFile = context.amplify.readJsonFile(amplifyMetaFilePath);
  storageCFNFile = generateStorageCFNForAdditionalLambda(storageCFNFile, functionName, prefixForAdminTrigger);
  const storageCFNString = JSON.stringify(storageCFNFile, null, 4);
  fs.writeFileSync(storageCFNFilePath, storageCFNString, 'utf8');

  const dependsOnResources = amplifyMetaFile.storage[s3Resource.resourceName].dependsOn;
  dependsOnResources.push({
    category: functionCategory,
    resourceName: functionName,
    attributes: ['Name', 'Arn', 'LambdaExecutionRole'],
  });

  // Update DependsOn
  context.amplify.updateamplifyMetaAfterResourceUpdate(storageCategory, s3Resource.resourceName, 'dependsOn', dependsOnResources);

  return functionName;
}

function s3ResourceAlreadyExists(context: any) {
  const { amplify } = context;
  const { amplifyMeta } = amplify.getProjectDetails();
  let resourceName;
  if (amplifyMeta[storageCategory]) {
    const categoryResources = amplifyMeta[storageCategory];
    Object.keys(categoryResources).forEach(resource => {
      if (categoryResources[resource].service === s3ServiceName) {
        resourceName = resource;
      }
    });
  }
  return resourceName;
}

async function createNewFunction(context: any, predictionsResourceName: any, s3ResourceName: any) {
  const targetDir = context.amplify.pathManager.getBackendDirPath();
  const [shortId] = uuid().split('-');
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
    const projectBackendDirPath = context.amplify.pathManager.getBackendDirPath();
    const identifyCFNFilePath = path.join(
      projectBackendDirPath,
      category,
      predictionsResourceName,
      `${predictionsResourceName}-template.json`,
    );
    let identifyCFNFile = context.amplify.readJsonFile(identifyCFNFilePath);
    identifyCFNFile = generateLambdaAccessForRekognition(identifyCFNFile, functionName, s3ResourceName);
    const identifyCFNString = JSON.stringify(identifyCFNFile, null, 4);
    fs.writeFileSync(identifyCFNFilePath, identifyCFNString, 'utf8');

    const amplifyMetaFilePath = path.join(projectBackendDirPath, amplifyMetaFilename);
    const amplifyMetaFile = context.amplify.readJsonFile(amplifyMetaFilePath);
    const dependsOnResources = amplifyMetaFile.predictions[predictionsResourceName].dependsOn;
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
  // Update amplify-meta and backend-config

  const backendConfigs = {
    service: FunctionServiceNameLambdaFunction,
    providerPlugin: 'awscloudformation',
    build: true,
  };

  await context.amplify.updateamplifyMetaAfterResourceAdd(functionCategory, functionName, backendConfigs);

  context.print.success(`Successfully added resource ${functionName} locally`);
  return functionName;
}

function addStorageIAMResourcestoIdentifyCFNFile(context: any, predictionsResourceName: any, s3ResourceName: any) {
  const projectBackendDirPath = context.amplify.pathManager.getBackendDirPath();
  const identifyCFNFilePath = path.join(
    projectBackendDirPath,
    category,
    predictionsResourceName,
    `${predictionsResourceName}-template.json`,
  );
  let identifyCFNFile = context.amplify.readJsonFile(identifyCFNFilePath);
  identifyCFNFile = generateStorageAccessForRekognition(identifyCFNFile, s3ResourceName, prefixForAdminTrigger);
  const identifyCFNString = JSON.stringify(identifyCFNFile, null, 4);
  fs.writeFileSync(identifyCFNFilePath, identifyCFNString, 'utf8');
}

function removeAdminLambdaTrigger(context: any, resourceName: any, s3ResourceName: any) {
  // Update Cloudformtion file
  const projectBackendDirPath = context.amplify.pathManager.getBackendDirPath();
  const resourceDirPath = path.join(projectBackendDirPath, storageCategory, s3ResourceName);
  const parametersFilePath = path.join(resourceDirPath, parametersFileName);
  const bucketParameters = context.amplify.readJsonFile(parametersFilePath);
  const adminTriggerFunction = bucketParameters.adminTriggerFunction;
  if (adminTriggerFunction) {
    delete bucketParameters.adminTriggerFunction;

    const identifyCFNFilePath = path.join(projectBackendDirPath, category, resourceName, `${resourceName}-template.json`);
    const identifyCFNFile = context.amplify.readJsonFile(identifyCFNFilePath);

    // Remove reference for old triggerFunction
    delete identifyCFNFile.Parameters[`function${adminTriggerFunction}Arn`];
    delete identifyCFNFile.Parameters[`function${adminTriggerFunction}Name`];
    delete identifyCFNFile.Parameters[`function${adminTriggerFunction}LambdaExecutionRole`];
    delete identifyCFNFile.Parameters[`storage${s3ResourceName}BucketName`];
    delete identifyCFNFile.Resources.LambdaRekognitionAccessPolicy;
    delete identifyCFNFile.Outputs.collectionId;
    delete identifyCFNFile.Resources.CollectionCreationFunction;
    delete identifyCFNFile.Resources.CollectionFunctionOutputs;
    delete identifyCFNFile.Resources.CollectionsLambdaExecutionRole;
    delete identifyCFNFile.Resources.S3AuthPredicitionsAdminProtectedPolicy;
    delete identifyCFNFile.Resources.S3GuestPredicitionsAdminPublicPolicy;
    delete identifyCFNFile.Resources.IdentifyEntitiesSearchFacesPolicy;

    // Update Cloudformtion file
    const storageCFNFilePath = path.join(projectBackendDirPath, storageCategory, s3ResourceName, s3CloudFormationTemplateFile);
    let storageCFNFile = context.amplify.readJsonFile(storageCFNFilePath);
    storageCFNFile = removeS3AdminLambdaTrigger(storageCFNFile, adminTriggerFunction);

    const amplifyMetaFilePath = path.join(projectBackendDirPath, amplifyMetaFilename);
    const amplifyMetaFile = context.amplify.readJsonFile(amplifyMetaFilePath);
    const s3DependsOnResources = amplifyMetaFile.storage[s3ResourceName].dependsOn;
    const s3Resources: any = [];
    s3DependsOnResources.forEach((resource: any) => {
      if (resource.resourceName !== adminTriggerFunction) {
        s3Resources.push(resource);
      }
    });

    const jsonString = JSON.stringify(bucketParameters, null, 4);
    fs.writeFileSync(parametersFilePath, jsonString, 'utf8');

    const storageCFNString = JSON.stringify(storageCFNFile, null, 4);
    fs.writeFileSync(storageCFNFilePath, storageCFNString, 'utf8');

    const identifyCFNString = JSON.stringify(identifyCFNFile, null, 4);
    fs.writeFileSync(identifyCFNFilePath, identifyCFNString, 'utf8');

    context.amplify.updateamplifyMetaAfterResourceUpdate(category, resourceName, 'dependsOn', []);

    context.amplify.updateamplifyMetaAfterResourceUpdate(storageCategory, s3ResourceName, 'dependsOn', s3Resources);
  }
}

function removeS3AdminLambdaTrigger(storageCFNFile: any, adminTriggerFunction: any) {
  let modifyOnlyFilters = false;
  const lambdaConfigurations: any = [];
  storageCFNFile.Resources.S3Bucket.Properties.NotificationConfiguration.LambdaConfigurations.forEach((triggers: any) => {
    if (
      !(
        triggers.Filter &&
        typeof triggers.Filter.S3Key.Rules[0].Value === 'string' &&
        triggers.Filter.S3Key.Rules[0].Value.includes('index-faces')
      )
    ) {
      modifyOnlyFilters = true;
      lambdaConfigurations.push(triggers);
    }
  });

  storageCFNFile.Resources.S3Bucket.Properties.NotificationConfiguration.LambdaConfigurations = lambdaConfigurations;
  delete storageCFNFile.Resources.AdminTriggerPermissions;
  delete storageCFNFile.Parameters.adminTriggerFunction;
  delete storageCFNFile.Parameters[`function${adminTriggerFunction}Arn`];
  delete storageCFNFile.Parameters[`function${adminTriggerFunction}Name`];
  delete storageCFNFile.Parameters[`function${adminTriggerFunction}LambdaExecutionRole`];
  const index = storageCFNFile.Resources.S3Bucket.DependsOn.indexOf('AdminTriggerPermissions');
  if (index > -1) {
    storageCFNFile.Resources.S3Bucket.DependsOn.splice(index, 1);
  }
  const roles: any = [];
  storageCFNFile.Resources.S3TriggerBucketPolicy.Properties.Roles.forEach((role: any) => {
    if (!role.Ref.includes(adminTriggerFunction)) {
      roles.push(role);
    }
  });
  storageCFNFile.Resources.S3TriggerBucketPolicy.Properties.Roles = roles;

  if (!modifyOnlyFilters) {
    // Remove reference for triggerFunction
    delete storageCFNFile.Resources.S3Bucket.Properties.NotificationConfiguration;
    delete storageCFNFile.Resources.S3TriggerBucketPolicy;
    delete storageCFNFile.Resources.S3Bucket.DependsOn;
  }

  return storageCFNFile;
}

module.exports = { addWalkthrough, updateWalkthrough, removeS3AdminLambdaTrigger };
