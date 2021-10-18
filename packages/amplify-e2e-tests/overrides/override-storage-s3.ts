
export function overrideProps(props: any) {
    //Enable versioning on the bucket
    props.s3Bucket.versioningConfiguration = {
        status : "Enabled"
    }
    return props;
}
  