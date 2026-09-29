/**
 * Creates Cognito auth resources (User Pool, Identity Pool, IAM roles)
 * outside of Amplify, for use with `amplify import auth`.
 */

import {
  CognitoIdentityProviderClient,
  CreateUserPoolCommand,
  DescribeUserPoolCommand,
  CreateUserPoolClientCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { CognitoIdentityClient, CreateIdentityPoolCommand, SetIdentityPoolRolesCommand } from '@aws-sdk/client-cognito-identity';
import { IAMClient, CreateRoleCommand } from '@aws-sdk/client-iam';

const DEFAULT_REGION = 'us-east-1';
const DEFAULT_PREFIX = 'importedresources';

function parseArgs(): { region: string; prefix: string } {
  const args = process.argv.slice(2);
  let region = DEFAULT_REGION;
  let prefix = DEFAULT_PREFIX;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--region' && args[i + 1]) {
      region = args[++i];
    } else if (args[i] === '--prefix' && args[i + 1]) {
      prefix = args[++i];
    } else {
      console.error(`Unknown option: ${args[i]}`);
      process.exit(1);
    }
  }
  return { region, prefix };
}

async function createUserPool(client: CognitoIdentityProviderClient, prefix: string): Promise<{ id: string; arn: string }> {
  console.log('\nCreating User Pool...');
  const { UserPool } = await client.send(
    new CreateUserPoolCommand({
      PoolName: `${prefix}_userpool`,
      UsernameAttributes: ['email'],
      UsernameConfiguration: { CaseSensitive: false },
      AutoVerifiedAttributes: ['email'],
      MfaConfiguration: 'OFF',
      VerificationMessageTemplate: {
        DefaultEmailOption: 'CONFIRM_WITH_CODE',
        EmailMessage: 'Your verification code is {####}',
        EmailSubject: 'Your verification code',
        SmsMessage: 'The verification code to your new account is {####}',
      },
      Schema: [{ Name: 'email', Required: true, Mutable: true, AttributeDataType: 'String' }],
      Policies: {
        PasswordPolicy: {
          MinimumLength: 8,
          RequireUppercase: false,
          RequireLowercase: false,
          RequireNumbers: false,
          RequireSymbols: false,
          TemporaryPasswordValidityDays: 7,
        },
      },
      AdminCreateUserConfig: { AllowAdminCreateUserOnly: false },
      AccountRecoverySetting: {
        RecoveryMechanisms: [{ Name: 'verified_email', Priority: 1 }],
      },
      UserAttributeUpdateSettings: {
        AttributesRequireVerificationBeforeUpdate: ['email'],
      },
    }),
  );

  const id = UserPool!.Id!;
  console.log(`User Pool created: ${id}`);

  const { UserPool: described } = await client.send(new DescribeUserPoolCommand({ UserPoolId: id }));

  return { id, arn: described!.Arn! };
}

async function createUserPoolClient(client: CognitoIdentityProviderClient, userPoolId: string, clientName: string): Promise<string> {
  console.log(`\nCreating App Client: ${clientName}...`);
  const { UserPoolClient } = await client.send(
    new CreateUserPoolClientCommand({
      UserPoolId: userPoolId,
      ClientName: clientName,
      GenerateSecret: false,
      ExplicitAuthFlows: ['ALLOW_CUSTOM_AUTH', 'ALLOW_USER_SRP_AUTH', 'ALLOW_REFRESH_TOKEN_AUTH'],
      SupportedIdentityProviders: ['COGNITO'],
      PreventUserExistenceErrors: 'ENABLED',
      RefreshTokenValidity: 30,
      TokenValidityUnits: { RefreshToken: 'days' },
      ReadAttributes: ['email'],
      WriteAttributes: ['email'],
    }),
  );

  const clientId = UserPoolClient!.ClientId!;
  console.log(`App Client created: ${clientId}`);
  return clientId;
}

async function createIdentityPool(
  client: CognitoIdentityClient,
  region: string,
  prefix: string,
  userPoolId: string,
  webClientId: string,
  nativeClientId: string,
): Promise<string> {
  console.log('\nCreating Identity Pool...');
  const providerName = `cognito-idp.${region}.amazonaws.com/${userPoolId}`;
  const result = await client.send(
    new CreateIdentityPoolCommand({
      IdentityPoolName: `${prefix}_identitypool`,
      AllowUnauthenticatedIdentities: true,
      CognitoIdentityProviders: [
        { ProviderName: providerName, ClientId: webClientId },
        { ProviderName: providerName, ClientId: nativeClientId },
      ],
    }),
  );

  const identityPoolId = result.IdentityPoolId!;
  console.log(`Identity Pool created: ${identityPoolId}`);
  return identityPoolId;
}

async function createIamRole(client: IAMClient, roleName: string, identityPoolId: string, amrCondition: string): Promise<string> {
  console.log(`\nCreating IAM role: ${roleName}...`);
  const trustPolicy = JSON.stringify({
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Principal: { Federated: 'cognito-identity.amazonaws.com' },
        Action: 'sts:AssumeRoleWithWebIdentity',
        Condition: {
          StringEquals: { 'cognito-identity.amazonaws.com:aud': identityPoolId },
          'ForAnyValue:StringLike': { 'cognito-identity.amazonaws.com:amr': amrCondition },
        },
      },
    ],
  });

  const { Role } = await client.send(
    new CreateRoleCommand({
      RoleName: roleName,
      AssumeRolePolicyDocument: trustPolicy,
    }),
  );

  const roleArn = Role!.Arn!;
  console.log(`Role created: ${roleArn}`);
  return roleArn;
}

async function main(): Promise<void> {
  const { region, prefix } = parseArgs();
  console.log(`Creating Cognito resources in region: ${region} with prefix: ${prefix}`);

  const idpClient = new CognitoIdentityProviderClient({ region });
  const identityClient = new CognitoIdentityClient({ region });
  const iamClient = new IAMClient({ region });

  const userPool = await createUserPool(idpClient, prefix);
  const webClientId = await createUserPoolClient(idpClient, userPool.id, `${prefix}_app_clientWeb`);
  const nativeClientId = await createUserPoolClient(idpClient, userPool.id, `${prefix}_app_client`);
  const identityPoolId = await createIdentityPool(identityClient, region, prefix, userPool.id, webClientId, nativeClientId);
  const authRoleArn = await createIamRole(iamClient, `${prefix}-auth-role`, identityPoolId, 'authenticated');
  const unauthRoleArn = await createIamRole(iamClient, `${prefix}-unauth-role`, identityPoolId, 'unauthenticated');

  await identityClient.send(
    new SetIdentityPoolRolesCommand({
      IdentityPoolId: identityPoolId,
      Roles: {
        authenticated: authRoleArn,
        unauthenticated: unauthRoleArn,
      },
    }),
  );

  console.log('Roles attached to Identity Pool.');

  console.log(`
============================================
  Auth resources created successfully
============================================

User Pool ID:         ${userPool.id}
User Pool ARN:        ${userPool.arn}
Web Client ID:        ${webClientId}
Native Client ID:     ${nativeClientId}
Identity Pool ID:     ${identityPoolId}

To import into your Amplify Gen1 app, run:

  amplify import auth

When prompted, select 'Cognito User Pool and Identity Pool' and provide:
  - User Pool ID:      ${userPool.id}
  - Web Client ID:     ${webClientId}
  - Native Client ID:  ${nativeClientId}
  - Identity Pool ID:  ${identityPoolId}

Then run 'amplify push' to update your backend.
`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
