const response = require('cfn-response');
const aws = require('aws-sdk');
const identity = new aws.CognitoIdentityServiceProvider();
exports.handler = (event, context, callback) => {
  try {
    const userPoolId = event.ResourceProperties.userPoolId;
    let webClientId = event.ResourceProperties.webClientId;
    let nativeClientId = event.ResourceProperties.nativeClientId;
    let hostedUIProviderMeta = JSON.parse(event.ResourceProperties.hostedUIProviderMeta);
    let oAuthMetadata = JSON.parse(event.ResourceProperties.oAuthMetadata);
    let providerList = hostedUIProviderMeta.map(provider => provider.ProviderName);
    providerList.push('COGNITO');
    if (event.RequestType == 'Delete') {
      response.send(event, context, response.SUCCESS, {});
    }
    if (event.RequestType == 'Update' || event.RequestType == 'Create') {
      let params = {
        UserPoolId: userPoolId,
        AllowedOAuthFlows: oAuthMetadata.AllowedOAuthFlows,
        AllowedOAuthFlowsUserPoolClient: true,
        AllowedOAuthScopes: oAuthMetadata.AllowedOAuthScopes,
        CallbackURLs: oAuthMetadata.CallbackURLs,
        LogoutURLs: oAuthMetadata.LogoutURLs,
        SupportedIdentityProviders: providerList,
      };
      console.log(params);
      let updateUserPoolClientPromises = [];
      params.ClientId = webClientId;
      updateUserPoolClientPromises.push(identity.updateUserPoolClient(params).promise());
      params.ClientId = nativeClientId;
      updateUserPoolClientPromises.push(identity.updateUserPoolClient(params).promise());
      Promise.all(updateUserPoolClientPromises)
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
