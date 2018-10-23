const fs = require('fs-extra');
const path = require('path');
const inquirer = require('inquirer');
const { editorSelection } = require('../../extensions/amplify-helpers/editor-selection');

function run(context) {
  return new Promise(async (resolve) => {
    context.exeInfo = {};
    const projectConfigFilePath = context.amplify.pathManager.getProjectConfigFilePath();
    if (fs.existsSync(projectConfigFilePath)) {
      context.exeInfo.projectConfig = JSON.parse(fs.readFileSync(projectConfigFilePath));
    }
    const envFilePath = context.amplify.pathManager.getLocalEnvFilePath();
    context.exeInfo.localEnvInfo = JSON.parse(fs.readFileSync(envFilePath));

    await initializeConfig(context);

    resolve(context);
  });
}

async function initializeConfig(context) {
  if (!context.exeInfo.projectConfig) {
    context.exeInfo.projectConfig = {};
  }

  const projectPath = process.cwd();
  if (!fs.existsSync(path.join(projectPath, 'amplify'))) {
    context.print.error('Please execute this command from the root of your app');
    process.exit(0);
  }
  let projectName = context.exeInfo.projectConfig.projectName || path.basename(projectPath);
  projectName = projectName.replace(/[^a-zA-Z0-9]/g, '');

  const projectNameQuestion = {
    type: 'input',
    name: 'projectName',
    message: 'Enter a name for the project',
    default: projectName,
    validate: input => new Promise((resolvePromise, reject) => ((input.length > 20 || input.length < 3 || /[^a-zA-Z0-9]/g.test(projectName)) ? reject(new Error('Project name should be alphanumeric between 3 and 20 characters')) : resolvePromise(true))),
  };

  ({ projectName } = await inquirer.prompt(projectNameQuestion));

  const defaultEditor = await editorSelection(context.exeInfo.projectConfig.defaultEditor);

  const projectConfig = {
    projectName,
  };

  const localEnvInfo = {
    projectPath,
    defaultEditor,
  };

  Object.assign(context.exeInfo, projectConfig, projectConfig);
  Object.assign(context.exeInfo.localEnvInfo, localEnvInfo);
}

module.exports = {
  run,
};
