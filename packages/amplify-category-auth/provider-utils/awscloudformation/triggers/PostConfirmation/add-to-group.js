exports.handler = (event, context) => {
  const aws = require('aws-sdk');
  const cognitoidentityserviceprovider = new aws.CognitoIdentityServiceProvider({ apiVersion: '2016-04-18' });

  const params = {
    GroupName: 'yourGroup',
    UserPoolId: 'yourUserPoolId',
    Username: event.userName,
  };

  cognitoidentityserviceprovider.adminAddUserToGroup(params, (err) => {
    if (err) console.log('Error');
    else console.log('Success');
  });

  context.succeed(event);
};
