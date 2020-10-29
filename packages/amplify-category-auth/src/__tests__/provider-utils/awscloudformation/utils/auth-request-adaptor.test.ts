import { AddAuthRequest, CognitoUserPoolSigninMethod, CognitoUserProperty } from 'amplify-headless-interface';
import { getAddAuthRequestAdaptor } from '../../../../provider-utils/awscloudformation/utils/auth-request-adaptors';

describe('get add auth request adaptor', () => {
  describe('valid translations', () => {
    it('translates request with minimal user pool config only', () => {
      const addAuthRequest: AddAuthRequest = {
        version: 1,
        resourceName: 'myTestAuth',
        serviceConfiguration: {
          serviceName: 'Cognito',
          userPoolConfiguration: {
            signinMethod: CognitoUserPoolSigninMethod.EMAIL,
            requiredSignupAttributes: [CognitoUserProperty.EMAIL],
          },
          includeIdentityPool: false,
        },
      };

      expect(getAddAuthRequestAdaptor('javascript')(addAuthRequest)).toMatchSnapshot();
    });
  });
});
