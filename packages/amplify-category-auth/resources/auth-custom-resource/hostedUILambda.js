const response = require('cfn-response');
const aws = require('aws-sdk');
const identity = new aws.CognitoIdentityServiceProvider();

exports.handler = (event, context) => {
  // Don't return promise, response.send() marks context as done internally
  const ignoredPromise = handleEvent(event, context);
};

async function checkDomainAvailability(domainName) {
  const params = { Domain: domainName };
  try {
    const res = await identity.describeUserPoolDomain(params).promise();
    if (res.DomainDescription && res.DomainDescription.UserPool) {
      return false;
    }
    return true;
  } catch (err) {
    return false;
  }
}

async function deleteUserPoolDomain(domainName, userPoolId) {
  const params = { Domain: domainName, UserPoolId: userPoolId };
  await identity.deleteUserPoolDomain(params).promise();
}

async function createUserPoolDomain(domainName, userPoolId) {
  const params = {
    Domain: domainName,
    UserPoolId: userPoolId,
  };
  await identity.createUserPoolDomain(params).promise();
}

async function createOrUpdateDomain(inputDomainName, userPoolId) {
  const result = await identity.describeUserPool({ UserPoolId: userPoolId }).promise();
  if (result.UserPool.Domain === inputDomainName) {
    // if existing domain is same as input domain do nothing.
    return;
  }
  if (inputDomainName) {
    // create new or replace existing domain.
    const isDomainAvailable = await checkDomainAvailability(inputDomainName);
    if (isDomainAvailable) {
      if (result.UserPool.Domain) {
        await deleteUserPoolDomain(result.UserPool.Domain, userPoolId);
      }
      await createUserPoolDomain(inputDomainName, userPoolId);
    } else {
      throw new Error('Domain not available');
    }
  } else if (result.UserPool.Domain) {
    // if input domain is undefined delete existing domain if exists.
    await deleteUserPoolDomain(result.UserPool.Domain, userPoolId);
  }
}

async function handleEvent(event, context) {
  try {
    const userPoolId = event.ResourceProperties.userPoolId;
    const inputDomainName = event.ResourceProperties.hostedUIDomainName;
    if (event.RequestType === 'Delete') {
      await deleteUserPoolDomain(inputDomainName, userPoolId);
    } else if (event.RequestType === 'Update' || event.RequestType === 'Create') {
      await createOrUpdateDomain(inputDomainName, userPoolId);
    }
    response.send(event, context, response.SUCCESS, {});
  } catch (err) {
    console.log(err);
    response.send(event, context, response.FAILED, { err });
  }
}
