const response = require('cfn-response');
const {
  CognitoIdentityProviderClient,
  CreateIdentityProviderCommand,
  DeleteIdentityProviderCommand,
  ListIdentityProvidersCommand,
  UpdateIdentityProviderCommand,
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
    console.log(err.stack);
    response.send(event, context, response.FAILED, { err });
  }
}

async function handleEvent(event) {
  const userPoolId = event.ResourceProperties.userPoolId;
  const hostedUIProviderMeta = JSON.parse(event.ResourceProperties.hostedUIProviderMeta);
  const hostedUIProviderCreds = JSON.parse(event.ResourceProperties.hostedUIProviderCreds);
  const hasHostedUIProviderCreds = hostedUIProviderCreds.length && hostedUIProviderCreds.length > 0;
  if (hasHostedUIProviderCreds && (event.RequestType === 'Update' || event.RequestType === 'Create')) {
    const listIdentityProvidersResponse = await identity.send(
      new ListIdentityProvidersCommand({
        UserPoolId: userPoolId,
        MaxResults: 60,
      }),
    );
    console.log(listIdentityProvidersResponse);
    const providerList = listIdentityProvidersResponse.Providers.map((provider) => provider.ProviderName);
    const providerListInParameters = hostedUIProviderMeta.map((provider) => provider.ProviderName);
    for (const providerMetadata of hostedUIProviderMeta) {
      if (providerList.indexOf(providerMetadata.ProviderName) > -1) {
        await updateIdentityProvider(providerMetadata.ProviderName, hostedUIProviderMeta, hostedUIProviderCreds, userPoolId);
      } else {
        await createIdentityProvider(providerMetadata.ProviderName, hostedUIProviderMeta, hostedUIProviderCreds, userPoolId);
      }
    }
    for (const provider of providerList) {
      if (providerListInParameters.indexOf(provider) < 0) {
        await deleteIdentityProvider(provider, userPoolId);
      }
    }
  }
}

function getRequestParams(providerName, hostedUIProviderMeta, hostedUIProviderCreds, userPoolId) {
  const providerMeta = hostedUIProviderMeta.find((provider) => provider.ProviderName === providerName);
  const providerCreds = hostedUIProviderCreds.find((provider) => provider.ProviderName === providerName);
  let requestParams = {
    ProviderName: providerMeta.ProviderName,
    UserPoolId: userPoolId,
    AttributeMapping: providerMeta.AttributeMapping,
  };
  if (providerMeta.ProviderName === 'SignInWithApple') {
    if (providerCreds.client_id && providerCreds.team_id && providerCreds.key_id && providerCreds.private_key) {
      requestParams.ProviderDetails = {
        client_id: providerCreds.client_id,
        team_id: providerCreds.team_id,
        key_id: providerCreds.key_id,
        private_key: providerCreds.private_key,
        authorize_scopes: providerMeta.authorize_scopes,
      };
    } else {
      requestParams = null;
    }
  } else {
    if (providerCreds.client_id && providerCreds.client_secret) {
      requestParams.ProviderDetails = {
        client_id: providerCreds.client_id,
        client_secret: providerCreds.client_secret,
        authorize_scopes: providerMeta.authorize_scopes,
      };
    } else {
      requestParams = null;
    }
  }
  return requestParams;
}

async function createIdentityProvider(providerName, hostedUIProviderMeta, hostedUIProviderCreds, userPoolId) {
  const requestParams = getRequestParams(providerName, hostedUIProviderMeta, hostedUIProviderCreds, userPoolId);
  if (!requestParams) {
    return;
  }
  requestParams.ProviderType = requestParams.ProviderName;
  await identity.send(new CreateIdentityProviderCommand(requestParams));
}

async function updateIdentityProvider(providerName, hostedUIProviderMeta, hostedUIProviderCreds, userPoolId) {
  const requestParams = getRequestParams(providerName, hostedUIProviderMeta, hostedUIProviderCreds, userPoolId);
  if (!requestParams) {
    return;
  }
  await identity.send(new UpdateIdentityProviderCommand(requestParams));
}

async function deleteIdentityProvider(providerName, userPoolId) {
  const params = { ProviderName: providerName, UserPoolId: userPoolId };
  await identity.send(new DeleteIdentityProviderCommand(params));
}
