const response = require('cfn-response');
const aws = require('aws-sdk');
const identity = new aws.CognitoIdentityServiceProvider();

exports.handler = (event, context, callback) => {
  try {
    const userPoolId = event.ResourceProperties.userPoolId;
    let hostedUIProviderMeta = JSON.parse(event.ResourceProperties.hostedUIProviderMeta);

    let deleteIdentityProvider = (providerName) => {
      let params = { ProviderName: providerName, UserPoolId: userPoolId };
      return identity.deleteIdentityProvider(params).promise();
    };

    let providerPromises = [];

    hostedUIProviderMeta.forEach(({ ProviderName }) => providerPromises.push(deleteIdentityProvider(ProviderName)));

    Promise.all(providerPromises)
      .then(() => {
        response.send(event, context, response.SUCCESS, {});
      })
      .catch((err) => {
        console.log(err.stack);
        response.send(event, context, response.FAILED, { err });
      });
  } catch (err) {
    console.log(err.stack);
    response.send(event, context, response.FAILED, { err });
  };
}
