import { amplifyConfigure as configure, injectRegion, injectSessionToken, isCI } from 'amplify-e2e-core';
import * as AWS from 'aws-sdk';
process.env.AWS_DEFAULT_REGION = process.env.CLI_REGION;

const orgApi = new AWS.Organizations({
  apiVersion: '2016-11-28',
  // the region where the organization exists
  region: 'us-east-1',
});

async function setupAmplify() {
  if (isCI()) {
    await exchangeTemporaryCredentials();
    const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
    const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
    const REGION = process.env.CLI_REGION;
    if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY || !REGION) {
      throw new Error('Please set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY and CLI_REGION in .env');
    }
    await configure({
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY,
      profileName: 'amplify-integ-test-user',
      region: REGION,
    });
    if (process.env.AWS_SESSION_TOKEN) {
      injectSessionToken('amplify-integ-test-user');
      injectRegion('amplify-integ-test-user');
    }
  } else {
    console.log('AWS Profile is already configured');
  }
}

async function exchangeTemporaryCredentials() {
  if (process.env.USE_PARENT_ACCOUNT) {
    console.log('Environment is configured to use parent AWS account.');
    return;
  }

  let accs;
  try {
    accs = await orgApi.listAccounts().promise();
  } catch (e) {}

  if (!accs || !accs.Accounts || accs.Accounts.length === 0) {
    console.log('No child accounts found. Using parent AWS account.');
    return;
  }

  const randomNumber = Math.floor(Math.random() * 100000);
  const randomIndex = Math.floor(Math.random() * accs.Accounts.length);
  const account = accs.Accounts[randomIndex];
  const sts = new AWS.STS({
    apiVersion: '2011-06-15',
  });

  // Temporary credentials will last long enough to complete a test run
  const assumeRoleRes = await sts
    .assumeRole({
      RoleArn: `arn:aws:iam::${account.Id}:role/OrganizationAccountAccessRole`,
      RoleSessionName: `testSession${randomNumber}`,
      // One hour
      DurationSeconds: 1 * 60 * 60,
    })
    .promise();

  const assumedSts = new AWS.STS({
    apiVersion: '2011-06-15',
    accessKeyId: assumeRoleRes.Credentials.AccessKeyId,
    secretAccessKey: assumeRoleRes.Credentials.SecretAccessKey,
    sessionToken: assumeRoleRes.Credentials.SessionToken,
  });
  const identity = await assumedSts.getCallerIdentity().promise();
  console.log(`Assuming account ${identity.Account}`);

  process.env.AWS_SESSION_TOKEN = assumeRoleRes.Credentials.SessionToken;
  process.env.AWS_ACCESS_KEY_ID = assumeRoleRes.Credentials.AccessKeyId;
  process.env.AWS_SECRET_ACCESS_KEY = assumeRoleRes.Credentials.SecretAccessKey;
}

process.nextTick(async () => {
  try {
    await setupAmplify();
  } catch (e) {
    console.log(e.stack);
    process.exit(1);
  }
});
