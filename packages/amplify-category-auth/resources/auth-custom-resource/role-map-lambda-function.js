const response = require('cfn-response');
const AWS = require('aws-sdk');
exports.handler = (event, context) => {
  if (event.RequestType == 'Delete') {
    response.send(event, context, response.SUCCESS, { message: 'Request type delete' });
  }
  if (event.RequestType == 'Create' || event.RequestType == 'Update') {
    let { identityPoolId, appClientID, appClientIDWeb, userPoolId, region } = event.ResourceProperties;
    try {
      const cognitoidentity = new AWS.CognitoIdentity();
      let params = {
        IdentityPoolId: identityPoolId,
        Roles: {
          authenticated: event.ResourceProperties.AuthRoleArn,
          unauthenticated: event.ResourceProperties.UnauthRoleArn,
        },
        RoleMappings: {},
      };
      if (appClientIDWeb) {
        params.RoleMappings[`cognito-idp.${region}.amazonaws.com/${userPoolId}:${appClientIDWeb}`] = {
          Type: 'Token',
          AmbiguousRoleResolution: 'AuthenticatedRole',
        };
      }
      if (appClientID) {
        params.RoleMappings[`cognito-idp.${region}.amazonaws.com/${userPoolId}:${appClientID}`] = {
          Type: 'Token',
          AmbiguousRoleResolution: 'AuthenticatedRole',
        };
      }
      cognitoidentity.setIdentityPoolRoles(params).promise();
      response.send(event, context, response.SUCCESS, { message: 'Successfully updated identity pool.' });
    } catch (err) {
      response.send(event, context, response.FAILED, { message: 'Error updating identity pool' });
    }
  }
};
