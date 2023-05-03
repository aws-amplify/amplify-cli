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

    const providerPromises = [];

    hostedUIProviderMeta.forEach(({ ProviderName }) => providerPromises.push(deleteIdentityProvider(ProviderName)));

    Promise.all(providerPromises)
      .then(() => {
        response.send(event, context, response.SUCCESS);
      })
      .catch((err) => {
        console.log(err.stack);

        if (err.name === 'NotFoundException') {
          response.send(event, context, response.SUCCESS);
          return;
        }

        response.send(event, context, response.FAILED, { err });
      });
  } catch (err) {
    console.log(err.stack);
    response.send(event, context, response.FAILED, { err });
  }
};
