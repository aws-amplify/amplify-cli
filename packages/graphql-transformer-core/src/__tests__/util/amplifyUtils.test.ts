import { getSanityCheckRulesFactory, SanityCheckRules } from '../../util/amplifyUtils';
import { AmplifyCLIFeatureFlagAdapter } from '../../../../amplify-provider-awscloudformation/src/utils/amplify-cli-feature-flag-adapter';
import { FeatureFlags } from 'amplify-cli-core';

jest.mock('amplify-cli-core');

describe('get sanity check rules', () => {
  test('empty list when api is in create status', () => {
    const ff_mock = new AmplifyCLIFeatureFlagAdapter();
    (<any>FeatureFlags.getBoolean).mockReturnValue(true);
    const sanityCheckRules: SanityCheckRules = getSanityCheckRulesFactory(true, ff_mock);
    expect(sanityCheckRules.diffRules.length).toBe(0);
    expect(sanityCheckRules.projectRules.length).toBe(0);
  });

  test('sanitycheck rule list when api is in update status and ff enabled', () => {
    const ff_mock = new AmplifyCLIFeatureFlagAdapter();
    (<any>FeatureFlags.getBoolean).mockReturnValue(true);
    const sanityCheckRules: SanityCheckRules = getSanityCheckRulesFactory(false, ff_mock);
    expect(sanityCheckRules.diffRules.length).toBe(4);
    expect(sanityCheckRules.projectRules.length).toBe(1);
  });

  test('sanitycheck rule list when api is in update status and no ff enabled', () => {
    const ff_mock = new AmplifyCLIFeatureFlagAdapter();
    (<any>FeatureFlags.getBoolean).mockReturnValue(false);
    const sanityCheckRules: SanityCheckRules = getSanityCheckRulesFactory(false, ff_mock);
    expect(sanityCheckRules.diffRules.length).toBe(6);
    expect(sanityCheckRules.projectRules.length).toBe(2);
  });
});
