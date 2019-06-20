/* eslint-disable-line */ const aws = require('aws-sdk');

exports.handler = (event, context, callback) => {
  const cognitoidentityserviceprovider = new aws.CognitoIdentityServiceProvider({ apiVersion: '2016-04-18' });
  const params = {
    GroupName: process.env.GROUP,
    UserPoolId: event.userPoolId,
    Username: event.userName,
  };

  cognitoidentityserviceprovider.adminAddUserToGroup(params, (err) => {
    if (err) {
      callback(err);
    }
    callback(null, event);
  });
};
