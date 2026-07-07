// eslint-disable-next-line @typescript-eslint/no-unused-vars
namespace jest {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface Matchers<R> {
    toBeIAMRoleWithArn(roleName: string, arn?: string): R;
    toBeAS3Bucket(bucketName: string): R;
    toHaveValidPolicyConditionMatchingIdpId(idpId: string): R;
    toHaveDenyAssumeRolePolicy(): R;
  }
}
