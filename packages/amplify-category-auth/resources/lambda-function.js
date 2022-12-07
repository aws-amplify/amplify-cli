const response = require('cfn-response');
const aws = require('aws-sdk');

exports.handler = async function (event, context) {
  const physicalResourceId = event.RequestType === 'Update' ? event.PhysicalResourceId : `${event.LogicalResourceId}-${event.ResourceProperties.userpoolId}`;

  try {
    const userPoolId = event.ResourceProperties.userpoolId;
    const { lambdaConfig } = event.ResourceProperties;
    const config = {};
    const cognitoClient = new aws.CognitoIdentityServiceProvider();
    const userPoolConfig = await cognitoClient.describeUserPool({ UserPoolId: userPoolId }).promise();
    const userPoolParams = userPoolConfig.UserPool;
    // update userPool params

    const updateUserPoolConfig = {
      UserPoolId: userPoolParams.Id,
      Policies: userPoolParams.Policies,
      SmsVerificationMessage: userPoolParams.SmsVerificationMessage,
      AccountRecoverySetting: userPoolParams.AccountRecoverySetting,
      AdminCreateUserConfig: userPoolParams.AdminCreateUserConfig,
      AutoVerifiedAttributes: userPoolParams.AutoVerifiedAttributes,
      EmailConfiguration: userPoolParams.EmailConfiguration,
      EmailVerificationMessage: userPoolParams.EmailVerificationMessage,
      EmailVerificationSubject: userPoolParams.EmailVerificationSubject,
      VerificationMessageTemplate: userPoolParams.VerificationMessageTemplate,
      SmsAuthenticationMessage: userPoolParams.SmsAuthenticationMessage,
      MfaConfiguration: userPoolParams.MfaConfiguration,
      DeviceConfiguration: userPoolParams.DeviceConfiguration,
      SmsConfiguration: userPoolParams.SmsConfiguration,
      UserPoolTags: userPoolParams.UserPoolTags,
      UserPoolAddOns: userPoolParams.UserPoolAddOns,
    };

    // removing undefined keys
    Object.keys(updateUserPoolConfig).forEach(key => updateUserPoolConfig[key] === undefined && delete updateUserPoolConfig[key]);

    /* removing UnusedAccountValidityDays as deprecated
    InvalidParameterException: Please use TemporaryPasswordValidityDays in PasswordPolicy instead of UnusedAccountValidityDays
    */
    if (updateUserPoolConfig.AdminCreateUserConfig && updateUserPoolConfig.AdminCreateUserConfig.UnusedAccountValidityDays) {
      delete updateUserPoolConfig.AdminCreateUserConfig.UnusedAccountValidityDays;
    }
    lambdaConfig.forEach(lambda => (config[`${lambda.triggerType}`] = lambda.lambdaFunctionArn));
    if (event.RequestType === 'Delete') {
      try {
        updateUserPoolConfig.LambdaConfig = {};
        console.log(`${event.RequestType}:`, JSON.stringify(updateUserPoolConfig));
        const result = await cognitoClient.updateUserPool(updateUserPoolConfig).promise();
        console.log(`delete response data ${JSON.stringify(result)}`);
        await response.send(event, context, response.SUCCESS, {}, physicalResourceId);
      } catch (err) {
        console.log(err.stack);
        await response.send(event, context, response.FAILED, { err }, physicalResourceId);
      }
    }
    if (event.RequestType === 'Update' || event.RequestType === 'Create') {
      updateUserPoolConfig.LambdaConfig = config;
      try {
        const result = await cognitoClient.updateUserPool(updateUserPoolConfig).promise();
        console.log(`createOrUpdate response data ${JSON.stringify(result)}`);
        await response.send(event, context, response.SUCCESS, {}, physicalResourceId);
      } catch (err) {
        console.log(err.stack);
        await response.send(event, context, response.FAILED, { err }, physicalResourceId);
      }
    }
  } catch (err) {
    console.log(err.stack);
    await response.send(event, context, response.FAILED, { err }, physicalResourceId);
  }
};
