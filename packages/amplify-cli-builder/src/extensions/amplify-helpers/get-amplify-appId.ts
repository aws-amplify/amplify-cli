import { getProjectMeta } from './get-project-meta';

export function getAmplifyAppId() {
  const meta = getProjectMeta();

  if (meta.providers && meta.providers.awscloudformation) {
    return meta.providers.awscloudformation.AmplifyAppId;
  }
}
