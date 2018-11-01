const { normalizeInputParams } = require('../walkthrough/normalizeInputParams');
const loadConfig = require('../codegen-config');
const askShouldUpdateCode = require('../walkthrough/questions/updateCode');
const askShouldUpdateDocs = require('../walkthrough/questions/updateDocs');

async function prePushUpdateCallback(context, resourceName) {
  const config = loadConfig(context);
  const project = config
    .getProjects()
    .find(projectItem => projectItem.projectName === resourceName);
  if (project) {

    let shouldGenerateCode = false;
    let shouldGenerateDocs = false; 
    normalizeInputParams(context);
    if(context.exeInfo.inputParams){
      if(context.exeInfo.inputParams[constants.Label]){
        shouldGenerateCode = context.exeInfo.inputParams[constants.Label].generateCode;
        shouldGenerateDocs = context.exeInfo.inputParams[constants.Label].generateDocs;
      }else if(context.exeInfo.inputParams.yes){
        shouldGenerateCode = true; 
        shouldGenerateDocs = true;
      }else{
        shouldGenerateCode = await askShouldUpdateCode();
        if(shouldGenerateCode){
          shouldGenerateDocs = await askShouldUpdateDocs();
        }
      }
    }else{
      shouldGenerateCode = await askShouldUpdateCode();
      if(shouldGenerateCode){
        shouldGenerateDocs = await askShouldUpdateDocs();
      }
    }

    if ( shouldGenerateCode ) {
      return {
        gqlConfig: project,
        shouldGenerateDocs,
      };
    }

  }
}

module.exports = prePushUpdateCallback;
