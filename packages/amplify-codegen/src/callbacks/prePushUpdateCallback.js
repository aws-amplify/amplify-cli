const { normalizeInputParams } = require('../utils/input-params-manager');
const constants = require('../constants');
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
    if(context.exeInfo.inputParams){
      normalizeInputParams(context);
      const inputParams = context.exeInfo.inputParams[constants.Label]; 
      const yesFlag = context.exeInfo.inputParams.yes;

      if(inputParams && inputParams.hasOwnProperty('generateCode')){
        shouldGenerateCode = inputParams.generateCode;
      }else if(yesFlag){
        shouldGenerateCode = true; 
      }else{
        shouldGenerateCode = await askShouldUpdateCode();
      }

      if(shouldGenerateCode){
        if(inputParams && inputParams.hasOwnProperty('generateDocs')){
          shouldGenerateDocs = inputParams.generateDocs;
        }else if(yesFlag){
          shouldGenerateDocs = true; 
        }else{
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
