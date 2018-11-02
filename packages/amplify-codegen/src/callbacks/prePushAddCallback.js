const { normalizeInputParams } = require('../utils/input-params-manager');
const constants = require('../constants');
const askShouldGenerateCode = require('../walkthrough/questions/generateCode');
const addWalkThrough = require('../walkthrough/add');
const constants = require('../constants');

async function prePushAddCallback(context, resourceName) {
  let shouldGenerateCode = false;
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
  }else{
    shouldGenerateCode = await askShouldGenerateCode();
  }

  if (shouldGenerateCode) {
    const answers = await addWalkThrough(context, ['shouldGenerateCode']);
    const newProject = {
      projectName: resourceName,
      includes: answers.includePattern,
      excludes: answers.excludePattern,
      amplifyExtension: {
        codeGenTarget: answers.target || '',
        generatedFileName: answers.generatedFileName || '',
        docsFilePath: answers.docsFilePath,
      },
    };
    return {
      gqlConfig: newProject,
      shouldGenerateDocs: answers.shouldGenerateDocs,
    };
  }
}

module.exports = prePushAddCallback;
