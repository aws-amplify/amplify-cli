const response = require('cfn-response');
const aws = require('aws-sdk');

exports.handler = async function (event, context) {
  try {
    const userPoolId = event.ResourceProperties.userpoolId;
    const lambdaConfig = event.ResourceProperties.lambdaConfig;
    const config = {};
    const cognitoclient = new aws.CognitoIdentityServiceProvider();
    const userPoolConfig = await cognitoclient.describeUserPool({ UserPoolId: userPoolId }).promise();
    // convert describe userPool return object to updateUserpool input
    const userPoolParams = userPoolConfig.UserPool;
    delete userPoolParams.Id;
    delete userPoolParams.Name;
    delete userPoolParams.LastModifiedDate;
    delete userPoolParams.CreationDate;
    delete userPoolParams.SchemaAttributes;
    delete userPoolParams.EstimatedNumberOfUsers;
    delete userPoolParams.UsernameConfiguration;
    delete userPoolParams.Arn;
    delete userPoolParams.AdminCreateUserConfig.UnusedAccountValidityDays;
    console.log(userPoolParams);
    lambdaConfig.forEach(lambda => (config[`${lambda.triggerType}`] = lambda.lambdaFunctionArn));
    if (event.RequestType == 'Delete') {
      try {
        const authParams = userPoolParams;
        authParams['UserPoolId'] = userPoolId;
        authParams['LambdaConfig'] = {};
        const result = await cognitoclient.updateUserPool(authParams).promise();
        console.log('delete response data ' + JSON.stringify(result));
        await response.send(event, context, response.SUCCESS, {});
      } catch (err) {
        console.log(err.stack);
        await response.send(event, context, response.FAILED, { err });
      }
    }
    if (event.RequestType == 'Update' || event.RequestType == 'Create') {
      const authParams = userPoolParams;
      authParams['UserPoolId'] = userPoolId;
      authParams['LambdaConfig'] = config;
      console.log(authParams);
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
