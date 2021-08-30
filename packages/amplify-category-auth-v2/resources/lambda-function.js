const response = require('cfn-response');
const aws = require('aws-sdk');

exports.handler = async function (event, context) {
  try {
    const userPoolId = event.ResourceProperties.userpoolId;
    const lambdaConfig = event.ResourceProperties.lambdaConfig;
    const config = {};
    lambdaConfig.forEach(lambda => (config[`${lambda.triggerType}`] = lambda.lambdaFunctionArn));
    if (event.RequestType == 'Delete') {
      const authParams = { UserPoolId: userPoolId, LambdaConfig: {} };
      const cognitoclient = new aws.CognitoIdentityServiceProvider();
      try {
        const result = await cognitoclient.updateUserPool(authParams).promise();
        console.log('delete response data ' + JSON.stringify(result));
        await response.send(event, context, response.SUCCESS, {});
      } catch (err) {
        console.log(err.stack);
        await response.send(event, context, response.FAILED, { err });
      }
    }
    if (event.RequestType == 'Update' || event.RequestType == 'Create') {
      const authParams = { UserPoolId: userPoolId, LambdaConfig: config };
      console.log(authParams);
      const cognitoclient = new aws.CognitoIdentityServiceProvider();
      try {
        const result = await cognitoclient.updateUserPool(authParams).promise();
        console.log('createOrUpdate response data ' + JSON.stringify(result));
        await response.send(event, context, response.SUCCESS, { result });
      } catch (err) {
        console.log(err.stack);
        await response.send(event, context, response.FAILED, { err });
      }
    }
  } catch (err) {
    console.log(err.stack);
    await response.send(event, context, response.FAILED, { err });
  }
};
