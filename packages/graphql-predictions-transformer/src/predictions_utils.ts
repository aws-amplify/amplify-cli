
export const iamActions = {
  identifyText: 'rekognition:DetectText',
  identifyLabels: 'rekognition:DetectLabels',
  translateText: 'translate:TranslateText',
};

export const iamLambdaActions = ['convertTextToSpeech'];

export const allowedActions = {
  identifyText: {
    next: ['translateText'],
  },
  identifyLabels: {
    next: ['translateText', 'convertTextToSpeech'],
  },
  translateText: {
    next: ['convertTextToSpeech'],
  },
  convertTextToSpeech: {
    next: [],
  },
};
