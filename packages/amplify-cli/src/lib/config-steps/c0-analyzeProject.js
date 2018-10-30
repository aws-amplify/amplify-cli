const path = require('path');
const inquirer = require('inquirer');
const { normalizeEditorCode, editorSelection } =
  require('../../extensions/amplify-helpers/editor-selection');
const { makeId } = require('../../extensions/amplify-helpers/make-id');

async function run(context) {
  await configureProjectName(context);
  await configureEditor(context);

  return context;
}

/* Begin confighureProjectName */
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
  context.exeInfo.projectConfig.projectName = projectName;
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
/* End confighureProjectName */

/* Begin configureEditor */
async function configureEditor(context) {
  let { defaultEditor } = context.exeInfo.projectConfig;
  if (context.exeInfo.inputParams.amplify && context.exeInfo.inputParams.amplify.defaultEditor) {
    defaultEditor = normalizeEditorCode(context.exeInfo.inputParams.amplify.editor);
  } else if (!context.exeInfo.inputParams.yes) {
    defaultEditor = await editorSelection(defaultEditor);
  }

  context.exeInfo.projectConfig.defaultEditor = defaultEditor;
}
/* End configureEditor */

module.exports = {
  run,
};
