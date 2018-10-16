const inquirer = require('inquirer'); 

const constants = require('./constants');
const authHelper = require('./auth-helper');

async function ensureSetup(context){
  const { amplifyMeta } = context.exeInfo; 
  if(!isXRSetup(amplifyMeta)){
    authHelper.ensureAuth(context);
    await setupAccess(context); 
  }
}

async function setupAccess(context){
  let templateFilePath = path.join(__dirname, constants.TemplateFileName);
  context.exeInfo.template = require(templateFilePath);

  const answer = await inquirer.prompt({
    name: 'allowUnAuthAccess',
    type: 'confirm',
    message: 'Allow unauthenticated users to access xr scenes',
    default: false,
  });

  if(!answer.allowUnAuthAccess){
    delete context.exeInfo.template.Resources.CognitoUnauthPolicy;
  }

  let parametersFilePath = path.join(__dirname, constants.ParametersFileName);
  context.exeInfo.parameters = require(parametersFilePath);

  const { projectConfig, amplifyMeta } = context.exeInfo; 
  const providerInfo = amplifyMeta.providers[constants.ProviderPlugin];
  const decoratedProjectName = projectConfig.projectName + context.amplify.makeId(5);
  context.exeInfo.parameters.AuthRoleName = providerInfo.AuthRoleName;
  context.exeInfo.parameters.UnauthRoleName = providerInfo.UnauthRoleName;
  context.exeInfo.parameters.AuthPolicyName = 'sumerian-auth-' + decoratedProjectName;
  context.exeInfo.parameters.UnauthPolicyName = 'sumerian-unauth-' + decoratedProjectName;

  const projectBackendDirPath = context.amplify.pathManager.getBackendDirPath();
  const serviceDirPath = path.join(projectBackendDirPath, constants.CategoryName, constants.ServiceName);
  fs.ensureDirSync(serviceDirPath);

  templateFilePath = path.join(serviceDirPath, constants.TemplateFileName);
  const jsonString = JSON.stringify(context.exeInfo.template, null, 4);
  fs.writeFileSync(templateFilePath, jsonString, 'utf8');

  parametersFilePath = path.join(serviceDirPath, constants.ParametersFileName);
  const jsonString = JSON.stringify(context.exeInfo.parameters, null, 4);
  fs.writeFileSync(parametersFilePath, jsonString, 'utf8');

  const metaData = {
    service: constants.ServiceName,
    providerPlugin: constants.ProviderPlugin
  };
  return context.amplify.updateamplifyMetaAfterResourceAdd(
    constants.CategoryName,
    constants.ServiceName,
    metaData,
  );
}

async function configureAccess(context){
  const templateFilePath = path.join(serviceDirPath, constants.TemplateFileName);
  const template = require(templateFilePath);

  let isUnAuthAccessAllowed = false; 
  if(template.Resources.CognitoUnauthPolicy){
    isUnAuthAccessAllowed = true; 
  }

  const answer = await inquirer.prompt({
    name: 'allowUnAuthAccess',
    type: 'confirm',
    message: 'Allow unauthenticated users to access xr scenes',
    default: isUnAuthAccessAllowed,
  });

  if(!answer.allowUnAuthAccess){
    delete template.Resources.CognitoUnauthPolicy;
  }

  const jsonString = JSON.stringify(template, null, 4);
  fs.writeFileSync(templateFilePath, jsonString, 'utf8');
}

async function configure(context){
  if(isXRSetup(context)){
    configureAccess(context);
  }else{
    context.print.error('You have NOT added the XR category yet.')
  }
}

function isXRSetup(context){
  const { amplifyMeta } = context.exeInfo; 
  return amplifyMeta[constants.CategoryName] &&
    amplifyMeta[constants.CategoryName][constants.ServiceName];
}

function getExistingScenes(context){
}

function addScene(context){
}

function removeScene(context){
}

module.exports = {
  isXRSetup,
  ensureSetup,
  configure,
  getExistingScenes,
  addScene,
  removeScene,
};
