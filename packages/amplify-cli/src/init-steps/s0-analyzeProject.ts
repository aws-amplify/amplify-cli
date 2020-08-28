import * as path from 'path';
import * as fs from 'fs-extra';
import * as inquirer from 'inquirer';
import { normalizeEditor, editorSelection } from '../extensions/amplify-helpers/editor-selection';
import { isProjectNameValid, normalizeProjectName } from '../extensions/amplify-helpers/project-name-validation';
import { amplifyCLIConstants } from '../extensions/amplify-helpers/constants';
import { stateManager } from 'amplify-cli-core';

export async function analyzeProject(context) {
  if (!context.parameters.options.app) {
    context.print.warning('Note: It is recommended to run this command from the root of your app directory');
  }
  const projectPath = process.cwd();
  context.exeInfo.isNewProject = isNewProject(context);
  const projectName = await getProjectName(context);
  const envName = await getEnvName(context);

  let defaultEditor = getDefaultEditor();

  if (!defaultEditor) {
    defaultEditor = await getEditor(context);
  }

  context.exeInfo.isNewEnv = isNewEnv(envName);

  if ((context.exeInfo.inputParams && context.exeInfo.inputParams.yes) || context.parameters.options.forcePush) {
    context.exeInfo.forcePush = true;
  } else {
    context.exeInfo.forcePush = false;
  }

  context.exeInfo.projectConfig = {
    projectName,
    version: amplifyCLIConstants.PROJECT_CONFIG_VERSION,
  };

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
async function getProjectName(context) {
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
async function getEditor(context) {
  let editor;
  if (context.exeInfo.inputParams.amplify && context.exeInfo.inputParams.amplify.defaultEditor) {
    editor = normalizeEditor(context.exeInfo.inputParams.amplify.defaultEditor);
  } else if (!context.exeInfo.inputParams.yes) {
    editor = await editorSelection(editor);
  }

  return editor;
}
/* End getEditor */

async function getEnvName(context) {
  let envName;

  const isEnvNameValid = inputEnvName => {
    return /^[a-z]{2,10}$/.test(inputEnvName);
  };

  const INVALID_ENV_NAME_MSG = 'Environment name must be between 2 and 10 characters, and lowercase only.';

  if (context.exeInfo.inputParams.amplify && context.exeInfo.inputParams.amplify.envName) {
    if (isEnvNameValid(context.exeInfo.inputParams.amplify.envName)) {
      ({ envName } = context.exeInfo.inputParams.amplify);
      return envName;
    }
    context.print.error(INVALID_ENV_NAME_MSG);
    process.exit(1);
  } else if (context.exeInfo.inputParams && context.exeInfo.inputParams.yes) {
    context.print.error('Environment name missing');
    process.exit(1);
  }

  const newEnvQuestion = async () => {
    let defaultEnvName;
    if (isNewProject(context) || !context.amplify.getAllEnvs().includes('dev')) {
      defaultEnvName = 'dev';
    }

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

function isNewEnv(envName) {
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

function isNewProject(context) {
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
