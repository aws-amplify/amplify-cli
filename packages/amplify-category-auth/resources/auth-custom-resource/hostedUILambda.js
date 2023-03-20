const response = require('cfn-response');
const aws = require('aws-sdk');
const identity = new aws.CognitoIdentityServiceProvider();
exports.handler = (event, context, callback) => {
  const userPoolId = event.ResourceProperties.userPoolId;
  const inputDomainName = event.ResourceProperties.hostedUIDomainName;

  let deleteUserPoolDomain = (domainName) => {
    let params = { Domain: domainName, UserPoolId: userPoolId };
    return identity.deleteUserPoolDomain(params).promise();
  };

  deleteUserPoolDomain(inputDomainName)
    .then(() => {
      response.send(event, context, response.SUCCESS, {});
    })
    .catch((err) => {
      console.log(err);
      response.send(event, context, response.FAILED, { err });
    });
};
