const path = require('path');
const inquirer = require('inquirer');
const { editorSelection } = require('../../extensions/amplify-helpers/editor-selection');

async function run(context) {
  return new Promise(async (resolve) => {
    const projectPath = process.cwd();
    let projectName = path.basename(projectPath);
    projectName = projectName.replace(/[^a-zA-Z0-9]/g, '');

    if (projectName.length > 10) {
      const projectNameQuestion = {
        type: 'input',
        name: 'projectName',
        message: 'Please enter a name for the project',
        validate: input => new Promise((resolvePromise, reject) => ((input.length > 10 || input.length < 3) ? reject(new Error('Project name should be between 3 and 10 characters')) : resolvePromise(true))),
      };

      ({ projectName } = await inquirer.prompt(projectNameQuestion));
    }

    const defaultEditor = await editorSelection();

    context.exeInfo = {};

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

module.exports = {
  run,
};
