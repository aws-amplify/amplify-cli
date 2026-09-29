/**
 * Ensures the Gen1 placeholder app exists in all E2E test accounts and regions.
 *
 * This is needed so that `amplify init` doesn't get blocked by the Gen1
 * new-customer restriction. The placeholder app is skipped by the cleanup
 * scripts so it persists across runs.
 *
 * Usage:
 *   ts-node ./src/ensure-gen1-placeholder-apps.ts
 *
 * Requires AWS credentials to the organization root account in the environment (AWS_ACCESS_KEY_ID, etc.).
 */

import { AmplifyClient } from '@aws-sdk/client-amplify';
import { STSClient, GetCallerIdentityCommand, AssumeRoleCommand } from '@aws-sdk/client-sts';
import { OrganizationsClient, paginateListAccounts } from '@aws-sdk/client-organizations';
import { ensureGen1PlaceholderApp, GEN1_PLACEHOLDER_APP_NAME } from '@aws-amplify/amplify-e2e-core';

const AWS_REGIONS_TO_RUN_TESTS = [
  'us-east-1',
  'us-east-2',
  'us-west-2',
  'eu-west-2',
  'eu-west-3',
  'eu-central-1',
  'ap-northeast-1',
  'ap-northeast-2',
  'ap-southeast-1',
  'ap-southeast-2',
];

interface AWSAccountInfo {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken: string;
  accountId: string;
}

const getAccountsToCleanup = async (): Promise<AWSAccountInfo[]> => {
  const stsClient = new STSClient({
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      sessionToken: process.env.AWS_SESSION_TOKEN!,
    },
  });
  const parentIdentity = await stsClient.send(new GetCallerIdentityCommand({}));
  const parentAccountId = parentIdentity.Account!;

  const orgClient = new OrganizationsClient({ region: 'us-east-1' });

  try {
    const allAccounts: { Id?: string }[] = [];
    for await (const page of paginateListAccounts({ client: orgClient }, {})) {
      allAccounts.push(...(page.Accounts ?? []));
    }

    const accountPromises = allAccounts.map(async (account): Promise<AWSAccountInfo> => {
      if (account.Id === parentAccountId) {
        return {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
          sessionToken: process.env.AWS_SESSION_TOKEN!,
          accountId: parentAccountId,
        };
      }
      const assumeRoleRes = await stsClient.send(
        new AssumeRoleCommand({
          RoleArn: `arn:aws:iam::${account.Id}:role/OrganizationAccountAccessRole`,
          RoleSessionName: `placeholder${Math.floor(Math.random() * 100000)}`,
          DurationSeconds: 3600,
        }),
      );
      return {
        accessKeyId: assumeRoleRes.Credentials?.AccessKeyId ?? '',
        secretAccessKey: assumeRoleRes.Credentials?.SecretAccessKey ?? '',
        sessionToken: assumeRoleRes.Credentials?.SessionToken ?? '',
        accountId: account.Id!,
      };
    });
    return await Promise.all(accountPromises);
  } catch (e) {
    console.error('Error listing org accounts, falling back to current account only:', e);
    return [
      {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        sessionToken: process.env.AWS_SESSION_TOKEN!,
        accountId: parentAccountId,
      },
    ];
  }
};

const ensureForAccountAndRegion = async (account: AWSAccountInfo, region: string): Promise<void> => {
  const client = new AmplifyClient({
    region,
    credentials: {
      accessKeyId: account.accessKeyId,
      secretAccessKey: account.secretAccessKey,
      sessionToken: account.sessionToken,
    },
  });
  await ensureGen1PlaceholderApp(client);
};

const main = async (): Promise<void> => {
  console.log(`Ensuring '${GEN1_PLACEHOLDER_APP_NAME}' exists in all accounts and regions...\n`);

  const accounts = await getAccountsToCleanup();
  console.log(`Found ${accounts.length} account(s)\n`);

  let failureCount = 0;

  for (const account of accounts) {
    for (const region of AWS_REGIONS_TO_RUN_TESTS) {
      try {
        await ensureForAccountAndRegion(account, region);
        console.log(`  ✔ ${account.accountId} / ${region}`);
      } catch (e) {
        console.error(`  ✘ ${account.accountId} / ${region}: ${(e as Error).message}`);
        failureCount++;
      }
    }
  }

  if (failureCount > 0) {
    throw new Error(`Failed for ${failureCount} account/region(s)`);
  }

  console.log('\nDone.');
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
