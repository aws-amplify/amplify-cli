/* eslint-disable-line */ const aws = require('aws-sdk');

exports.handler = (event, context, callback) => {
  const cognitoidentityserviceprovider = new aws.CognitoIdentityServiceProvider({ apiVersion: '2016-04-18' });

  const params = {
    GroupName: 'TestGroup',
    UserPoolId: 'us-west-2_WDMREigel',
    Username: 'dnnoyes3',
  };

  cognitoidentityserviceprovider.adminAddUserToGroup(params, (err) => {
    if (err) {
      callback(err);
    }
    callback(null, event);
  });
};
