export function override(props: any) {
  //Enable versioning on the bucket
  props.s3Bucket.versioningConfiguration = {
    status: 'Enabled',
  };
}
