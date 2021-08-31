import { CognitoIdentityServiceProvider } from 'aws-sdk';
import { getProjectMeta, getBackendAmplifyMeta } from 'amplify-e2e-core';
import Amplify, { Auth } from 'aws-amplify';
import fs from 'fs-extra';
import path from 'path';
import AWSAppSyncClient, { AUTH_TYPE } from 'aws-appsync';

const tempPassword = 'tempPassword';

//setupUser will add user to a cognito group and make its status to be "CONFIRMED",
//if groupName is specified, add the user to the group.
export async function setupUser(userPoolId: string, username: string, password: string, groupName?: string) {
  const cognitoClient = getConfiguredCognitoClient();
  await cognitoClient
    .adminCreateUser({
      UserPoolId: userPoolId,
      UserAttributes: [{ Name: 'email', Value: 'username@amazon.com' }],
      Username: username,
      MessageAction: 'SUPPRESS',
      TemporaryPassword: tempPassword,
    })
    .promise();

  await authenticateUser(username, tempPassword, password);

  if (groupName) {
    await cognitoClient
      .adminAddUserToGroup({
        UserPoolId: userPoolId,
        Username: username,
        GroupName: groupName,
      })
      .promise();
  }
}

export async function addUserToGroup(
  cognitoClient: CognitoIdentityServiceProvider,
  userPoolId: string,
  username: string,
  groupName?: string,
) {
  await cognitoClient
    .adminAddUserToGroup({
      UserPoolId: userPoolId,
      Username: username,
      GroupName: groupName,
    })
    .promise();
}

export function getConfiguredCognitoClient(): CognitoIdentityServiceProvider {
  const cognitoClient = new CognitoIdentityServiceProvider({ apiVersion: '2016-04-19', region: process.env.CLI_REGION });

  const awsconfig = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN,
    region: process.env.CLI_REGION,
  };

  cognitoClient.config.update(awsconfig);

  return cognitoClient;
}

export function getConfiguredAppsyncClientCognitoAuth(url: string, region: string, user: any): any {
  return new AWSAppSyncClient({
    url,
    region,
    disableOffline: true,
    auth: {
      type: AUTH_TYPE.AMAZON_COGNITO_USER_POOLS,
      jwtToken: user.signInUserSession.idToken.jwtToken,
    },
  });
}

export function getConfiguredAppsyncClientOIDCAuth(url: string, region: string, user: any): any {
  return new AWSAppSyncClient({
    url,
    region,
    disableOffline: true,
    auth: {
      type: AUTH_TYPE.OPENID_CONNECT,
      jwtToken: user.signInUserSession.idToken.jwtToken,
    },
  });
}

export function getConfiguredAppsyncClientAPIKeyAuth(url: string, region: string, apiKey: string): any {
  return new AWSAppSyncClient({
    url,
    region,
    disableOffline: true,
    auth: {
      type: AUTH_TYPE.API_KEY,
      apiKey,
    },
  });
}

export function getConfiguredAppsyncClientIAMAuth(url: string, region: string): any {
  return new AWSAppSyncClient({
    url,
    region,
    disableOffline: true,
    auth: {
      type: AUTH_TYPE.AWS_IAM,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        sessionToken: process.env.AWS_SESSION_TOKEN,
      },
    },
  });
}

export async function signInUser(username: string, password: string) {
  const user = await Auth.signIn(username, password);
  return user;
}

export function configureAmplify(projectDir: string) {
  const awsconfig = getAWSExports(projectDir);
  Amplify.configure(awsconfig);
  return awsconfig;
}

export function getAWSExports(projectDir: string) {
  const awsExportsFilePath = path.join(projectDir, 'src', 'aws-exports.js');
  let fileContent = fs.readFileSync(awsExportsFilePath).toString();
  fileContent = '{' + fileContent.split('= {')[1].split('};')[0] + '}';
  return JSON.parse(fileContent);
}

export function getUserPoolId(projectDir: string): string {
  const amplifyMeta = getProjectMeta(projectDir);
  const cognitoResource = Object.values(amplifyMeta.auth).find((res: any) => {
    return res.service === 'Cognito';
  }) as any;
  return cognitoResource.output.UserPoolId;
}

export function getCognitoResourceName(projectDir: string): string {
  const amplifyMeta = getBackendAmplifyMeta(projectDir);
  const cognitoResourceName = Object.keys(amplifyMeta.auth).find((key: any) => {
    return amplifyMeta.auth[key].service === 'Cognito';
  }) as any;
  return cognitoResourceName;
}

export function getApiKey(projectDir: string): string {
  const amplifyMeta = getProjectMeta(projectDir);
  const appsyncResource = Object.values(amplifyMeta.api).find((res: any) => {
    return res.service === 'AppSync';
  }) as any;
  return appsyncResource.output.GraphQLAPIKeyOutput;
}

export async function authenticateUser(username: string, tempPassword: string, password: string) {
  const signinResult = await Auth.signIn(username, tempPassword);
  if (signinResult.challengeName === 'NEW_PASSWORD_REQUIRED') {
    const { requiredAttributes } = signinResult.challengeParam; // the array of required attributes, e.g [‘email’, ‘phone_number’]
    await Auth.completeNewPassword(signinResult, password, requiredAttributes);
  }
}

export function getUserPoolIssUrl(projectDir: string) {
  const amplifyMeta = getProjectMeta(projectDir);
  const cognitoResource = Object.values(amplifyMeta.auth).find((res: any) => {
    return res.service === 'Cognito';
  }) as any;

  const userPoolId = cognitoResource.output.UserPoolId;
  const region = amplifyMeta.providers.awscloudformation.Region;

  return `https://cognito-idp.${region}.amazonaws.com/${userPoolId}/`;
}

export function getAppClientIDWeb(projectDir: string) {
  const amplifyMeta = getProjectMeta(projectDir);
  const cognitoResource = Object.values(amplifyMeta.auth).find((res: any) => {
    return res.service === 'Cognito';
  }) as any;

  return cognitoResource.output.AppClientIDWeb;
}
