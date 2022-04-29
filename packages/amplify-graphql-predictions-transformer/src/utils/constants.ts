export const PREDICTIONS_DIRECTIVE_STACK = 'PredictionsDirectiveStack';
export const directiveDefinition = /* GraphQL */ `
  directive @predictions(actions: [PredictionsActions!]!) on FIELD_DEFINITION
  enum PredictionsActions {
    identifyText
    identifyLabels
    convertTextToSpeech
    translateText
  }
`;
export const identifyEntities = 'identifyEntities';
export const identifyText = 'identifyText';
export const identifyLabels = 'identifyLabels';
export const translateText = 'translateText';
export const convertTextToSpeech = 'convertTextToSpeech';
export const identifyTextAmzTarget = 'RekognitionService.DetectText';
export const identifyLabelsAmzTarget = 'RekognitionService.DetectLabels';
export const translateTextAmzTarget = 'AWSShineFrontendService_20170701.TranslateText';
export const amzJsonContentType = 'application/x-amz-json-1.1';
