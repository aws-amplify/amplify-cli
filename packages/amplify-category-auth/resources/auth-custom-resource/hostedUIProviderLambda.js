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

    const deleteSuccessOrNotFound = (promiseResult) => {
      return promiseResult.status === 'fulfilled' || promiseResult.reason.toString().match(/NotFoundException/);
    };

    const providerPromises = [];

    hostedUIProviderMeta.forEach(({ ProviderName }) => providerPromises.push(deleteIdentityProvider(ProviderName)));

    Promise.allSettled(providerPromises)
      .then((results) => {
        if (results.every(deleteSuccessOrNotFound)) {
          response.send(event, context, response.SUCCESS);
        } else {
          const firstFailure = results.find((result) => result.status === 'rejected');
          response.send(event, context, response.FAILED, firstFailure);
        }
      });
  } catch (err) {
    console.log(err.stack);
    response.send(event, context, response.FAILED, { err });
  }
};
