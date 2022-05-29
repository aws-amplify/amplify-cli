const response = require('cfn-response');
const aws = require('aws-sdk');
const identity = new aws.CognitoIdentityServiceProvider();
exports.handler = (event, context, callback) => {
  if (event.RequestType == 'Delete') {
    response.send(event, context, response.SUCCESS, {});
  }
  if (event.RequestType == 'Update' || event.RequestType == 'Create') {
    let totpParams = {};
    try {
      totpParams = {
        UserPoolId: event.ResourceProperties.userPoolId,
        MfaConfiguration: event.ResourceProperties.mfaConfiguration,
        SmsMfaConfiguration: {
          SmsAuthenticationMessage: event.ResourceProperties.smsAuthenticationMessage,
          SmsConfiguration: {
            SnsCallerArn: event.ResourceProperties.smsConfigCaller,
            ExternalId: event.ResourceProperties.smsConfigExternalId,
          },
        },
        SoftwareTokenMfaConfiguration: { Enabled: event.ResourceProperties.totpEnabled.toLowerCase() === true ? true : false },
      };
      console.log(totpParams);
    } catch (e) {
      response.send(event, context, response.FAILED, { e });
    }
    identity
      .setUserPoolMfaConfig(totpParams)
      .promise()
      .then(res => {
        response.send(event, context, response.SUCCESS, { res });
      })
      .catch(err => {
        response.send(event, context, response.FAILED, { err });
      });
  }
};
