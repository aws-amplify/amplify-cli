import { stateManager } from 'amplify-cli-core';
import { ensureAmplifyMetaFrontendConfig } from '../../../extensions/amplify-helpers/on-category-outputs-change';

jest.mock('amplify-cli-core');

const stateManager_mock = stateManager as jest.Mocked<typeof stateManager>;
stateManager_mock.getMeta.mockReturnValue({ auth: { authResource: { service: 'Cognito' } } });
stateManager_mock.getResourceParametersJson.mockReturnValue({
  usernameAttributes: ['EMAIL'],
  requiredAttributes: ['EMAIL'],
  passwordPolicyMinLength: 10,
  mfaConfiguration: 'ON',
  mfaTypes: ['SMS Text Message'],
  authProvidersUserPool: ['Google', 'Facebook', 'LoginWithAmazon', 'SignInWithApple'],
});

stateManager_mock.setMeta.mockImplementation(jest.fn());

describe('ensureAmplifyMetaFrontendConfig', () => {
  it('should add front end config to amplify meta', () => {
    ensureAmplifyMetaFrontendConfig();
    expect(stateManager_mock.setMeta).lastCalledWith(undefined, {
      auth: {
        authResource: {
          frontendAuthConfig: {
            usernameAttributes: ['EMAIL'],
            socialProviders: ['GOOGLE', 'FACEBOOK', 'AMAZON', 'APPLE'],
            mfaConfiguration: 'ON',
            mfaTypes: ['SMS'],
            passwordProtectionSettings: { passwordPolicyCharacters: [], passwordPolicyMinLength: 10 },
            signupAttributes: ['EMAIL'],
            verificationMechanisms: [],
          },
          service: 'Cognito',
        },
      },
    });
  });
});
