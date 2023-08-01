import { AssumeRoleCommand, STSClient } from '@aws-sdk/client-sts';
import { fromContainerMetadata } from '@aws-sdk/credential-providers';
import { generateRandomShortId, TEST_PROFILE_NAME } from './index';
import * as ini from 'ini';
import * as fs from 'fs-extra';
import { pathManager } from '@aws-amplify/amplify-cli-core';

const refreshCredentials = async () => {
  try {
    const client = new STSClient({
      // Use CodeBuild role to assume test account role. I.e. don't read credentials from process.env
      credentials: fromContainerMetadata(),
    });
    const roleArn = process.env.TEST_ACCOUNT_ROLE;
    const sessionName = `testSession${generateRandomShortId()}`;
    const command = new AssumeRoleCommand({
      RoleArn: roleArn,
      RoleSessionName: sessionName,
      DurationSeconds: 3600,
    });
    const response = await client.send(command);

    const profileName = TEST_PROFILE_NAME;
    const credentialsContents = ini.parse((await fs.readFile(pathManager.getAWSCredentialsFilePath())).toString());
    credentialsContents[profileName] = credentialsContents[profileName] || {};
    credentialsContents[profileName].aws_access_key_id = response.Credentials.AccessKeyId;
    credentialsContents[profileName].aws_secret_access_key = response.Credentials.SecretAccessKey;
    credentialsContents[profileName].aws_session_token = response.Credentials.SessionToken;
    process.env.AWS_ACCESS_KEY_ID = response.Credentials.AccessKeyId;
    process.env.AWS_SECRET_ACCESS_KEY = response.Credentials.SecretAccessKey;
    process.env.AWS_SESSION_TOKEN = response.Credentials.SessionToken;
    await fs.writeFile(pathManager.getAWSCredentialsFilePath(), ini.stringify(credentialsContents));
    console.log('Test profile credentials refreshed');
  } catch (e) {
    console.error('Test profile credentials request failed');
    console.error(e);
  }
};

export const tryScheduleCredentialRefresh = () => {
  // Early return if CI environment is not Codebuild
  if (!process.env.CI || !process.env.CODEBUILD) {
    return false;
  }

  setInterval(() => {
    void refreshCredentials();
  }, 10 * 60 * 1000);

  return true;
};
