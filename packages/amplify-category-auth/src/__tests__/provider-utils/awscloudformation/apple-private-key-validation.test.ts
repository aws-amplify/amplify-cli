import { FeatureFlags } from '@aws-amplify/amplify-cli-core';
import { getSupportedServices } from '../../../provider-utils/supported-services';

describe('sign in with apple private key validation', () => {
  afterEach(() => jest.restoreAllMocks());

  it.each(['', ' ', '  ', '\t', '\t\t', ' \t '])('rejects an empty payload %j', (payload) => {
    jest.spyOn(FeatureFlags, 'getBoolean').mockReturnValue(false);
    const input = getSupportedServices().Cognito.inputs.find(
      (entry: { readonly key: string }) => entry.key === 'signinwithapplePrivateKeyUserPool',
    );
    expect(input).toBeDefined();
    expect(new RegExp(input.validation.value).test(`-----BEGIN PRIVATE KEY-----${payload}-----END PRIVATE KEY-----`)).toBe(false);
  });

  it.each(['QUJDRA==', ' QUJDRA== ', '\tQUJDRA==\t', 'QUJD RA==', 'aB+/cD=='])('accepts a populated payload %j', (payload) => {
    jest.spyOn(FeatureFlags, 'getBoolean').mockReturnValue(false);
    const input = getSupportedServices().Cognito.inputs.find(
      (entry: { readonly key: string }) => entry.key === 'signinwithapplePrivateKeyUserPool',
    );
    expect(input).toBeDefined();
    expect(new RegExp(input.validation.value).test(`-----BEGIN PRIVATE KEY-----${payload}-----END PRIVATE KEY-----`)).toBe(true);
  });
});
