import { Amplify, Auth } from 'aws-amplify';
import AWSAppSyncClient, { AUTH_TYPE } from 'aws-appsync';
import { CognitoIdentityServiceProvider } from 'aws-sdk';
import fs from 'fs-extra';
import path from 'path';
import { getAwsAndroidConfig, getAwsIOSConfig, getBackendAmplifyMeta, getCLIInputs, getProjectMeta, setCLIInputs } from './projectMeta';
import { getUserPoolClients } from './sdk-calls';
import { AddAuthUserPoolOnlyWithOAuthSettings } from '../categories';

const tempPassword = 'tempPassword1@';

//setupUser will add user to a cognito group and make its status to be "CONFIRMED",
//if groupName is specified, add the user to the group.
export async function setupUser(
  userPoolId: string,
  username: string,
  password: string,
  groupName?: string,
  region?: string,
): Promise<void> {
  const cognitoClient = getConfiguredCognitoClient(region);
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

export async function addUserToGroup(userPoolId: string, username: string, groupName: string, region?: string): Promise<void> {
  const cognitoClient = getConfiguredCognitoClient(region);
  await cognitoClient
    .adminAddUserToGroup({
      UserPoolId: userPoolId,
      Username: username,
      GroupName: groupName,
    })
    .promise();
}

export function getConfiguredCognitoClient(region = process.env.CLI_REGION): CognitoIdentityServiceProvider {
  const cognitoClient = new CognitoIdentityServiceProvider({ apiVersion: '2016-04-19', region });
  const awsconfig = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN,
    region,
  };

  cognitoClient.config.update(awsconfig);

  return cognitoClient;
}

export function getConfiguredAppsyncClientCognitoAuth(url: string, region: string, user: any) {
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

export function getConfiguredAppsyncClientOIDCAuth(url: string, region: string, user: any) {
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

export function getConfiguredAppsyncClientIAMAuth(url: string, region: string) {
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

export async function signOutUser(): Promise<void> {
  await Auth.signOut({ global: true });
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
  const cognitoResource = Object.values<{ service: string; output: { UserPoolId: string } }>(amplifyMeta.auth).find((res) => {
    return res.service === 'Cognito';
  });
  return cognitoResource.output.UserPoolId;
}

export function getHostedUIDomain(projectDir: string): string {
  const amplifyMeta = getProjectMeta(projectDir);
  const cognitoResource = Object.values<{ service: string; output: { HostedUIDomain: string } }>(amplifyMeta.auth).find((res) => {
    return res.service === 'Cognito';
  });
  return cognitoResource.output.HostedUIDomain;
}

export function getCognitoResourceName(projectDir: string): string {
  const amplifyMeta = getBackendAmplifyMeta(projectDir);
  const cognitoResourceName = Object.keys(amplifyMeta.auth).find((key: string) => {
    return amplifyMeta.auth[key].service === 'Cognito';
  });
  return cognitoResourceName;
}

export function getApiKey(projectDir: string): string {
  const amplifyMeta = getProjectMeta(projectDir);
  const appsyncResource = Object.values<{ service: string; output: { GraphQLAPIKeyOutput: string } }>(amplifyMeta.api).find((res) => {
    return res.service === 'AppSync';
  });
  return appsyncResource.output.GraphQLAPIKeyOutput;
}

export async function authenticateUser(username: string, tempPassword: string, password: string) {
  const signinResult = await Auth.signIn(username, tempPassword);
  if (signinResult.challengeName === 'NEW_PASSWORD_REQUIRED') {
    const { requiredAttributes } = signinResult.challengeParam; // the array of required attributes, e.g [‘email’, ‘phone_number’]
    await Auth.completeNewPassword(signinResult, password, requiredAttributes);
  }
}

export function getUserPoolIssUrl(projectDir: string): string {
  const amplifyMeta = getProjectMeta(projectDir);
  const cognitoResource = Object.values<{ service: string; output: { UserPoolId: string } }>(amplifyMeta.auth).find((res) => {
    return res.service === 'Cognito';
  });

  const userPoolId = cognitoResource.output.UserPoolId;
  const region = amplifyMeta.providers.awscloudformation.Region;

  return `https://cognito-idp.${region}.amazonaws.com/${userPoolId}/`;
}

export function getAppClientIDWeb(projectDir: string) {
  const amplifyMeta = getProjectMeta(projectDir);
  const cognitoResource = Object.values<{ service: string; output: { AppClientIDWeb: string } }>(amplifyMeta.auth).find((res) => {
    return res.service === 'Cognito';
  });

  return cognitoResource.output.AppClientIDWeb;
}

/**
 * asserts app client secret in projects files and on cloud
 */
export const assertAppClientSecretInFiles = async (projRoot: string, frontend: 'android' | 'ios'): Promise<void> => {
  let config;
  switch (frontend) {
    case 'android':
      config = await getAwsAndroidConfig(projRoot);
      break;
    case 'ios':
      config = await getAwsIOSConfig(projRoot);
      break;
  }
  const clientSecretInAwsConfig = config.CognitoUserPool.Default.AppClientSecret;
  expect(clientSecretInAwsConfig).toBeDefined();
  const meta = getProjectMeta(projRoot);
  const id = Object.keys(meta.auth)[0];
  const authMeta = meta.auth[id];
  const clientIds = [authMeta.output.AppClientID];
  const clientSecretInMetaFile = authMeta.output.AppClientSecret;
  // compare client secret in meta file and ios config file
  expect(clientSecretInMetaFile).toBeDefined();
  expect(clientSecretInAwsConfig).toEqual(clientSecretInMetaFile);
  const clients = await getUserPoolClients(authMeta.output.UserPoolId, clientIds, meta.providers.awscloudformation.Region);
  expect(clients[0].UserPoolClient.ClientSecret).toBeDefined();
  // compare client secret in meta file with cloud value
  expect(clients[0].UserPoolClient.ClientSecret).toEqual(clientSecretInMetaFile);
};

export const updateCLIParametersToGenerateUserPoolClientSecret = (projRoot: string, resourceName?: string) => {
  if (!resourceName) {
    const meta = getProjectMeta(projRoot);
    resourceName = Object.keys(meta.auth)[0];
  }
  // update parameter to generate client Secret
  const parameters = getCLIInputs(projRoot, 'auth', resourceName);
  parameters.cognitoConfig.userpoolClientGenerateSecret = true;
  setCLIInputs(projRoot, 'auth', resourceName, parameters);
};

export const createUserPoolOnlyWithOAuthSettings = (projectPrefix: string, shortId: string): AddAuthUserPoolOnlyWithOAuthSettings => {
  return {
    resourceName: `${projectPrefix}oares${shortId}`,
    userPoolName: `${projectPrefix}oaup${shortId}`,
    domainPrefix: `${projectPrefix}oadom${shortId}`,
    signInUrl1: 'https://sin1/',
    signInUrl2: 'https://sin2/',
    signOutUrl1: 'https://sout1/',
    signOutUrl2: 'https://sout2/',
    facebookAppId: 'facebookAppId',
    facebookAppSecret: 'facebookAppSecret',
    googleAppId: 'googleAppId',
    googleAppSecret: 'googleAppSecret',
    amazonAppId: 'amazonAppId',
    amazonAppSecret: 'amazonAppSecret',
    appleAppClientId: 'com.fake.app',
    appleAppTeamId: '2QLEWNDK6K',
    appleAppKeyID: '2QLZXKYJ8J',
    appleAppPrivateKey:
      '----BEGIN PRIVATE KEY----MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQgIltgNsTgTfSzUadYiCS0VYtDDMFln/J8i1yJsSIw5g+gCgYIKoZIzj0DAQehRANCAASI8E0L/DhR/mIfTT07v3VwQu6q8I76lgn7kFhT0HvWoLuHKGQFcFkXXCgztgBrprzd419mUChAnKE6y89bWcNw----END PRIVATE KEY----',
  };
};
