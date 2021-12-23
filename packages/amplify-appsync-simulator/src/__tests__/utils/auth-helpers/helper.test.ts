import { AmplifyAppSyncAPIConfig, AmplifyAppSyncSimulatorAuthenticationType } from '../../../type-definition';
import { extractIamToken } from '../../../utils/auth-helpers/helpers';
describe('extractIamToken', () => {
  const appSyncConfig: AmplifyAppSyncAPIConfig = {
    name: 'testApi',
    additionalAuthenticationProviders: [],
    authRoleName: 'myAuthRole',
    unAuthRoleName: 'myUnAuthRole',
    defaultAuthenticationType: { authenticationType: AmplifyAppSyncSimulatorAuthenticationType.AWS_IAM },
    authAccessKeyId: 'testAccessKeyId',
    accountId: 'testAccount',
  };
  it('should return authRole when the accessKeyId matches', () => {
    const iamToken = extractIamToken(
      `AWS4-HMAC-SHA256 Credential=${appSyncConfig.authAccessKeyId}/${new Date().toISOString()}/someService/aaa`,
      appSyncConfig,
    );
    expect(iamToken.userArn).toEqual(`arn:aws:sts::${appSyncConfig.accountId}:${appSyncConfig.authRoleName}`);
  });

  it('should return unAuth user when accessKeyId does not match', () => {
    const iamToken = extractIamToken(
      `AWS4-HMAC-SHA256 Credential=AKIUNAUTHAcceeKeyId/${new Date().toISOString()}/someService/aaa`,
      appSyncConfig,
    );
    expect(iamToken.userArn).toEqual(`arn:aws:sts::${appSyncConfig.accountId}:${appSyncConfig.unAuthRoleName}`);
  });

  it('should throw accessKeyId error when IAM token is not in the right format', () => {
    expect(() => extractIamToken(`AWS4-HMAC-SHA256 `, appSyncConfig)).toThrowError('missing accessKeyId');
  });
  
});
