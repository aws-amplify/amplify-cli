const response = require('cfn-response');
const aws = require('aws-sdk');
const identity = new aws.CognitoIdentityServiceProvider();

exports.handler = (event, context) => {
  const userPoolId = event.ResourceProperties.userPoolId;
  const inputDomainName = event.ResourceProperties.hostedUIDomainName;

  let deleteUserPoolDomain = (domainName) => {
    let params = { Domain: domainName, UserPoolId: userPoolId };
    return identity.deleteUserPoolDomain(params).promise();
  };

  deleteUserPoolDomain(inputDomainName)
    .then(() => {
      response.send(event, context, response.SUCCESS);
    })
    .catch((err) => {
      console.log(err);

      if (err.name === 'NotFoundException') {
        return response.send(event, context, response.SUCCESS);
      }

      response.send(event, context, response.FAILED, { err });
    });
};
