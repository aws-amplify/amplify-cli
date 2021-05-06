import { $TSContext, exitOnNextTick, InvalidEnvironmentNameError, stateManager } from 'amplify-cli-core';
import * as fs from 'fs-extra';
import * as inquirer from 'inquirer';
import * as path from 'path';
import { amplifyCLIConstants } from '../extensions/amplify-helpers/constants';
import { editors, editorSelection, normalizeEditor } from '../extensions/amplify-helpers/editor-selection';
import { getFrontendPlugins } from '../extensions/amplify-helpers/get-frontend-plugins';
import { isProjectNameValid, normalizeProjectName } from '../extensions/amplify-helpers/project-name-validation';
import { getSuitableFrontend } from './s1-initFrontend';

export async function analyzeProjectHeadless(context: $TSContext) {
  const projectPath = process.cwd();
  const projectName = path.basename(projectPath);
  const env = getDefaultEnv(context);
  setProjectConfig(context, projectName);
  setExeInfo(context, projectPath, undefined, env);
  // default behavior in quickstart used to be android.
  // default to that here unless different param specified
  const { frontend } = context?.parameters?.options;
  if (!frontend) {
    context.print.warning('No frontend specified. Defaulting to android.');
    context.exeInfo.projectConfig.frontend = 'android';
  } else {
    context.exeInfo.projectConfig.frontend = frontend;
  }
}

// defaultEnv: string | undefined - this is an accurate type description based on what the code does,
// but this might indicate an unhandled edge case
export function displayConfigurationDefaults(
  context: $TSContext,
  defaultProjectName: string,
  defaultEnv: string | undefined,
  defaultEditorName: string,
) {
  context.print.info('Project information');
  context.print.info(`| Name: ${defaultProjectName}`);
  context.print.info(`| Environment: ${defaultEnv}`);
  context.print.info(`| Default editor: ${defaultEditorName}`);
}

function setConfigurationDefaults(
  context: $TSContext,
  projectPath: string,
  defaultProjectName: string,
  defaultEnv: string | undefined,
  defaultEditor: string,
) {
  setExeInfo(context, projectPath, defaultEditor, defaultEnv);
  setProjectConfig(context, defaultProjectName);
  context.exeInfo.inputParams.amplify = context.exeInfo.inputParams.amplify || {};
  context.exeInfo.inputParams.amplify.projectName = defaultProjectName;
  context.exeInfo.inputParams.amplify.envName = defaultEnv;
  context.exeInfo.inputParams.amplify.defaultEditor = defaultEditor;
}

async function displayAndSetDefaults(context: $TSContext, projectPath: string, projectName: string) {
  const defaultProjectName = projectName;
  const defaultEnv = getDefaultEnv(context);
  let defaultEditor;
  if (context?.exeInfo?.inputParams?.amplify?.defaultEditor) {
    defaultEditor = normalizeEditor(context.exeInfo.inputParams.amplify.defaultEditor);
  } else {
    defaultEditor = editors.length > 0 ? editors[0].value : 'vscode';
  }
  const editorIndex = editors.findIndex(editorEntry => editorEntry.value === defaultEditor);
  const defaultEditorName = editorIndex > -1 ? editors[editorIndex].name : 'Visual Studio Code';

  context.print.success('The following configuration will be applied:');
  context.print.info('');

  await displayConfigurationDefaults(context, defaultProjectName, defaultEnv, defaultEditorName);

  const frontendPlugins = getFrontendPlugins(context);
  const defaultFrontend = getSuitableFrontend(context, frontendPlugins, projectPath);
  const frontendModule = require(frontendPlugins[defaultFrontend]);

  await frontendModule.displayFrontendDefaults(context, projectPath);
  context.print.info('');

  if (context.exeInfo.inputParams.yes || (await context.amplify.confirmPrompt('Initialize the project with the above configuration?'))) {
    await setConfigurationDefaults(context, projectPath, defaultProjectName, defaultEnv, defaultEditorName);
    await frontendModule.setFrontendDefaults(context, projectPath);
  }
}

export async function analyzeProject(context: $TSContext): Promise<$TSContext> {
  if (!context.parameters.options.app || !context.parameters.options.quickstart) {
    context.print.warning('Note: It is recommended to run this command from the root of your app directory');
  }
  const projectPath = process.cwd();
  context.exeInfo.isNewProject = isNewProject(context);
  const projectName = await getProjectName(context);

  if (context.exeInfo.isNewProject && context.parameters.command !== 'env') {
    await displayAndSetDefaults(context, projectPath, projectName);
  }

  const envName = await getEnvName(context);

  let defaultEditor = getDefaultEditor();

  if (!defaultEditor) {
    defaultEditor = await getEditor(context);
  }

  context.exeInfo.isNewEnv = isNewEnv(envName);
  context.exeInfo.forcePush = !!context?.parameters?.options?.forcePush;

  // If it is a new env and we have an existing environment save that name so
  // it can be used to gather resource information like env specific to clone import resources
  if (context.exeInfo.isNewEnv && !context.exeInfo.isNewProject) {
    const currentLocalEnvInfo = stateManager.getLocalEnvInfo(undefined, {
      throwIfNotExist: false,
    });

    if (currentLocalEnvInfo) {
      context.exeInfo.sourceEnvName = currentLocalEnvInfo.envName;
    }
  }

  setProjectConfig(context, projectName);
  setExeInfo(context, projectPath, defaultEditor, envName);

  return context;
}

function setProjectConfig(context: $TSContext, projectName: string) {
  context.exeInfo.isNewProject = isNewProject(context);
  context.exeInfo.projectConfig = {
    projectName,
    version: amplifyCLIConstants.CURRENT_PROJECT_CONFIG_VERSION,
  };
}

function setExeInfo(context: $TSContext, projectPath: String, defaultEditor?: String, envName?: String) {
  context.exeInfo.localEnvInfo = {
    projectPath,
    defaultEditor,
    envName,
  };
  context.exeInfo.teamProviderInfo = {};
  context.exeInfo.metaData = {};

  return context;
}

/* Begin getProjectName */
async function getProjectName(context: $TSContext) {
  let projectName;
  const projectPath = process.cwd();

  if (!context.exeInfo.isNewProject) {
    const projectConfig = stateManager.getProjectConfig(projectPath);

    projectName = projectConfig.projectName;

    return projectName;
  }

  if (context.exeInfo.inputParams.amplify && context.exeInfo.inputParams.amplify.projectName) {
    projectName = normalizeProjectName(context.exeInfo.inputParams.amplify.projectName);
  } else {
    projectName = normalizeProjectName(path.basename(projectPath));

    if (!context.exeInfo.inputParams.yes) {
      const projectNameQuestion: inquirer.InputQuestion = {
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

  return projectName;
}
/* End getProjectName */

/* Begin getEditor */
async function getEditor(context: $TSContext) {
  let editor;
  if (context.exeInfo.inputParams.amplify && context.exeInfo.inputParams.amplify.defaultEditor) {
    editor = normalizeEditor(context.exeInfo.inputParams.amplify.defaultEditor);
  } else if (!context.exeInfo.inputParams.yes) {
    editor = await editorSelection(editor);
  }

  return editor;
}
/* End getEditor */

const isEnvNameValid = (inputEnvName: string) => {
  return /^[a-z]{2,10}$/.test(inputEnvName);
};

const INVALID_ENV_NAME_MSG = 'Environment name must be between 2 and 10 characters, and lowercase only.';

function getDefaultEnv(context: $TSContext): string | undefined {
  let defaultEnv = 'dev';

  if (context?.exeInfo?.inputParams?.amplify?.envName) {
    if (isEnvNameValid(context.exeInfo.inputParams.amplify.envName)) {
      defaultEnv = context.exeInfo.inputParams.amplify.envName;
      return defaultEnv;
    }
    context.print.error(INVALID_ENV_NAME_MSG);
    context.usageData.emitError(new InvalidEnvironmentNameError(INVALID_ENV_NAME_MSG));
    exitOnNextTick(1);
  }

  if (isNewProject(context) || !context.amplify.getAllEnvs().includes(defaultEnv)) {
    return defaultEnv;
  }
  return undefined;
}

async function getEnvName(context: $TSContext) {
  let envName;

  if (context.exeInfo.inputParams.amplify && context.exeInfo.inputParams.amplify.envName) {
    if (isEnvNameValid(context.exeInfo.inputParams.amplify.envName)) {
      ({ envName } = context.exeInfo.inputParams.amplify);
      return envName;
    }
    context.print.error(INVALID_ENV_NAME_MSG);
    await context.usageData.emitError(new InvalidEnvironmentNameError(INVALID_ENV_NAME_MSG));
    exitOnNextTick(1);
  } else if (context.exeInfo.inputParams && context.exeInfo.inputParams.yes) {
    context.print.error('Environment name missing');
    await context.usageData.emitError(new InvalidEnvironmentNameError(INVALID_ENV_NAME_MSG));
    exitOnNextTick(1);
  }

  const newEnvQuestion = async () => {
    let defaultEnvName = getDefaultEnv(context);
    const envNameQuestion: inquirer.InputQuestion = {
      type: 'input',
      name: 'envName',
      message: 'Enter a name for the environment',
      default: defaultEnvName,
      validate: input => (!isEnvNameValid(input) ? INVALID_ENV_NAME_MSG : true),
    };

    ({ envName } = await inquirer.prompt(envNameQuestion));
  };

  if (isNewProject(context)) {
    await newEnvQuestion();
  } else {
    const allEnvs = context.amplify.getAllEnvs();

    if (allEnvs.length > 0) {
      if (await context.amplify.confirmPrompt('Do you want to use an existing environment?')) {
        const envQuestion: inquirer.ListQuestion = {
          type: 'list',
          name: 'envName',
          message: 'Choose the environment you would like to use:',
          choices: allEnvs,
        };

        ({ envName } = await inquirer.prompt(envQuestion));
      } else {
        await newEnvQuestion();
      }
    } else {
      await newEnvQuestion();
    }
  }

  return envName;
}

function isNewEnv(envName: string) {
  let newEnv = true;
  const projectPath = process.cwd();
  const teamProviderInfo = stateManager.getTeamProviderInfo(projectPath, {
    throwIfNotExist: false,
    default: {},
  });

  if (teamProviderInfo[envName]) {
    newEnv = false;
  }

  return newEnv;
}

function isNewProject(context: $TSContext) {
  let newProject = true;
  const projectPath = process.cwd();
  const projectConfigFilePath = context.amplify.pathManager.getProjectConfigFilePath(projectPath);
  if (fs.existsSync(projectConfigFilePath)) {
    newProject = false;
  }
  return newProject;
}

function getDefaultEditor() {
  const projectPath = process.cwd();
  const localEnvInfo = stateManager.getLocalEnvInfo(projectPath, {
    throwIfNotExist: false,
    default: {},
  });

  return localEnvInfo.defaultEditor;
}
