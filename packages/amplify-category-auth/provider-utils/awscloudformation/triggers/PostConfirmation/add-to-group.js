/* eslint-disable-line */ const aws = require('aws-sdk');

exports.handler = async (event, context, callback) => {
  const cognitoidentityserviceprovider = new aws.CognitoIdentityServiceProvider({ apiVersion: '2016-04-18' });
  const groupParams = {
    GroupName: process.env.GROUP,
    UserPoolId: event.userPoolId,
  };

  const addUserParams = {
    GroupName: process.env.GROUP,
    UserPoolId: event.userPoolId,
    Username: event.userName,
  };

  await cognitoidentityserviceprovider.getGroup(groupParams, async (err) => {
    if (err) {
      await cognitoidentityserviceprovider.createGroup(groupParams).promise();
    }
  }).promise();


  cognitoidentityserviceprovider.adminAddUserToGroup(addUserParams, (err) => {
    if (err) {
      callback(err);
    }
    callback(null, event);
  });
};
