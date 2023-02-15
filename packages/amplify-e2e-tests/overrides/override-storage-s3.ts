import { AmplifyProjectInfo, AmplifyS3ResourceTemplate } from '@aws-amplify/cli-extensibility-helper';

export function override(props: AmplifyS3ResourceTemplate, projectInfo: AmplifyProjectInfo) {
  //Enable versioning on the bucket
  props.s3Bucket.versioningConfiguration = {
    status: 'Enabled',
  };

  if (!projectInfo || !projectInfo.envName || !projectInfo.projectName) {
    throw new Error('Project info is missing in override');
  }
}
