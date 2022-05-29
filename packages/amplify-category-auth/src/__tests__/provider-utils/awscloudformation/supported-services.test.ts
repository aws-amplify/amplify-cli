import { FeatureFlags } from 'amplify-cli-core';
import { getSupportedServices } from '../../../provider-utils/supported-services';

describe('auth.forceAliasAttributes feature flag works', () => {
  it('when flag is false, usernameAttributes are used instead of aliasAttributes', async () => {
    FeatureFlags.getBoolean = () => false;
    const result = getSupportedServices();

    const usernameAttributesInput = result.Cognito.inputs.find((input: any) => input.key === 'usernameAttributes');
    expect(usernameAttributesInput).toEqual(
      expect.objectContaining({
        key: 'usernameAttributes',
      }),
    );

    const aliasAttributesInput = result.Cognito.inputs.find((input: any) => input.key === 'aliasAttributes');
    expect(aliasAttributesInput).toBeFalsy();
  });
  it('when flag is true, aliasAttributes are used instead of usernameAttributes', async () => {
    FeatureFlags.getBoolean = () => true;
    const result = getSupportedServices();

    const usernameAttributesInput = result.Cognito.inputs.find((input: any) => input.key === 'usernameAttributes');
    expect(usernameAttributesInput).toBeFalsy();

    const aliasAttributesInput = result.Cognito.inputs.find((input: any) => input.key === 'aliasAttributes');
    expect(aliasAttributesInput).toEqual(
      expect.objectContaining({
        key: 'aliasAttributes',
      }),
    );
  });
});
