namespace jest {
  interface Matchers<R> {
    toBeIAMRoleWithArn(roleName: string, arn?: string): R;
    toBeAS3Bucket(bucketName: string): R;
  }
}
