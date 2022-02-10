export const allowedActions = new Map([
  ['identifyText', ['translateText']],
  ['identifyLabels', ['translateText', 'convertTextToSpeech']],
  ['translateText', ['convertTextToSpeech']],
  ['convertTextToSpeech', []],
]);

export const actionToDataSourceMap = new Map([
  ['identifyEntities', 'RekognitionDataSource'],
  ['identifyText', 'RekognitionDataSource'],
  ['identifyLabels', 'RekognitionDataSource'],
  ['translateText', 'TranslateDataSource'],
  ['convertTextToSpeech', 'LambdaDataSource'],
]);

export const actionToRoleAction = new Map([
  ['identifyText', 'rekognition:DetectText'],
  ['identifyLabels', 'rekognition:DetectLabels'],
  ['translateText', 'translate:TranslateText'],
]);
