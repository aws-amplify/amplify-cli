const fs = require('fs-extra');
const path = require('path');
const inquirer = require('inquirer');
const { editorSelection } = require('../../extensions/amplify-helpers/editor-selection');
const { amplifyMetricsQuestion } = require('../../extensions/amplify-helpers/amplify-metrics-question');

function run(context) {
  return new Promise(async (resolve) => {
    context.exeInfo = {};
    const projectConfigFilePath = context.amplify.pathManager.getProjectConfigFilePath();
    if (fs.existsSync(projectConfigFilePath)) {
      context.exeInfo.projectConfig = JSON.parse(fs.readFileSync(projectConfigFilePath));
    }

    await initializeConfig(context);

    const { projectPath } = context.exeInfo.projectConfig;
    const backendMetaFilePath = context.amplify.pathManager.getAmplifyMetaFilePath(projectPath);
    if (fs.existsSync(backendMetaFilePath)) {
      context.exeInfo.metaData = JSON.parse(fs.readFileSync(backendMetaFilePath));
    }

    const amplifyRcFilePath = context.amplify.pathManager.getAmplifyRcFilePath(projectPath);
    if (fs.existsSync(amplifyRcFilePath)) {
      context.exeInfo.rcData = JSON.parse(fs.readFileSync(amplifyRcFilePath));
    }
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
  const sendAmplifyMetrics = await amplifyMetricsQuestion();

  const projectConfig = {
    projectName,
    projectPath,
    defaultEditor,
    sendAmplifyMetrics,
  };

  Object.assign(context.exeInfo.projectConfig, projectConfig);
}

module.exports = {
  run,
};
