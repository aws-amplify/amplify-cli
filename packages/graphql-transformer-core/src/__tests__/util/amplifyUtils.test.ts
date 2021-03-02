import { getSanityCheckRulesFactory } from '../../util/amplifyUtils';
import { AmplifyCLIFeatureFlagAdapter } from '../../../../amplify-provider-awscloudformation/src/utils/amplify-cli-feature-flag-adapter';

jest.mock('../../../../amplify-provider-awscloudformation/src/utils/amplify-cli-feature-flag-adapter');
describe('get sanity check rules', () => {
  const ffString = 'enableIterativeGSIUpdates';
  it('empty list when api is in create status', () => {
    let ff_mock = new AmplifyCLIFeatureFlagAdapter();
    ff_mock = {
      getBoolean: jest.fn().mockImplementation((name, defaultValue) => {
        if (name === ffString) {
          return true;
        }
      }),
      getNumber: jest.fn(),
      getObject: jest.fn(),
      getString: jest.fn(),
      getValue: jest.fn(),
    };

    expect(getSanityCheckRulesFactory(true, ff_mock)).toMatchSnapshot();
  });
});
