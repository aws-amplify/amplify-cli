const response = require('cfn-response');
const aws = require('aws-sdk');

const { deleteUserPoolDomain } = new aws.CognitoIdentityServiceProvider();

exports.handler = (event, context) => {
  // Don't return promise, response.send() marks context as done internally
  const ignoredPromise = handleEvent(event, context);
};

async function handleEvent(event, context) {
  const userPoolId = event.ResourceProperties.userPoolId;
  const inputDomainName = event.ResourceProperties.hostedUIDomainName;

  try {
    const params = { Domain: inputDomainName, UserPoolId: userPoolId };
    await deleteUserPoolDomain(params).promise();
    response.send(event, context, response.SUCCESS);
  } catch (err) {
    if (err.name !== 'NotFoundException' && err.name !== 'InvalidParameterException') {
      response.send(event, context, response.FAILED, { err });
    } else {
      response.send(event, context, response.SUCCESS);
    }
  }
}
