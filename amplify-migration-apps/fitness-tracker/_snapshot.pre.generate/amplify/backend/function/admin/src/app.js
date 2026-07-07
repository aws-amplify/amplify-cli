const express = require('express');
const bodyParser = require('body-parser');
const awsServerlessExpressMiddleware = require('aws-serverless-express/middleware');
const { CognitoIdentityProviderClient, ListUsersCommand } = require('@aws-sdk/client-cognito-identity-provider');

const app = express();
app.use(bodyParser.json());
app.use(awsServerlessExpressMiddleware.eventContext());

app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', '*');
  next();
});

const cognitoClient = new CognitoIdentityProviderClient({ region: process.env.REGION });

app.get('/admin/users', async function (req, res) {
  try {
    const command = new ListUsersCommand({
      UserPoolId: userPoolId(),
    });

    const response = await cognitoClient.send(command);

    const users = response.Users.map((user) => ({
      username: user.Username,
      email: user.Attributes.find((attr) => attr.Name === 'email')?.Value,
      status: user.UserStatus,
      created: user.UserCreateDate,
      enabled: user.Enabled,
    }));

    res.json({ users, count: users.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, function () {
  console.log('App started');
});

module.exports = app;

// lookup to support easily recreating envs since the middle part of the
// env name changes every time.
function userPoolId() {
  const names = Object.keys(process.env).filter((n) => n.startsWith('AUTH_FITNESSTRACKER') && n.endsWith('_USERPOOLID'));
  if (names.length !== 1) {
    throw new Error(`Unexpected env names: ${names}`);
  }
  return process.env[names[0]];
}
