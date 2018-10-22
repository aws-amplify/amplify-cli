const fs = require('fs-extra');
const sequential = require('promise-sequential');
const { getFrontendPlugins } = require('../../extensions/amplify-helpers/get-frontend-plugins');
const { getProviderPlugins } = require('../../extensions/amplify-helpers/get-provider-plugins');
const { print } = require('gluegun/print');

function run(context) {
  const { projectPath } = context.exeInfo.projectConfig;
  const { amplify } = context;

  const amplifyDirPath = amplify.pathManager.getAmplifyDirPath(projectPath);
  const dotConfigDirPath = amplify.pathManager.getDotConfigDirPath(projectPath);
  const backendDirPath = amplify.pathManager.getBackendDirPath(projectPath);
  const currentBackendDirPath = amplify.pathManager.getCurrentCloudBackendDirPath(projectPath);

  fs.ensureDirSync(amplifyDirPath);
  fs.ensureDirSync(dotConfigDirPath);
  fs.ensureDirSync(backendDirPath);
  fs.ensureDirSync(currentBackendDirPath);


  const providerPlugins = getProviderPlugins(context);
  console.log(context.exeInfo.projectConfig);
  console.log(providerPlugins)
  const providerOnSuccessTasks = [];
  context.exeInfo.projectConfig.providers.forEach((provider) => {
    const providerModule = require(providerPlugins[provider]);
    providerOnSuccessTasks.push(() => providerModule.onInitSuccessful(context));
  });

  return sequential(providerOnSuccessTasks).then(() => {
    const frontendPlugins = getFrontendPlugins(context);
    console.log(frontendPlugins)
    const frontendModule = require(frontendPlugins[context.exeInfo.projectConfig.frontendHandler]);
    return frontendModule.onInitSuccessful(context);
  }).then(() => {
    let jsonString = JSON.stringify(context.exeInfo.projectConfig, null, 4);
    const projectCofnigFilePath = amplify.pathManager.getProjectConfigFilePath(projectPath);
    fs.writeFileSync(projectCofnigFilePath, jsonString, 'utf8');

    jsonString = JSON.stringify(context.exeInfo.metaData, null, 4);
    const currentBackendMetaFilePath =
              amplify.pathManager.getCurentAmplifyMetaFilePath(projectPath);
    fs.writeFileSync(currentBackendMetaFilePath, jsonString, 'utf8');
    const backendMetaFilePath = amplify.pathManager.getAmplifyMetaFilePath(projectPath);
    fs.writeFileSync(backendMetaFilePath, jsonString, 'utf8');

    jsonString = JSON.stringify(context.exeInfo.rcData, null, 4);
    const amplifyRcFilePath = amplify.pathManager.getAmplifyRcFilePath(projectPath);
    fs.writeFileSync(amplifyRcFilePath, jsonString, 'utf8');

    printWelcomeMessage();
  });
}

function printWelcomeMessage() {
  print.info('');
  print.success('Your project has been successfully initialized and connected to the cloud!');
  print.info('');
  print.success('Some next steps:');
  print.info("\"amplify status\" will show you what you've added already and if it's locally configured or deployed");
  print.info('"amplify <category> add" will allow you to add features like user login or a backend API');
  print.info('"amplify push" will build all your local backend resources and provision it in the cloud');
  print.info('"amplify publish" will build all your local backend and frontend resources (if you have hosting category added) and provision it in the cloud');
  print.info('');
  print.success('Pro tip:');
  print.info('Try "amplify add api" to create a backend API and then "amplify publish" to deploy everything');
  print.info('');
}

module.exports = {
  run,
};
