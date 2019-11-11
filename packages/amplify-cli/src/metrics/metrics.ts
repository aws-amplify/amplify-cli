import { Context } from '../domain/context';
import bugsnag, { Bugsnag } from '@bugsnag/js';
import crypto from 'crypto';
import * as os from 'os';
import * as path from 'path';

export const checkAndCollectMetrics = (context: Context) => async (e: any): Promise<any> => {
  let releaseStage = 'production';
  const { input } = context;
  if (input.argv.length > 1) {
    const base = path.basename(input.argv[1]);
    const split = base.split('-');
    if (split.length > 1) releaseStage = split[1];
  }
  console.log(JSON.stringify(input, null, 1));
  const bugsnagClient = createBugSnagClient(releaseStage, getVersion(context));
  const userId = getUserId(context);
  setUser(bugsnagClient, userId);
  bugsnagClient.metaData = {
    input,
    os: os.platform(),
  };
  bugsnagClient.notify(e);
};

function createBugSnagClient(releaseStage: string, version: string) {
  const { BUGSNAG_API_KEY = '' } = process.env;
  return bugsnag({
    apiKey: BUGSNAG_API_KEY,
    appVersion: version,
    autoCaptureSessions: false,
    releaseStage,
  });
}

function setUser(bugsnagClient: Bugsnag.Client, userId: string) {
  bugsnagClient.user = {
    id: userId,
  };
}

function getUserId(context: Context) {
  const projectDetails = context.amplify.getProjectDetails();
  if (!projectDetails) return 'N/A';
  const stackId = projectDetails.amplifyMeta.providers['awscloudformation'].StackId;
  const accountId = stackId.split(':')[4];
  return crypto
    .createHash('md5')
    .update(accountId)
    .digest('hex');
}

const getVersion = (context: Context) => context.pluginPlatform.plugins.core[0].packageVersion;
