import { v4 as uuid } from 'uuid';
import { GetCallerIdentityCommand, STSClient } from '@aws-sdk/client-sts';
import { UsageData } from '../../domain/amplify-usageData';
import { IUsageData } from '@aws-amplify/amplify-cli-core';

export const getUsageDataMetric = async (envName: string): Promise<IUsageData> => {
  const usageData = UsageData.Instance;
  const accountId = await getAccountId();
  if (!accountId) {
    throw new Error('Could not get account ID');
  }

  usageData.init(
    uuid(),
    '',
    {
      command: 'to-gen-2',
      argv: process.argv,
    },
    accountId,
    {
      envName,
    },
    Date.now(),
  );

  return usageData;
};

const getAccountId = async (): Promise<string | undefined> => {
  const stsClient = new STSClient();
  const callerIdentityResult = await stsClient.send(new GetCallerIdentityCommand());
  return callerIdentityResult.Account;
};
