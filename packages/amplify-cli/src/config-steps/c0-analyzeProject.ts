import * as path from 'path';
import inquirer, { ListQuestion, InputQuestion } from 'inquirer';
import { $TSContext, stateManager } from 'amplify-cli-core';
import { printer } from 'amplify-prompts';
import { normalizeEditor, editorSelection } from '../extensions/amplify-helpers/editor-selection';
import { isProjectNameValid, normalizeProjectName } from '../extensions/amplify-helpers/project-name-validation';
import { getEnvInfo } from '../extensions/amplify-helpers/get-env-info';
import { displayConfigurationDefaults } from '../init-steps/s0-analyzeProject';
import { getFrontendPlugins } from '../extensions/amplify-helpers/get-frontend-plugins';
import { isContainersEnabled } from '../execution-manager';
import { Context } from '../domain/context';

/**
 * Attempts to determine frontend configuration on project init
 */
export const analyzeProject = async (context: $TSContext): Promise<$TSContext> => {
  context.exeInfo.projectConfig = stateManager.getProjectConfig(undefined, {
    throwIfNotExist: false,
  });

  context.exeInfo.localEnvInfo = getEnvInfo();

  const projectPath = process.cwd();
  Object.assign(context.exeInfo.localEnvInfo, { projectPath });

  const { projectName } = context.exeInfo.projectConfig;
  const { defaultEditor, envName } = context.exeInfo.localEnvInfo;

  printer.blankLine();
  await displayConfigurationDefaults(context, projectName, envName, defaultEditor);

  const frontendPlugins = getFrontendPlugins(context);
  let { frontend } = context.exeInfo.projectConfig;
  if (!frontend) {
    frontend = 'javascript';
  }
  // eslint-disable-next-line import/no-dynamic-require, global-require, @typescript-eslint/no-var-requires
  const frontendModule = require(frontendPlugins[frontend]);
  await frontendModule.displayFrontendDefaults(context, projectPath);
  printer.blankLine();

  const envAwsInfo = stateManager.getLocalAWSInfo();
  if (typeof envAwsInfo?.[envName] === 'object') {
    const awsInfo = envAwsInfo[envName];
    if (awsInfo.useProfile && awsInfo.profileName) {
      await displayProfileSetting(awsInfo.profileName);
      printer.blankLine();
    }
  }

  await displayContainersInfo(context);
  printer.blankLine();

  await configureConfigurationSetting(context);
  await configureProjectName(context);
  await configureEditor(context);

  return context;
};

const displayProfileSetting = (profileName: string): void => {
  printer.info('AWS Profile setting');
  printer.info(`| Selected profile: ${profileName}`);
};

const displayContainersInfo = (context: $TSContext): void => {
  printer.info('Advanced: Container-based deployments');
  const containerDeploymentStatus = isContainersEnabled(context as unknown as Context) ? 'Yes' : 'No';
  printer.info(`| Leverage container-based deployments: ${containerDeploymentStatus}`);
};

const configureConfigurationSetting = async (context: $TSContext): Promise<void> => {
  if (context.exeInfo.inputParams.amplify.headless) {
    return;
  }

  const configureSettingQuestion: ListQuestion = {
    type: 'list',
    name: 'configurationSetting',
    message: 'Which setting do you want to configure?',
    choices: [
      { name: 'Project information', value: 'project' },
      { name: 'AWS Profile setting', value: 'profile' },
      { name: 'Advanced: Container-based deployments', value: 'containers' },
    ],
    default: 'project',
  };

  const { configurationSetting } = await inquirer.prompt(configureSettingQuestion);

  if (configurationSetting === 'containers') {
    context.exeInfo.inputParams.yes = true;
    context.exeInfo.inputParams.containerSetting = true;
  }

  if (configurationSetting === 'profile') {
    context.exeInfo.inputParams.yes = true;
    context.exeInfo.inputParams.profileSetting = true;
  }
};

const configureProjectName = async (context: $TSContext): Promise<void> => {
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
};

const configureEditor = async (context: $TSContext): Promise<void> => {
  let { defaultEditor } = context.exeInfo.localEnvInfo;
  if (context.exeInfo.inputParams.amplify && context.exeInfo.inputParams.amplify.defaultEditor) {
    defaultEditor = normalizeEditor(context.exeInfo.inputParams.amplify.editor);
  } else if (!context.exeInfo.inputParams.yes) {
    defaultEditor = await editorSelection(defaultEditor);
  }

  Object.assign(context.exeInfo.localEnvInfo, { defaultEditor });
};
