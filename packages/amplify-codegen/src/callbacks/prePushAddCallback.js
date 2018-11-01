const { normalizeInputParams } = require('../walkthrough/normalizeInputParams');
const askShouldGenerateCode = require('../walkthrough/questions/generateCode');
const addWalkThrough = require('../walkthrough/add');
const constants = require('../constants');

async function prePushAddCallback(context, resourceName) {
  let shouldGenerateCode = false;
  normalizeInputParams(context);
  if(context.exeInfo.inputParams){
    if(context.exeInfo.inputParams[constants.Label]){
      shouldGenerateCode = context.exeInfo.inputParams[constants.Label].generateCode;
    }else if(context.exeInfo.inputParams.yes){
      shouldGenerateCode = true; 
    }else{
      shouldGenerateCode = await askShouldGenerateCode();
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
