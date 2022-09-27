import * as AmplifyHelpers from '@aws-amplify/cli-extensibility-helper';

export function override(props: any) {

  // This tests that proper builtin packages are allowed when calling an override with vm2.
  AmplifyHelpers.getProjectInfo();

  //Enable versioning on the bucket
  props.s3Bucket.versioningConfiguration = {
    status: 'Enabled',
  };
}
