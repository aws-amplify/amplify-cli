import { execSync } from 'child_process';
import _ from 'lodash';
import { writeFileSync, readFileSync } from 'fs-extra';
import * as ini from 'ini';
import { pathManager } from '@aws-amplify/amplify-cli-core';

export const refreshCredentials = (): AWSTempCredentials | undefined => {
  // Early return if CI environment is not Codebuild
  if (!process.env.CI || !process.env.CODEBUILD) {
    return undefined;
  }

  const stringifedCreds = execSync(`./refresh-credentials.sh`, { shell: true })?.toString();

  if (!_.isEmpty(stringifedCreds)) {
    const creds = JSON.parse(stringifedCreds);
    if (creds?.accessKeyId && creds?.secretAccessKey && creds?.sessionToken) {
      refreshTestProfileCredentials(creds);
      return creds;
    }
  }
  return undefined;
};

export const refreshTestProfileCredentials = (creds: AWSTempCredentials) => {
  const profileName = 'amplify-integ-test-user';
  const credentialsContents = ini.parse(readFileSync(pathManager.getAWSCredentialsFilePath()).toString());
  credentialsContents[profileName] = credentialsContents[profileName] || {};
  credentialsContents[profileName].aws_access_key_id = creds.accessKeyId;
  credentialsContents[profileName].aws_secret_access_key = creds.secretAccessKey;
  credentialsContents[profileName].aws_session_token = creds.sessionToken;
  writeFileSync(pathManager.getAWSCredentialsFilePath(), ini.stringify(credentialsContents));
};

type AWSTempCredentials = {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken: string;
};
