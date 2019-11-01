
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

  private static capitalizeFirstLetter(str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1);
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
    return `${action}Function`
  }
}