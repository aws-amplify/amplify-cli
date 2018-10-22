const path = require('path');
const inquirer = require('inquirer');
const { editorSelection } = require('../../extensions/amplify-helpers/editor-selection');

async function run(context) {
  context.print.warning('Note: It is recommended to run this command from the root of your app directory');
  return new Promise(async (resolve) => {
    const projectPath = process.cwd();
    let projectName = path.basename(projectPath);
    projectName = projectName.replace(/[^a-zA-Z0-9]/g, '');

    if (projectName.length > 20 || projectName.length < 3) {
      const projectNameQuestion = {
        type: 'input',
        name: 'projectName',
        message: 'Enter a name for the project',
        validate: input => new Promise((resolvePromise, reject) => ((input.length > 20 || input.length < 3 || /[^a-zA-Z0-9]/g.test(input)) ? reject(new Error('Project name should be between 3 and 20 characters and alphanumeric')) : resolvePromise(true))),
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
