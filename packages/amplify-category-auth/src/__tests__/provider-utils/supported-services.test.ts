import { FeatureFlags } from 'amplify-cli-core';
import { getSupportedServices } from '../../provider-utils/supported-services';
// There are 60 inputs defined in ../../provider-utils/supported-services
// We want to remove one of them depending on the value of the forceAliasAttributes feature flag
// This number may need to be changed if Cognito inputs are intentionally added or removed
const NUM_COGNITO_INPUTS = 59;
describe('auth.forceAliasAttributes feature flag works', () => {
  it('when flag is false, usernameAttributes are used instead of aliasAttributes', async () => {
    FeatureFlags.getBoolean = () => false;
    const result = getSupportedServices();
    expect(result.Cognito.inputs.length).toBe(NUM_COGNITO_INPUTS);

    const usernameAttributesInput = result.Cognito.inputs.find((input: any) => input.key === 'usernameAttributes');
    expect(usernameAttributesInput).toBeTruthy();

    const aliasAttributesInput = result.Cognito.inputs.find((input: any) => input.key === 'aliasAttributes');
    expect(aliasAttributesInput).toBeFalsy();
  });
  it('when flag is true, aliasAttributes are used instead of usernameAttributes', async () => {
    FeatureFlags.getBoolean = () => true;
    const result = getSupportedServices();
    expect(result.Cognito.inputs.length).toBe(NUM_COGNITO_INPUTS);

    const usernameAttributesInput = result.Cognito.inputs.find((input: any) => input.key === 'usernameAttributes');
    expect(usernameAttributesInput).toBeFalsy();

    const aliasAttributesInput = result.Cognito.inputs.find((input: any) => input.key === 'aliasAttributes');
    expect(aliasAttributesInput).toBeTruthy();
  });
});
