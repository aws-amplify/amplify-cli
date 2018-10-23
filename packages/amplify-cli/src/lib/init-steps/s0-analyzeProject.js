const path = require('path');
const fs = require('fs-extra');
const inquirer = require('inquirer');
const { editorSelection } = require('../../extensions/amplify-helpers/editor-selection');

async function run(context) {
  context.print.warning('Note: It is recommended to run this command from the root of your app directory');
  return new Promise(async (resolve) => {
    const projectPath = process.cwd();
    let projectName = path.basename(projectPath);
    projectName = projectName.replace(/[^a-zA-Z0-9]/g, '');

    if (projectName.length > 20 || projectName.length < 3) {
      const projectNameQuestion = {
        type: 'input',
        name: 'projectName',
        message: 'Enter a name for the project',
        validate: input => new Promise((resolvePromise, reject) => ((input.length > 20 || input.length < 3 || /[^a-zA-Z0-9]/g.test(input)) ? reject(new Error('Project name should be between 3 and 20 characters and alphanumeric')) : resolvePromise(true))),
      };

      ({ projectName } = await inquirer.prompt(projectNameQuestion));
    }

    const envNameQuestion = {
      type: 'input',
      name: 'envName',
      message: 'Enter a name for the enivronment',
      validate: input => new Promise((resolvePromise, reject) => ((input.length > 10 || input.length < 2 || /[^a-zA-Z0-9]/g.test(input)) ? reject(new Error('Env name should be between 2 and 10 characters and alphanumeric')) : resolvePromise(true))),
    };

    const { envName } = await inquirer.prompt(envNameQuestion);

    let defaultEditor = getDefaultEditor(context);

    if (!defaultEditor) {
      defaultEditor = await editorSelection();
    }

    context.exeInfo = {};

    context.exeInfo.isNewEnv = isNewEnv(context, envName);
    context.exeInfo.isNewProject = isNewProject(context);

    context.exeInfo.projectConfig = {
      projectName,
    };

    context.exeInfo.localEnvInfo = {
      projectPath,
      defaultEditor,
      envName,
    };

    context.exeInfo.teamProviderInfo = {
    };

    context.exeInfo.metaData = {
    };

    resolve(context);
  });
}

function isNewEnv(context, envName) {
  let newEnv = true;
  const projectPath = process.cwd();
  const providerInfoFilePath = context.amplify.pathManager.getProviderInfoFilePath(projectPath);

  if (fs.existsSync(providerInfoFilePath)) {
    const envProviderInfo = JSON.parse(fs.readFileSync(providerInfoFilePath));
    if (envProviderInfo[envName]) {
      newEnv = false;
    }
  }

  return newEnv;
}

function isNewProject(context) {
  let newProject = true;
  const projectPath = process.cwd();
  const projectConfigFilePath = context.amplify.pathManager.getProjectConfigFilePath(projectPath);
  if (fs.existsSync(projectConfigFilePath)) {
    newProject = false;
  }
  return newProject;
}

function getDefaultEditor(context) {
  let defaultEditor;
  const projectPath = process.cwd();
  const localEnvFilePath = context.amplify.pathManager.getLocalEnvFilePath(projectPath);
  if (fs.existsSync(localEnvFilePath)) {
    ({ defaultEditor } = JSON.parse(fs.readFileSync(localEnvFilePath)));
  }

  return defaultEditor;
}


module.exports = {
  run,
};
