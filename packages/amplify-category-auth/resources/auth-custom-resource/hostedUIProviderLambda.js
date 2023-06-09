const response = require('cfn-response');
const aws = require('aws-sdk');

const identity = new aws.CognitoIdentityServiceProvider();

exports.handler = (event, context) => {
  try {
    const userPoolId = event.ResourceProperties.userPoolId;
    const hostedUIProviderMeta = JSON.parse(event.ResourceProperties.hostedUIProviderMeta);

    const deleteIdentityProvider = (providerName) => {
      const params = { ProviderName: providerName, UserPoolId: userPoolId };
      return identity.deleteIdentityProvider(params).promise();
    };

    // Only 1 update can be sent at a time, so the SDK calls need to be run synchronously
    hostedUIProviderMeta.forEach(async ({ ProviderName }) => {
      await deleteIdentityProvider(ProviderName).catch((error) => {
        if (!error?.code?.toString()?.match(/NotFoundException/)) {
          response.send(event, context, response.FAILED, error);
          return error;
        } else {
          console.log('Not Found', ProviderName);
        }
      });
    });

    response.send(event, context, response.SUCCESS);
  } catch (err) {
    console.log(err.stack);
    response.send(event, context, response.FAILED, { err });
  }
};
