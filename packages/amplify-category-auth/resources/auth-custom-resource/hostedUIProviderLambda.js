const response = require('cfn-response');
const aws = require('aws-sdk');
const identity = new aws.CognitoIdentityServiceProvider();
exports.handler = (event, context, callback) => {
  try {
    const userPoolId = event.ResourceProperties.userPoolId;
    let hostedUIProviderMeta = JSON.parse(event.ResourceProperties.hostedUIProviderMeta);
    let hostedUIProviderCreds = JSON.parse(event.ResourceProperties.hostedUIProviderCreds);
    if (hostedUIProviderCreds.length === 0) {
      response.send(event, context, response.SUCCESS, {});
    }
    if (event.RequestType == 'Delete') {
      response.send(event, context, response.SUCCESS, {});
    }
    if (event.RequestType == 'Update' || event.RequestType == 'Create') {
      let getRequestParams = providerName => {
        let providerMetaIndex = hostedUIProviderMeta.findIndex(provider => provider.ProviderName === providerName);
        let providerMeta = hostedUIProviderMeta[providerMetaIndex];
        let providerCredsIndex = hostedUIProviderCreds.findIndex(provider => provider.ProviderName === providerName);
        let providerCreds = hostedUIProviderCreds[providerCredsIndex];
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
          requestParams.ProviderDetails = {
            client_id: providerCreds.client_id,
            client_secret: providerCreds.client_secret,
            authorize_scopes: providerMeta.authorize_scopes,
          };
        }
        return requestParams;
      };
      let createIdentityProvider = providerName => {
        let requestParams = getRequestParams(providerName);
        if (!requestParams) {
          return Promise.resolve();
        }
        requestParams.ProviderType = requestParams.ProviderName;
        return identity.createIdentityProvider(requestParams).promise();
      };
      let updateIdentityProvider = providerName => {
        let requestParams = getRequestParams(providerName);
        if (!requestParams) {
          return Promise.resolve();
        }
        return identity.updateIdentityProvider(requestParams).promise();
      };
      let deleteIdentityProvider = providerName => {
        let params = { ProviderName: providerName, UserPoolId: userPoolId };
        return identity.deleteIdentityProvider(params).promise();
      };
      let providerPromises = [];
      identity
        .listIdentityProviders({ UserPoolId: userPoolId, MaxResults: 60 })
        .promise()
        .then(result => {
          console.log(result);
          let providerList = result.Providers.map(provider => provider.ProviderName);
          let providerListInParameters = hostedUIProviderMeta.map(provider => provider.ProviderName);
          hostedUIProviderMeta.forEach(providerMetadata => {
            if (providerList.indexOf(providerMetadata.ProviderName) > 1) {
              providerPromises.push(updateIdentityProvider(providerMetadata.ProviderName));
            } else {
              providerPromises.push(createIdentityProvider(providerMetadata.ProviderName));
            }
          });
          providerList.forEach(provider => {
            if (providerListInParameters.indexOf(provider) < 0) {
              providerPromises.push(deleteIdentityProvider(provider));
            }
          });
          return Promise.all(providerPromises);
        })
        .then(() => {
          response.send(event, context, response.SUCCESS, {});
        })
        .catch(err => {
          console.log(err.stack);
          response.send(event, context, response.FAILED, { err });
        });
    }
  } catch (err) {
    console.log(err.stack);
    response.send(event, context, response.FAILED, { err });
  }
};
