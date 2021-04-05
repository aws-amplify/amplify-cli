const response = require('cfn-response');
const aws = require('aws-sdk');
let responseData = {};
exports.handler = function (event, context) {
  try {
    const userPoolId = event.ResourceProperties.userpoolId;
    const lambdaConfig = event.ResourceProperties.lambdaConfig;
    const config = {};
    lambdaConfig.forEach(lambda => (config[`${lambda.triggerType}`] = lambda.lambdaFunctionArn));
    let promises = [];
    if (event.RequestType == 'Delete') {
      const authParams = { UserPoolId: userPoolId, LambdaConfig: {} };
      const cognitoclient = new aws.CognitoIdentityServiceProvider();
      promises.push(cognitoclient.updateUserPool(authParams).promise());
      Promise.all(promises)
        .then(res => {
          console.log('delete response data ' + JSON.stringify(res));
          response.send(event, context, response.SUCCESS, {});
        })
        .catch(err => {
          console.log(err.stack);
          response.send(event, context, response.FAILED, { err });
        });
    }
    if (event.RequestType == 'Update' || event.RequestType == 'Create') {
      const authParams = { UserPoolId: userPoolId, LambdaConfig: config };
      console.log(authParams);
      const cognitoclient = new aws.CognitoIdentityServiceProvider();
      promises.push(cognitoclient.updateUserPool(authParams).promise());
      Promise.all(promises)
        .then(res => {
          console.log('createOrUpdate ' + res);
          console.log('response data ' + JSON.stringify(res));
          response.send(event, context, response.SUCCESS, { res });
        })
        .catch(err => {
          console.log(err.stack);
          response.send(event, context, response.FAILED, { err });
        });
    }
  } catch (err) {
    console.log(err.stack);
    response.send(event, context, response.FAILED, { err });
  }
};
