import * as path from 'path';
import inquirer, { InputQuestion } from 'inquirer';
import { normalizeEditor, editorSelection } from '../extensions/amplify-helpers/editor-selection';
import { isProjectNameValid, normalizeProjectName } from '../extensions/amplify-helpers/project-name-validation';
import { getEnvInfo } from '../extensions/amplify-helpers/get-env-info';
import { displayConfigurationDefaults } from '../init-steps/s0-analyzeProject';
import { getFrontendPlugins } from '../extensions/amplify-helpers/get-frontend-plugins';
import { isContainersEnabled } from '../execution-manager';
import { stateManager } from 'amplify-cli-core';

export async function analyzeProject(context) {
  context.exeInfo.projectConfig = stateManager.getProjectConfig(undefined, {
    throwIfNotExist: false,
  });

  context.exeInfo.localEnvInfo = getEnvInfo();

  const projectPath = process.cwd();
  Object.assign(context.exeInfo.localEnvInfo, { projectPath });

  let { projectName } = context.exeInfo.projectConfig;
  let { defaultEditor, envName } = context.exeInfo.localEnvInfo;

  context.print.info('');
  await displayConfigurationDefaults(context, projectName, envName, defaultEditor);

  const frontendPlugins = getFrontendPlugins(context);
  const frontend = context.exeInfo.projectConfig.frontend;
  const frontendModule = require(frontendPlugins[frontend]);
  await frontendModule.displayFrontendDefaults(context, projectPath);
  context.print.info('');

  const envAwsInfo = stateManager.getLocalAWSInfo();
  if (envAwsInfo && envAwsInfo[envName]) {
    const awsInfo = envAwsInfo[envName];
    if (awsInfo['useProfile'] && awsInfo['profileName']) {
      await displayProfileSetting(context, awsInfo['profileName']);
      context.print.info('');
    }
  }

  await displayContainersInfo(context);
  context.print.info('');

  await configureProjectName(context);
  await configureEditor(context);

  return context;
}

async function displayProfileSetting(context, profileName) {
  context.print.info('AWS Profile setting');
  context.print.info(`| Selected profile: ${profileName}`);
}

async function displayContainersInfo(context) {
  context.print.info('Advanced: Container-based deployments');
  const containerDeploymentStatus = isContainersEnabled(context) ? 'Yes' : 'No';
  context.print.info(`| Leverage container-based deployments: ${containerDeploymentStatus}`);
}

async function configureProjectName(context) {
  let { projectName } = context.exeInfo.projectConfig;
  if (context.exeInfo.inputParams.amplify && context.exeInfo.inputParams.amplify.projectName) {
    projectName = normalizeProjectName(context.exeInfo.inputParams.amplify.projectName);
  } else {
    if (!projectName) {
      const projectPath = process.cwd();
      projectName = normalizeProjectName(path.basename(projectPath));
    }
    if (!context.exeInfo.inputParams.yes) {
      const projectNameQuestion: InputQuestion<{ inputProjectName: string }> = {
        type: 'input',
        name: 'inputProjectName',
        message: 'Enter a name for the project',
        default: projectName,
        validate: input => isProjectNameValid(input) || 'Project name should be between 3 and 20 characters and alphanumeric',
      };
      const answer = await inquirer.prompt(projectNameQuestion);
      projectName = answer.inputProjectName;
    }
  }

  Object.assign(context.exeInfo.projectConfig, { projectName });
}

async function configureEditor(context) {
  let { defaultEditor } = context.exeInfo.localEnvInfo;
  if (context.exeInfo.inputParams.amplify && context.exeInfo.inputParams.amplify.defaultEditor) {
    defaultEditor = normalizeEditor(context.exeInfo.inputParams.amplify.editor);
  } else if (!context.exeInfo.inputParams.yes) {
    defaultEditor = await editorSelection(defaultEditor);
  }

  Object.assign(context.exeInfo.localEnvInfo, { defaultEditor });
}
