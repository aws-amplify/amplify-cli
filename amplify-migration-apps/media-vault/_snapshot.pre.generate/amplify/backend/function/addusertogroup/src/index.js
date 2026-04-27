const { CognitoIdentityProviderClient, AdminAddUserToGroupCommand } = require('@aws-sdk/client-cognito-identity-provider');

const USER_POOL_ID = userPoolId();

exports.handler = async (event) => {
  console.log(`EVENT: ${JSON.stringify(event)}`);

  const { userSub, group } = event.arguments;

  const cognitoClient = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION || 'us-east-1' });

  await cognitoClient.send(
    new AdminAddUserToGroupCommand({
      Username: userSub,
      UserPoolId: USER_POOL_ID,
      GroupName: group,
    }),
  );

  return { statusCode: 200, message: `User ${userSub} added to group ${group}` };
};

// lookup to support easily recreating envs since the middle part of the
// env name changes every time.
function userPoolId() {
  const names = Object.keys(process.env).filter((n) => n.startsWith('AUTH_MEDIAVAULT') && n.endsWith('_USERPOOLID'));
  if (names.length !== 1) {
    throw new Error(`Unexpected env names: ${names}`);
  }
  return process.env[names[0]];
}
