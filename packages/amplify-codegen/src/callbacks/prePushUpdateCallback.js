const loadConfig = require('../codegen-config');
const askShouldUpdateCode = require('../walkthrough/questions/updateCode');
const askShouldUpdateStatements = require('../walkthrough/questions/updateDocs');

async function prePushUpdateCallback(context, resourceName) {
  const config = loadConfig(context);
  const project = config
    .getProjects()
    .find(projectItem => projectItem.projectName === resourceName);
  if (project) {
    const yesFlag = context.exeInfo.inputParams && context.exeInfo.inputParams.yes; 
    const shouldUpdateCode = yesFlag ? true : await askShouldUpdateCode();
    if ( shouldUpdateCode ) {
      const shouldGenerateDocs = yesFlag ? true : await askShouldUpdateStatements();
      return {
        gqlConfig: project,
        shouldGenerateDocs,
      };
    }
  }
}

module.exports = prePushUpdateCallback;
