export class PredictionsResourceIDs {
  static PredictionsDataSourceID(action: string) {
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

  static getActionMapID() {
    return 'predictionsActionMap';
  }

  static getIAMRole() {
    return 'predictionsIAMRole';
  }

  static getLambdaIAMRole() {
    return 'predictionsLambdaIAMRole';
  }

  static getLambdaName() {
    return 'predictionsLambda';
  }

  static getLambdaID() {
    return 'predictionsLambdaFunction';
  }

  static getLambdaHandlerName() {
    return 'predictionsLambda.handler';
  }

  static getLambdaRuntime() {
    return 'nodejs10.x';
  }

  static getPredictionFunctionName(action: string) {
    return `${action}Function`;
  }
}
