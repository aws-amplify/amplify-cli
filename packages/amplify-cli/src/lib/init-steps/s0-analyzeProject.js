const path = require('path');
const inquirer = require('inquirer');
const { editorSelection } = require('../../extensions/amplify-helpers/editor-selection');
const { makeId } = require('../../extensions/amplify-helpers/make-id');

async function run(context) {
  context.print.warning('Note: It is recommended to run this command from the root of your app directory');
  return new Promise(async (resolve) => {
    const projectPath = process.cwd();
    const projectName = await getProjectName(context);
    const defaultEditor = await editorSelection();

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

async function getProjectName(context){
  let projectName;
  if(context.exeInfo.inputParams.amplify){
    projectName = normalizeProjectName(context.exeInfo.inputParams.amplify.projectName);
  }else{
    const projectPath = process.cwd();
    projectName = normalizeProjectName(path.basename(projectPath).replace(/[^a-zA-Z0-9]/g, ''));
 
    if(!context.exeInfo.inputParams.yes){
      const projectNameQuestion = {
        type: 'input',
        name: 'inputProjectName',
        message: 'Enter a name for the project',
        default: projectName,
        validate: input => { 
          return isProjectNameValid(input) || 
            'Project name should be between 3 and 20 characters and alphanumeric';
        }
      };
      const answer = await inquirer.prompt(projectNameQuestion);
      projectName = answer.inputProjectName;
    }
  }

  return projectName; 
}

function isProjectNameValid(projectName){
  return projectName && 
          projectName.length >= 3 && 
          projectName.length <= 20 && 
          /[a-zA-Z0-9]/g.test(projectName);
}

function normalizeProjectName(projectName){
  if(!projectName){
    projectName = 'amplify' + makeId(5);
  }
  if(!isProjectNameValid(projectName)){
    projectName = projectName.replace(/[^a-zA-Z0-9]/g, '');
    if(projectName.length<3){
      projectName = projectName +  + makeId(5);
    }else if(projectName.length > 20){
      projectName = projectName.substring(0, 20);
    }
  }
  return projectName;
}

module.exports = {
  run,
};
