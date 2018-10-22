const path = require('path');
const inquirer = require('inquirer');
const { normalizeEditorCode, editorSelection } =
  require('../../extensions/amplify-helpers/editor-selection');
const { makeId } = require('../../extensions/amplify-helpers/make-id');

async function run(context) {
  context.print.warning('Note: It is recommended to run this command from the root of your app directory');
  return new Promise(async (resolve) => {
    const projectPath = process.cwd();
    const projectName = await getProjectName(context);
    const defaultEditor = await getEditor(context);

    context.exeInfo.projectConfig = {
      projectName,
      projectPath,
      defaultEditor,
    };

    context.exeInfo.metaData = {
    };

    context.exeInfo.rcData = {
    };

    resolve(context);
  });
}

/* Begin getProjectName */
async function getProjectName(context) {
  let projectName;
  if (context.exeInfo.inputParams.amplify && context.exeInfo.inputParams.amplify.projectName) {
    projectName = normalizeProjectName(context.exeInfo.inputParams.amplify.projectName);
  } else {
    const projectPath = process.cwd();
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

  if (context.exeInfo.inputParams.amplify && context.exeInfo.inputParams.amplify.editor) {
    editor = normalizeEditorCode(context.exeInfo.inputParams.amplify.editor);
  } else {
    if (!context.exeInfo.inputParams.yes) {
      editor = await editorSelection(editor);
    }
  }

  return editor;
}
/* End getEditor */

module.exports = {
  run,
};
