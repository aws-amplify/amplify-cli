import { AmplifyProjectInfo, AmplifyS3ResourceTemplate } from '@aws-amplify/cli-extensibility-helper';

export function override(props: AmplifyS3ResourceTemplate, amplifyProjectInfo: AmplifyProjectInfo) {
  //Enable versioning on the bucket
  props.s3Bucket.versioningConfiguration = {
    status: 'Enabled',
  };

  if (!amplifyProjectInfo || !amplifyProjectInfo.envName || !amplifyProjectInfo.projectName) {
    throw new Error(`Project info is missing in override: ${JSON.stringify(amplifyProjectInfo)}`);
  }

  if (amplifyProjectInfo.envName != '##EXPECTED_ENV_NAME') {
    throw new Error(`Unexpected envName: ${amplifyProjectInfo.envName}`);
  }

  if (amplifyProjectInfo.projectName != '##EXPECTED_PROJECT_NAME') {
    throw new Error(`Unexpected envName: ${amplifyProjectInfo.envName}`);
  }
}
