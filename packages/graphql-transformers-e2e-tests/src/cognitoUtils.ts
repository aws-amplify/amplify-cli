import Amplify, { Auth } from 'aws-amplify';
import {
  CreateGroupRequest,
  CreateGroupResponse,
  AdminAddUserToGroupRequest,
  CreateUserPoolResponse,
  CreateUserPoolRequest,
  CreateUserPoolClientRequest,
  CreateUserPoolClientResponse,
  DeleteUserPoolRequest,
  DeleteUserRequest,
} from 'aws-sdk/clients/cognitoidentityserviceprovider';
import { ResourceConstants } from 'graphql-transformer-common';
import { IAM as cfnIAM, Cognito as cfnCognito } from 'cloudform-types';
import { CognitoIdentityServiceProvider as CognitoClient, CognitoIdentity } from 'aws-sdk';
import TestStorage from './TestStorage';
import DeploymentResources from 'graphql-transformer-core/lib/DeploymentResources';

interface E2Econfiguration {
  STACK_NAME?: string;
  AUTH_ROLE_NAME?: string;
  UNAUTH_ROLE_NAME?: string;
  IDENTITY_POOL_NAME?: string;
  USER_POOL_CLIENTWEB_NAME?: string;
  USER_POOL_CLIENT_NAME?: string;
  USER_POOL_ID?: string;
}

const cognitoClient = new CognitoClient({ apiVersion: '2016-04-19', region: 'us-west-2' });

export function configureAmplify(userPoolId: string, userPoolClientId: string, identityPoolId?: string) {
  Amplify.configure({
    Auth: {
      // REQUIRED - Amazon Cognito Region
      region: 'us-west-2',
      userPoolId: userPoolId,
      userPoolWebClientId: userPoolClientId,
      storage: new TestStorage(),
      identityPoolId: identityPoolId,
    },
  });
}

export async function signupUser(userPoolId: string, name: string, pw: string) {
  return new Promise((res, rej) => {
    const createUser = cognitoClient.adminCreateUser.bind(cognitoClient) as any;
    createUser(
      {
        UserPoolId: userPoolId,
        UserAttributes: [{ Name: 'email', Value: name }],
        Username: name,
        TemporaryPassword: pw,
        DesiredDeliveryMediums: [],
        MessageAction: 'SUPPRESS',
      },
      (err, data) => (err ? rej(err) : res(data)),
    );
  });
}

export async function authenticateUser(username: string, tempPassword: string, password: string) {
  let signinResult = await Auth.signIn(username, tempPassword);

  if (signinResult.challengeName === 'NEW_PASSWORD_REQUIRED') {
    const { requiredAttributes } = signinResult.challengeParam;

    signinResult = await Auth.completeNewPassword(signinResult, password, requiredAttributes);
  }

  return signinResult.getSignInUserSession();
}

export async function deleteUser(accessToken: string): Promise<{}> {
  return new Promise((res, rej) => {
    const params: DeleteUserRequest = {
      AccessToken: accessToken,
    };
    cognitoClient.deleteUser(params, (err, data) => (err ? rej(err) : res(data)));
  });
}

export async function createGroup(userPoolId: string, name: string, roleArn?: string): Promise<CreateGroupResponse> {
  return new Promise((res, rej) => {
    const params: CreateGroupRequest = {
      GroupName: name,
      UserPoolId: userPoolId,
      ...(roleArn ? { RoleArn: roleArn } : {}),
    };
    cognitoClient.createGroup(params, (err, data) => (err ? rej(err) : res(data)));
  });
}

export async function addUserToGroup(groupName: string, username: string, userPoolId: string) {
  return new Promise((res, rej) => {
    const params: AdminAddUserToGroupRequest = {
      GroupName: groupName,
      Username: username,
      UserPoolId: userPoolId,
    };
    cognitoClient.adminAddUserToGroup(params, (err, data) => (err ? rej(err) : res(data)));
  });
}

export async function createIdentityPool(
  client: CognitoIdentity,
  identityPoolName: string,
  params: { authRoleArn: string; unauthRoleArn: string; providerName: string; clientId: string; useTokenAuth?: boolean },
): Promise<string> {
  const useTokenAuth = params?.useTokenAuth ?? false;
  const idPool = await client
    .createIdentityPool({
      IdentityPoolName: identityPoolName,
      AllowUnauthenticatedIdentities: true,
      CognitoIdentityProviders: [
        {
          ProviderName: params.providerName,
          ClientId: params.clientId,
        },
      ],
    })
    .promise();

  await client
    .setIdentityPoolRoles({
      IdentityPoolId: idPool.IdentityPoolId,
      Roles: {
        authenticated: params.authRoleArn,
        unauthenticated: params.unauthRoleArn,
      },
      ...(useTokenAuth
        ? {
            RoleMappings: {
              [`${params.providerName}:${params.clientId}`]: {
                Type: 'Token',
                AmbiguousRoleResolution: 'AuthenticatedRole',
              },
            },
          }
        : {}),
    })
    .promise();

  return idPool.IdentityPoolId;
}

export async function createUserPool(client: CognitoClient, userPoolName: string): Promise<CreateUserPoolResponse> {
  return new Promise((res, rej) => {
    const params: CreateUserPoolRequest = {
      PoolName: userPoolName,
      Policies: {
        PasswordPolicy: {
          MinimumLength: 8,
          RequireLowercase: true,
          RequireNumbers: true,
          RequireSymbols: true,
          RequireUppercase: true,
        },
      },
      Schema: [
        {
          Name: 'email',
          Required: true,
          Mutable: true,
        },
      ],
      AutoVerifiedAttributes: ['email'],
    };
    client.createUserPool(params, (err, data) => (err ? rej(err) : res(data)));
  });
}

export async function deleteUserPool(client: CognitoClient, userPoolId: string): Promise<{}> {
  return new Promise((res, rej) => {
    const params: DeleteUserPoolRequest = {
      UserPoolId: userPoolId,
    };
    client.deleteUserPool(params, (err, data) => (err ? rej(err) : res(data)));
  });
}

export async function deleteIdentityPool(client: CognitoIdentity, identityPoolId: string) {
  await client
    .deleteIdentityPool({
      IdentityPoolId: identityPoolId,
    })
    .promise();
}

export async function createUserPoolClient(
  client: CognitoClient,
  userPoolId: string,
  clientName: string,
): Promise<CreateUserPoolClientResponse> {
  return new Promise((res, rej) => {
    const params: CreateUserPoolClientRequest = {
      ClientName: clientName,
      UserPoolId: userPoolId,
      GenerateSecret: false,
      RefreshTokenValidity: 30,
    };
    client.createUserPoolClient(params, (err, data) => (err ? rej(err) : res(data)));
  });
}

export function addIAMRolesToCFNStack(out: DeploymentResources, e2eConfig: E2Econfiguration) {
  const { AUTH_ROLE_NAME, UNAUTH_ROLE_NAME, IDENTITY_POOL_NAME, USER_POOL_CLIENTWEB_NAME, USER_POOL_CLIENT_NAME, USER_POOL_ID } = e2eConfig;

  // logic to add IAM roles to cfn
  const authRole = new cfnIAM.Role({
    RoleName: AUTH_ROLE_NAME,
    AssumeRolePolicyDocument: {
      Version: '2012-10-17',
      Statement: [
        {
          Sid: '',
          Effect: 'Allow',
          Principal: {
            Federated: 'cognito-identity.amazonaws.com',
          },
          Action: 'sts:AssumeRoleWithWebIdentity',
          Condition: {
            'ForAnyValue:StringLike': {
              'cognito-identity.amazonaws.com:amr': 'authenticated',
            },
          },
        },
      ],
    },
  });

  const unauthRole = new cfnIAM.Role({
    RoleName: UNAUTH_ROLE_NAME,
    AssumeRolePolicyDocument: {
      Version: '2012-10-17',
      Statement: [
        {
          Sid: '',
          Effect: 'Allow',
          Principal: {
            Federated: 'cognito-identity.amazonaws.com',
          },
          Action: 'sts:AssumeRoleWithWebIdentity',
          Condition: {
            'ForAnyValue:StringLike': {
              'cognito-identity.amazonaws.com:amr': 'unauthenticated',
            },
          },
        },
      ],
    },
    Policies: [
      new cfnIAM.Role.Policy({
        PolicyName: 'appsync-unauthrole-policy',
        PolicyDocument: {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: ['appsync:GraphQL'],
              Resource: [
                {
                  'Fn::Join': [
                    '',
                    [
                      'arn:aws:appsync:',
                      { Ref: 'AWS::Region' },
                      ':',
                      { Ref: 'AWS::AccountId' },
                      ':apis/',
                      {
                        'Fn::GetAtt': ['GraphQLAPI', 'ApiId'],
                      },
                      '/*',
                    ],
                  ],
                },
              ],
            },
          ],
        },
      }),
    ],
  });

  const identityPool = new cfnCognito.IdentityPool({
    IdentityPoolName: IDENTITY_POOL_NAME,
    CognitoIdentityProviders: [
      {
        ClientId: {
          Ref: 'UserPoolClient',
        },
        ProviderName: {
          'Fn::Sub': [
            'cognito-idp.${region}.amazonaws.com/${client}',
            {
              region: {
                Ref: 'AWS::Region',
              },
              client: USER_POOL_ID,
            },
          ],
        },
      } as unknown,
      {
        ClientId: {
          Ref: 'UserPoolClientWeb',
        },
        ProviderName: {
          'Fn::Sub': [
            'cognito-idp.${region}.amazonaws.com/${client}',
            {
              region: {
                Ref: 'AWS::Region',
              },
              client: USER_POOL_ID,
            },
          ],
        },
      } as unknown,
    ],
    AllowUnauthenticatedIdentities: true,
  });

  const identityPoolRoleMap = new cfnCognito.IdentityPoolRoleAttachment({
    IdentityPoolId: { Ref: 'IdentityPool' } as unknown as string,
    Roles: {
      unauthenticated: { 'Fn::GetAtt': ['UnauthRole', 'Arn'] },
      authenticated: { 'Fn::GetAtt': ['AuthRole', 'Arn'] },
    },
  });

  const userPoolClientWeb = new cfnCognito.UserPoolClient({
    ClientName: USER_POOL_CLIENTWEB_NAME,
    RefreshTokenValidity: 30,
    UserPoolId: USER_POOL_ID,
  });

  const userPoolClient = new cfnCognito.UserPoolClient({
    ClientName: USER_POOL_CLIENT_NAME,
    GenerateSecret: true,
    RefreshTokenValidity: 30,
    UserPoolId: USER_POOL_ID,
  });

  out.rootStack.Resources.IdentityPool = identityPool;
  out.rootStack.Resources.IdentityPoolRoleMap = identityPoolRoleMap;
  out.rootStack.Resources.UserPoolClientWeb = userPoolClientWeb;
  out.rootStack.Resources.UserPoolClient = userPoolClient;
  out.rootStack.Outputs.IdentityPoolId = { Value: { Ref: 'IdentityPool' } };
  out.rootStack.Outputs.IdentityPoolName = { Value: { 'Fn::GetAtt': ['IdentityPool', 'Name'] } };

  out.rootStack.Resources.AuthRole = authRole;
  out.rootStack.Outputs.AuthRoleArn = { Value: { 'Fn::GetAtt': ['AuthRole', 'Arn'] } };
  out.rootStack.Resources.UnauthRole = unauthRole;
  out.rootStack.Outputs.UnauthRoleArn = { Value: { 'Fn::GetAtt': ['UnauthRole', 'Arn'] } };

  // Since we're doing the policy here we've to remove the transformer generated artifacts from
  // the generated stack.
  const maxPolicyCount = 10;
  for (let i = 0; i < maxPolicyCount; i++) {
    const paddedIndex = `${i + 1}`.padStart(2, '0');
    const authResourceName = `${ResourceConstants.RESOURCES.AuthRolePolicy}${paddedIndex}`;
    const unauthResourceName = `${ResourceConstants.RESOURCES.UnauthRolePolicy}${paddedIndex}`;

    if (out.rootStack.Resources[authResourceName]) {
      delete out.rootStack.Resources[authResourceName];
    }

    if (out.rootStack.Resources[unauthResourceName]) {
      delete out.rootStack.Resources[unauthResourceName];
    }
  }

  delete out.rootStack.Parameters.authRoleName;
  delete out.rootStack.Parameters.unauthRoleName;

  for (const key of Object.keys(out.rootStack.Resources)) {
    if (
      out.rootStack.Resources[key].Properties &&
      out.rootStack.Resources[key].Properties.Parameters &&
      out.rootStack.Resources[key].Properties.Parameters.unauthRoleName
    ) {
      delete out.rootStack.Resources[key].Properties.Parameters.unauthRoleName;
    }

    if (
      out.rootStack.Resources[key].Properties &&
      out.rootStack.Resources[key].Properties.Parameters &&
      out.rootStack.Resources[key].Properties.Parameters.authRoleName
    ) {
      delete out.rootStack.Resources[key].Properties.Parameters.authRoleName;
    }
  }

  for (const stackKey of Object.keys(out.stacks)) {
    const stack = out.stacks[stackKey];

    for (const key of Object.keys(stack.Resources)) {
      if (stack.Parameters && stack.Parameters.unauthRoleName) {
        delete stack.Parameters.unauthRoleName;
      }
      if (stack.Parameters && stack.Parameters.authRoleName) {
        delete stack.Parameters.authRoleName;
      }
      if (
        stack.Resources[key].Properties &&
        stack.Resources[key].Properties.Parameters &&
        stack.Resources[key].Properties.Parameters.unauthRoleName
      ) {
        delete stack.Resources[key].Properties.Parameters.unauthRoleName;
      }
      if (
        stack.Resources[key].Properties &&
        stack.Resources[key].Properties.Parameters &&
        stack.Resources[key].Properties.Parameters.authRoleName
      ) {
        delete stack.Resources[key].Properties.Parameters.authRoleName;
      }
    }
  }
  return out;
}
