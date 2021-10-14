const response = require('cfn-response');
const aws = require('aws-sdk');
const identity = new aws.CognitoIdentityServiceProvider();
exports.handler = (event, context, callback) => {
  if (event.RequestType == 'Delete') {
    response.send(event, context, response.SUCCESS, {});
  }
  if (event.RequestType == 'Update' || event.RequestType == 'Create') {
    const params = {
      ClientId: event.ResourceProperties.clientId,
      UserPoolId: event.ResourceProperties.userpoolId,
    };
    identity
      .describeUserPoolClient(params)
      .promise()
      .then(res => {
        response.send(event, context, response.SUCCESS, { appSecret: res.UserPoolClient.ClientSecret });
      })
      .catch(err => {
        response.send(event, context, response.FAILED, { err });
      });
  }
};
