// import { IAM } from 'cloudform-types';


export const iamActions = {
    identifyCelebrities: 'rekognition:RecognizeCelebrities',
    identifyText: 'rekognition:DetectText',
    identifyLabels: 'rekognition:DetectLabels',
    translateText: 'translate:TranslateText',
};

// functions which require a lambda
export const iamLambdaActions = [
    'convertTextToSpeech'
];

export function getPredictionsDataSourceID(action: string) {
    switch (action) {
        case 'identifyEntities':
        case 'identifyText':
        case 'identifyLabels':
            return 'rekognitionDataSource';
        case 'translateText':
            return 'translateDataSource';
        case 'convertTextToSpeech':
            return 'pollyDataSource';
        default:
            break;
    }
}

export function getStorageARN(name: string) {
    return `arn:aws:s3:::${name}/*`;
}

export const allowedActions = {
    identifyCelebrities: {
        next: ['convertTextToSpeech']
    },
    identifyText: {
        next: ['translateText']
    },
    identifyLabels: {
        next: ['translateText', 'convertTextToSpeech']
    },
    translateText: {
        next: ['convertTextToSpeech']
    },
    convertTextToSpeech: {
        next: []
    }
};