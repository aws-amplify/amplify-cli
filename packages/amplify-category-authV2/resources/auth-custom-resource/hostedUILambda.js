const response = require('cfn-response');
const aws = require('aws-sdk');
const identity = new aws.CognitoIdentityServiceProvider();
exports.handler = (event, context, callback) => {
  const userPoolId = event.ResourceProperties.userPoolId;
  const inputDomainName = event.ResourceProperties.hostedUIDomainName;
  let deleteUserPoolDomain = domainName => {
    let params = { Domain: domainName, UserPoolId: userPoolId };
    return identity.deleteUserPoolDomain(params).promise();
  };
  if (event.RequestType == 'Delete') {
    deleteUserPoolDomain(inputDomainName)
      .then(() => {
        response.send(event, context, response.SUCCESS, {});
      })
      .catch(err => {
        console.log(err);
        response.send(event, context, response.FAILED, { err });
      });
  }
  if (event.RequestType == 'Update' || event.RequestType == 'Create') {
    let checkDomainAvailability = domainName => {
      let params = { Domain: domainName };
      return identity
        .describeUserPoolDomain(params)
        .promise()
        .then(res => {
          if (res.DomainDescription && res.DomainDescription.UserPool) {
            return false;
          }
          return true;
        })
        .catch(err => {
          return false;
        });
    };
    let createUserPoolDomain = domainName => {
      let params = { Domain: domainName, UserPoolId: userPoolId };
      return identity.createUserPoolDomain(params).promise();
    };
    identity
      .describeUserPool({ UserPoolId: userPoolId })
      .promise()
      .then(result => {
        if (inputDomainName) {
          if (result.UserPool.Domain === inputDomainName) {
            return;
          } else {
            if (!result.UserPool.Domain) {
              return checkDomainAvailability(inputDomainName).then(isDomainAvailable => {
                if (isDomainAvailable) {
                  return createUserPoolDomain(inputDomainName);
                } else {
                  throw new Error('Domain not available');
                }
              });
            } else {
              return checkDomainAvailability(inputDomainName).then(isDomainAvailable => {
                if (isDomainAvailable) {
                  return deleteUserPoolDomain(result.UserPool.Domain).then(() => createUserPoolDomain(inputDomainName));
                } else {
                  throw new Error('Domain not available');
                }
              });
            }
          }
        } else {
          if (result.UserPool.Domain) {
            return deleteUserPoolDomain(result.UserPool.Domain);
          }
        }
      })
      .then(() => {
        response.send(event, context, response.SUCCESS, {});
      })
      .catch(err => {
        console.log(err);
        response.send(event, context, response.FAILED, { err });
      });
  }
};
