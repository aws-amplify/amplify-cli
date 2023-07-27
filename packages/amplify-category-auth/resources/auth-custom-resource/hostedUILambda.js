const response = require('cfn-response');
const {
  CognitoIdentityProviderClient,
  CreateUserPoolDomainCommand,
  DeleteUserPoolDomainCommand,
  DescribeUserPoolCommand,
  DescribeUserPoolDomainCommand,
} = require('@aws-sdk/client-cognito-identity-provider');
const identity = new CognitoIdentityProviderClient({});

exports.handler = (event, context) => {
  // Don't return promise, response.send() marks context as done internally
  void tryHandleEvent(event, context);
};

async function tryHandleEvent(event, context) {
  try {
    await handleEvent(event);
    response.send(event, context, response.SUCCESS, {});
  } catch (err) {
    console.log(err);
    response.send(event, context, response.FAILED, { err });
  }
}

async function handleEvent(event) {
  const userPoolId = event.ResourceProperties.userPoolId;
  const inputDomainName = event.ResourceProperties.hostedUIDomainName;
  if (event.RequestType === 'Delete') {
    await deleteUserPoolDomain(inputDomainName, userPoolId);
  } else if (event.RequestType === 'Update' || event.RequestType === 'Create') {
    await createOrUpdateDomain(inputDomainName, userPoolId);
  }
}

async function checkDomainAvailability(domainName) {
  const params = { Domain: domainName };
  try {
    const res = await identity.send(new DescribeUserPoolDomainCommand(params));
    return !(res.DomainDescription && res.DomainDescription.UserPoolId);
  } catch (err) {
    return false;
  }
}

async function deleteUserPoolDomain(domainName, userPoolId) {
  const params = { Domain: domainName, UserPoolId: userPoolId };
  await identity.send(new DeleteUserPoolDomainCommand(params));
}

async function createUserPoolDomain(domainName, userPoolId) {
  const params = {
    Domain: domainName,
    UserPoolId: userPoolId,
  };
  await identity.send(new CreateUserPoolDomainCommand(params));
}

async function createOrUpdateDomain(inputDomainName, userPoolId) {
  const result = await identity.send(new DescribeUserPoolCommand({ UserPoolId: userPoolId }));
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
