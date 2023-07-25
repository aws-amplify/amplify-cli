const response = require('cfn-response');
const { CognitoIdentityProviderClient, SetUserPoolMfaConfigCommand } = require('@aws-sdk/client-cognito-identity-provider');
const identity = new CognitoIdentityProviderClient({});

exports.handler = (event, context) => {
  // Don't return promise, response.send() marks context as done internally
  const ignoredPromise = handleEvent(event, context);
};

async function handleEvent(event, context) {
  try {
    if (event.RequestType === 'Update' || event.RequestType === 'Create') {
      const totpParams = {
        UserPoolId: event.ResourceProperties.userPoolId,
        MfaConfiguration: event.ResourceProperties.mfaConfiguration,
        SmsMfaConfiguration: {
          SmsAuthenticationMessage: event.ResourceProperties.smsAuthenticationMessage,
          SmsConfiguration: {
            SnsCallerArn: event.ResourceProperties.smsConfigCaller,
            ExternalId: event.ResourceProperties.smsConfigExternalId,
          },
        },
        SoftwareTokenMfaConfiguration: { Enabled: event.ResourceProperties.totpEnabled.toLowerCase() === 'true' },
      };
      console.log(totpParams);

      await identity.send(new SetUserPoolMfaConfigCommand(totpParams));
    }
    response.send(event, context, response.SUCCESS, {});
  } catch (e) {
    response.send(event, context, response.FAILED, { e });
  }
}
