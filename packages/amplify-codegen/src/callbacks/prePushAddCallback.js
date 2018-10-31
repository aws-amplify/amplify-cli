const askShouldGenerateCode = require('../walkthrough/questions/generateCode');
const addWalkThrough = require('../walkthrough/add');

async function prePushAddCallback(context, resourceName) {
  let yesFlag = context.exeInfo.inputParams && context.exeInfo.inputParams.yes; 
  const shouldGenerateCode = yesFlag ? true : await askShouldGenerateCode();

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
