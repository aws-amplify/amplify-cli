const path = require('path');
const fs = require('fs-extra');
const inquirer = require('inquirer');
const { normalizeEditorCode, editorSelection } =
  require('../../extensions/amplify-helpers/editor-selection');
const { makeId } = require('../../extensions/amplify-helpers/make-id');

async function run(context) {
  context.print.warning('Note: It is recommended to run this command from the root of your app directory');

  const projectPath = process.cwd();
  context.exeInfo.isNewProject = isNewProject(context);
  const projectName = await getProjectName(context);
  const envName = await getEnvName(context);

  let defaultEditor = getDefaultEditor(context);

  if (!defaultEditor) {
    defaultEditor = await getEditor(context);
  }

  context.exeInfo.isNewEnv = isNewEnv(context, envName);

  if (context.exeInfo.inputParams && context.exeInfo.inputParams.yes) {
    context.exeInfo.forcePush = true;
  } else {
    context.exeInfo.forcePush = await context.prompt.confirm('Do you want to push your resources to the cloud for your environment?');
  }

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

  return context;
}

/* Begin getProjectName */
async function getProjectName(context) {
  let projectName;
  const projectPath = process.cwd();
  if (!context.exeInfo.isNewProject) {
    const projectConfigFilePath = context.amplify.pathManager.getProjectConfigFilePath(projectPath);
    ({ projectName } = JSON.parse(fs.readFileSync(projectConfigFilePath)));
    return projectName;
  }

  if (context.exeInfo.inputParams.amplify && context.exeInfo.inputParams.amplify.projectName) {
    projectName = normalizeProjectName(context.exeInfo.inputParams.amplify.projectName);
  } else {
    projectName = normalizeProjectName(path.basename(projectPath));
    if (!context.exeInfo.inputParams.yes) {
      const projectNameQuestion = {
        type: 'input',
        name: 'inputProjectName',
        message: 'Enter a name for the project',
        default: projectName,
        validate: input => isProjectNameValid(input) ||
            'Project name should be between 3 and 20 characters and alphanumeric',
      };
      const answer = await inquirer.prompt(projectNameQuestion);
      projectName = answer.inputProjectName;
    }
  }

  return projectName;
}

function isProjectNameValid(projectName) {
  return projectName &&
          projectName.length >= 3 &&
          projectName.length <= 20 &&
          /[a-zA-Z0-9]/g.test(projectName);
}

function normalizeProjectName(projectName) {
  if (!projectName) {
    projectName = `amplify${makeId(5)}`;
  }
  if (!isProjectNameValid(projectName)) {
    projectName = projectName.replace(/[^a-zA-Z0-9]/g, '');
    if (projectName.length < 3) {
      projectName += +makeId(5);
    } else if (projectName.length > 20) {
      projectName = projectName.substring(0, 20);
    }
  }
  return projectName;
}
/* End getProjectName */

/* Begin getEditor */
async function getEditor(context) {
  let editor;
  if (context.exeInfo.inputParams.amplify && context.exeInfo.inputParams.amplify.defaultEditor) {
    editor = normalizeEditorCode(context.exeInfo.inputParams.amplify.defaultEditor);
  } else if (!context.exeInfo.inputParams.yes) {
    editor = await editorSelection(editor);
  }

  return editor;
}
/* End getEditor */

async function getEnvName(context) {
  let envName;

  const isEnvNameValid = (inputEnvName) => {
    let valid = true;

    if (inputEnvName.length > 10 || inputEnvName.length < 2 || /[^a-zA-Z0-9]/g.test(inputEnvName)) {
      valid = false;
    }
    return valid;
  };

  if (context.exeInfo.inputParams.amplify && context.exeInfo.inputParams.amplify.envName) {
    if (isEnvNameValid(context.exeInfo.inputParams.amplify.envName)) {
      ({ envName } = context.exeInfo.inputParams.amplify);
      return envName;
    }
    context.print.error('Environment name should be between 2 and 10 characters and alphanumeric');
    process.exit(1);
  } else if (context.exeInfo.inputParams && context.exeInfo.inputParams.yes) {
    context.print.error('Environment name missing');
    process.exit(1);
  }

  const newEnvQuestion = async () => {
    const envNameQuestion = {
      type: 'input',
      name: 'envName',
      message: 'Enter a name for the enivronment',
      validate: input => new Promise((resolvePromise, reject) => (!isEnvNameValid(input) ? reject(new Error('Environment name should be between 2 and 10 characters and alphanumeric')) : resolvePromise(true))),
    };

    ({ envName } = await inquirer.prompt(envNameQuestion));
  };

  if (isNewProject(context)) {
    await newEnvQuestion();
  } else {
    const allEnvs = context.amplify.getAllEnvs();

    if (allEnvs.length > 0) {
      if (await context.prompt.confirm('Do you want to use an existing environment?')) {
        const envQuestion = {
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
