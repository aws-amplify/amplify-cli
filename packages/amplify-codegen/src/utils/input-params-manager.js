const constants = require('../constants');

function normalizeInputParams(context) {
  let inputParams;
  if (context.exeInfo && context.exeInfo.inputParams) {
    if (context.exeInfo.inputParams[constants.Label]) {
      inputParams = context.exeInfo.inputParams[constants.Label];
    } else {
      for (let i = 0; i < constants.Aliases.length; i++) {
        const alias = constants.Aliases[i];
        if (context.exeInfo.inputParams[alias]) {
          inputParams = context.exeInfo.inputParams[alias];
          break;
        }
      }
    }
  } else {
    context.exeInfo = { inputParams: {} };
  }
  if (inputParams) {
    const normalizedInputParams = {};
    Object.keys(inputParams).forEach(key => {
      const normalizedKey = normalizeKey(key);
      const normalizedValue = normalizeValue(normalizedKey, inputParams[key]);
      normalizedInputParams[normalizedKey] = normalizedValue;
    });
    context.exeInfo.inputParams[constants.Label] = normalizedInputParams;
  }
}

function normalizeKey(key) {
  if (['generateCode', 'generate-code', 'shouldGenerateCode', 'should-generate-code'].includes(key)) {
    key = 'generateCode';
  }
  if (
    [
      'generateDocs',
      'generate-docs',
      'shouldGenerateDocs',
      'should-generate-docs',
      'generateStatements',
      'generate-statements',
      'shouldGenerateStatements',
      'should-generate-statements',
    ].includes(key)
  ) {
    key = 'generateDocs';
  }
  if (['targetLanguage', 'target-language', 'codeLanguage', 'code-language'].includes(key)) {
    key = 'targetLanguage';
  }
  if (['includePattern', 'include-pattern', 'fileNamePattern', 'file-name-pattern'].includes(key)) {
    key = 'includePattern';
  }
  if (['generatedFileName', 'generated-file-name'].includes(key)) {
    key = 'generatedFileName';
  }

  return key;
}

function normalizeValue(key, value) {
  if (key === 'targetLanguage') {
    value = value.toLowerCase();
  }
  return value;
}

module.exports = {
  normalizeInputParams,
};
