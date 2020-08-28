import { getBackendAmplifyMeta } from './projectMeta';

export function getAppId(projRoot: string): string {
  const meta = getBackendAmplifyMeta(projRoot);
  return meta.providers.awscloudformation.AmplifyAppId;
}
