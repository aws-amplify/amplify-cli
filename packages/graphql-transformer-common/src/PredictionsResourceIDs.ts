export class PredictionsResourceIDs {
  static actionMapID = 'predictionsActionMap';
  static iamRole = 'predictionsIAMRole';
  static lambdaIAMRole = 'predictionsLambdaIAMRole'
  static lambdaName = 'predictionsLambda';
  static lambdaID = 'predictionsLambdaFunction'
  static lambdaHandlerName = 'predictionsLambda.handler';
  static lambdaRuntime = 'nodejs10.x';
  static lambdaTimeout = 60;

  static getPredictionFunctionName(action: string) {
    return `${action}Function`;
  }
}
