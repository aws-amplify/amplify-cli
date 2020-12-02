import { AddAuthRequest, CognitoUserPoolSigninMethod, CognitoUserProperty, UpdateAuthRequest } from 'amplify-headless-interface';
import {
  getAddAuthRequestAdaptor,
  getUpdateAuthRequestAdaptor,
} from '../../../../provider-utils/awscloudformation/utils/auth-request-adaptors';

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

describe('get update auth request adaptor', () => {
  describe('valid translations', () => {
    it('translates empty oAuth config into hostedUI: false', () => {
      const updateAuthRequest: UpdateAuthRequest = {
        version: 1,
        serviceModification: {
          serviceName: 'Cognito',
          userPoolModification: {
            oAuth: {},
          },
          includeIdentityPool: false,
        },
      };

      expect(getUpdateAuthRequestAdaptor('javascript', ['required_attribute'])(updateAuthRequest)).toMatchSnapshot();
    });
  });
});
