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

  try {
    await cognitoidentityserviceprovider.getGroup(groupParams).promise();
  } catch (e) {
    await cognitoidentityserviceprovider.createGroup(groupParams).promise();
  }

  /**
   * For some reason, naively returning a value / Promise or throwing an error
   * will not work as it is specified in the Lambda docs:
   * @see https://docs.aws.amazon.com/lambda/latest/dg/nodejs-handler.html
   *
   * This causes an "Invalid JSON" error which can, so far, only be worked
   * around by resolving with deprecated non-async `callback`:
   * @see https://github.com/aws-amplify/amplify-cli/issues/2735
   * @see https://github.com/aws-amplify/amplify-cli/issues/4341
   * @see https://github.com/aws-amplify/amplify-cli/issues/7179
   */
  try {
    await cognitoidentityserviceprovider.adminAddUserToGroup(addUserParams).promise();
    callback(null, event);
  } catch (error) {
    callback(new Error(error));
  }
};
