import { execSync } from 'child_process';

const DEFAULT_REGION = 'us-east-1';
const DEFAULT_PREFIX = 'importedresources';

function awsCli(args: string): string {
  return execSync(`aws ${args}`, { encoding: 'utf-8' }).trim();
}

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

function createUserPool(region: string, prefix: string): { id: string; arn: string } {
  console.log('\nCreating User Pool...');
  const id = awsCli([
    `cognito-idp create-user-pool`,
    `--pool-name "${prefix}_userpool"`,
    `--region ${region}`,
    `--username-attributes email`,
    `--username-configuration CaseSensitive=false`,
    `--auto-verified-attributes email`,
    `--mfa-configuration OFF`,
    `--verification-message-template '${JSON.stringify({
      DefaultEmailOption: 'CONFIRM_WITH_CODE',
      EmailMessage: 'Your verification code is {####}',
      EmailSubject: 'Your verification code',
      SmsMessage: 'The verification code to your new account is {####}',
    })}'`,
    `--schema '${JSON.stringify([{ Name: 'email', Required: true, Mutable: true, AttributeDataType: 'String' }])}'`,
    `--policies '${JSON.stringify({
      PasswordPolicy: {
        MinimumLength: 8,
        RequireUppercase: false,
        RequireLowercase: false,
        RequireNumbers: false,
        RequireSymbols: false,
        TemporaryPasswordValidityDays: 7,
      },
    })}'`,
    `--admin-create-user-config AllowAdminCreateUserOnly=false`,
    `--account-recovery-setting '${JSON.stringify({
      RecoveryMechanisms: [{ Name: 'verified_email', Priority: 1 }],
    })}'`,
    `--user-attribute-update-settings '${JSON.stringify({
      AttributesRequireVerificationBeforeUpdate: ['email'],
    })}'`,
    `--query 'UserPool.Id'`,
    `--output text`,
  ].join(' '));

  console.log(`User Pool created: ${id}`);

  const arn = awsCli([
    `cognito-idp describe-user-pool`,
    `--user-pool-id ${id}`,
    `--region ${region}`,
    `--query 'UserPool.Arn'`,
    `--output text`,
  ].join(' '));

  return { id, arn };
}

function createUserPoolClient(
  region: string,
  userPoolId: string,
  clientName: string,
): string {
  console.log(`\nCreating App Client: ${clientName}...`);
  const clientId = awsCli([
    `cognito-idp create-user-pool-client`,
    `--user-pool-id ${userPoolId}`,
    `--region ${region}`,
    `--client-name "${clientName}"`,
    `--no-generate-secret`,
    `--explicit-auth-flows ALLOW_CUSTOM_AUTH ALLOW_USER_SRP_AUTH ALLOW_REFRESH_TOKEN_AUTH`,
    `--supported-identity-providers COGNITO`,
    `--prevent-user-existence-errors ENABLED`,
    `--refresh-token-validity 30`,
    `--token-validity-units '${JSON.stringify({ RefreshToken: 'days' })}'`,
    `--read-attributes email`,
    `--write-attributes email`,
    `--query 'UserPoolClient.ClientId'`,
    `--output text`,
  ].join(' '));

  console.log(`App Client created: ${clientId}`);
  return clientId;
}

function createIdentityPool(
  region: string,
  prefix: string,
  userPoolId: string,
  webClientId: string,
  nativeClientId: string,
): string {
  console.log('\nCreating Identity Pool...');
  const providerName = `cognito-idp.${region}.amazonaws.com/${userPoolId}`;
  const identityPoolId = awsCli([
    `cognito-identity create-identity-pool`,
    `--identity-pool-name "${prefix}_identitypool"`,
    `--region ${region}`,
    `--allow-unauthenticated-identities`,
    `--cognito-identity-providers ProviderName="${providerName}",ClientId="${webClientId}" ProviderName="${providerName}",ClientId="${nativeClientId}"`,
    `--query 'IdentityPoolId'`,
    `--output text`,
  ].join(' '));

  console.log(`Identity Pool created: ${identityPoolId}`);
  return identityPoolId;
}

function createIamRole(roleName: string, identityPoolId: string, amrCondition: string): string {
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

  const roleArn = awsCli([
    `iam create-role`,
    `--role-name "${roleName}"`,
    `--assume-role-policy-document '${trustPolicy}'`,
    `--query 'Role.Arn'`,
    `--output text`,
  ].join(' '));

  console.log(`Role created: ${roleArn}`);
  return roleArn;
}

function main(): void {
  const { region, prefix } = parseArgs();
  console.log(`Creating Cognito resources in region: ${region} with prefix: ${prefix}`);

  // User Pool
  const userPool = createUserPool(region, prefix);

  // App Clients
  const webClientId = createUserPoolClient(region, userPool.id, `${prefix}_app_clientWeb`);
  const nativeClientId = createUserPoolClient(region, userPool.id, `${prefix}_app_client`);

  // Identity Pool
  const identityPoolId = createIdentityPool(region, prefix, userPool.id, webClientId, nativeClientId);

  // IAM Roles
  const authRoleArn = createIamRole(`${prefix}-auth-role`, identityPoolId, 'authenticated');
  const unauthRoleArn = createIamRole(`${prefix}-unauth-role`, identityPoolId, 'unauthenticated');

  // Attach roles to identity pool
  awsCli([
    `cognito-identity set-identity-pool-roles`,
    `--identity-pool-id ${identityPoolId}`,
    `--region ${region}`,
    `--roles "authenticated=${authRoleArn},unauthenticated=${unauthRoleArn}"`,
  ].join(' '));

  console.log('Roles attached to Identity Pool.');

  // Summary
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

main();
