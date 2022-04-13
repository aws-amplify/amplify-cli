import { getSanityCheckRules, SanityCheckRules } from '../../util/amplifyUtils';
import { FeatureFlags } from 'amplify-cli-core';

jest.mock('amplify-cli-core');

const buildMockedFeatureFlags = (flagValue: boolean) => {
  return {
    getBoolean: jest.fn(() => flagValue),
    getString: jest.fn(),
    getNumber: jest.fn(),
    getObject: jest.fn(),
  };
};

describe('get sanity check rules', () => {
  test('empty list when api is in create status', () => {
    const sanityCheckRules: SanityCheckRules = getSanityCheckRules(true, buildMockedFeatureFlags(true));
    expect(sanityCheckRules.diffRules.length).toBe(0);
    expect(sanityCheckRules.projectRules.length).toBe(0);
  });

  test('sanitycheck rule list when api is in update status and ff enabled', () => {
    const sanityCheckRules: SanityCheckRules = getSanityCheckRules(false, buildMockedFeatureFlags(true));
    const diffRulesFn = sanityCheckRules.diffRules.map(func => func.name);
    const projectRulesFn = sanityCheckRules.projectRules.map(func => func.name);
    expect(diffRulesFn).toMatchSnapshot();
    expect(projectRulesFn).toMatchSnapshot();
  });

  test('sanitycheck rule list when api is in update status and no ff enabled', () => {
    const sanityCheckRules: SanityCheckRules = getSanityCheckRules(false, buildMockedFeatureFlags(false));
    const diffRulesFn = sanityCheckRules.diffRules.map(func => func.name);
    const projectRulesFn = sanityCheckRules.projectRules.map(func => func.name);
    expect(diffRulesFn).toMatchSnapshot();
    expect(projectRulesFn).toMatchSnapshot();
  });

  test('sanity check rule list when destructive changes flag is present and ff enabled', () => {
    const sanityCheckRules: SanityCheckRules = getSanityCheckRules(false, buildMockedFeatureFlags(true), true);
    const diffRulesFn = sanityCheckRules.diffRules.map(func => func.name);
    const projectRulesFn = sanityCheckRules.projectRules.map(func => func.name);
    expect(diffRulesFn).toMatchSnapshot();
    expect(projectRulesFn).toMatchSnapshot();
  });

  test('sanity check rule list when destructive changes flag is present but ff not enabled', () => {
    const sanityCheckRules: SanityCheckRules = getSanityCheckRules(false, buildMockedFeatureFlags(false), true);
    const diffRulesFn = sanityCheckRules.diffRules.map(func => func.name);
    const projectRulesFn = sanityCheckRules.projectRules.map(func => func.name);
    expect(diffRulesFn).toMatchSnapshot();
    expect(projectRulesFn).toMatchSnapshot();
  });
});
