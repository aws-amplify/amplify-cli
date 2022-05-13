const response = require('cfn-response');
const aws = require('aws-sdk');
const identity = new aws.CognitoIdentityServiceProvider();
const ssm = new aws.SSM();

exports.handler = async(event, context) => {
  console.log(event);
  console.log("evet  started");
  try {
    const userPoolId = event.ResourceProperties.userPoolId;
    let responseData;
    const parameter = await ssm.getParameter({
    Name: process.env['hostedUIProviderCreds'],
    WithDecryption: true,
  }).promise();
    let hostedUIProviderMeta = JSON.parse(event.ResourceProperties.hostedUIProviderMeta);
    let hostedUIProviderCreds = JSON.parse(parameter.Parameter.Value);
    if (event.RequestType == 'Delete') {
      response.send(event, context, response.SUCCESS, {});
    }
    if (event.RequestType == 'Update' || event.RequestType == 'Create') {
      console.log(event.RequestType)
      const result = await identity.listIdentityProviders({ UserPoolId: userPoolId, MaxResults: 60 }).promise();
      let providerList = result.Providers.map(provider => provider.ProviderName);
      let providerListInParameters = hostedUIProviderMeta.map(provider => provider.ProviderName);
      for await (const providerMetadata of hostedUIProviderMeta){
        if (providerList.indexOf(providerMetadata.ProviderName) > -1) {
          console.log("update")
          responseData = await updateIdentityProvider(providerMetadata.ProviderName,userPoolId, hostedUIProviderMeta, hostedUIProviderCreds);
        } else {
          console.log("create")
          responseData = await createIdentityProvider(providerMetadata.ProviderName,userPoolId, hostedUIProviderMeta, hostedUIProviderCreds);
        }
      };
      for await (const provider of providerList){
        if (providerListInParameters.indexOf(provider) < 0) {
          console.log("delete")
          responseData = await deleteIdentityProvider(provider,userPoolId);
        }
      };
      console.log(responseData);
      await response.send(event, context, response.SUCCESS, {});
    }
  } catch (err) {
    console.log(err.stack);
    await response.send(event, context, response.FAILED, { err });
  }
};

let getRequestParams = (providerName,userPoolId, hostedUIProviderMeta, hostedUIProviderCreds) => {
  console.log('getRequestParams enter');
  let providerMetaIndex = hostedUIProviderMeta.findIndex(provider => provider.ProviderName === providerName);
  let providerMeta = hostedUIProviderMeta[providerMetaIndex];
  let providerCredsIndex = hostedUIProviderCreds.findIndex(provider => provider.ProviderName === providerName);
  let providerCreds = hostedUIProviderCreds[providerCredsIndex];
  let requestParams = {
    ProviderName: providerMeta.ProviderName,
    UserPoolId: userPoolId,
    AttributeMapping: providerMeta.AttributeMapping,
  };
    console.log(requestParams);
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
  console.log('getRequestParams exit');
  console.log(requestParams);
  return requestParams;
};

const deleteIdentityProvider = async (providerName, userPoolId) => {
  let params = { ProviderName: providerName, UserPoolId: userPoolId };
  return identity.deleteIdentityProvider(params).promise();
};


const createIdentityProvider = async (providerName, userPoolId, hostedUIProviderMeta, hostedUIProviderCreds) => {
  console.log('createIdentity');
  let requestParams = getRequestParams(providerName, userPoolId, hostedUIProviderMeta, hostedUIProviderCreds);
  if (!requestParams) {
    return;
  }
  requestParams.ProviderType = requestParams.ProviderName;
    console.log('createIdentityEnded');
  console.log(requestParams);
  return identity.createIdentityProvider(requestParams).promise();
};

const updateIdentityProvider = async (providerName, userPoolId, hostedUIProviderMeta, hostedUIProviderCreds) => {
  let requestParams = getRequestParams(providerName, userPoolId, hostedUIProviderMeta, hostedUIProviderCreds);
  if (!requestParams) {
    return;
  }
  return identity.updateIdentityProvider(requestParams).promise();
};
