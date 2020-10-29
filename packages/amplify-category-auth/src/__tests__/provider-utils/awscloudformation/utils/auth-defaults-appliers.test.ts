import { ServiceQuestionsResult } from '../../../../provider-utils/awscloudformation/service-walkthrough-types';
import { structureOAuthMetadata } from '../../../../provider-utils/awscloudformation/service-walkthroughs/auth-questions';
import { getUpdateAuthDefaultsApplier } from '../../../../provider-utils/awscloudformation/utils/auth-defaults-appliers';

jest.mock(`../../../../provider-utils/awscloudformation/assets/cognito-defaults.js`, () => ({
  functionMap: {
    userPoolOnly: () => ({ some: 'default value' }),
  },
  getAllDefaults: jest.fn(),
}));

jest.mock('../../../../provider-utils/awscloudformation/service-walkthroughs/auth-questions', () => ({
  structureOAuthMetadata: jest.fn(result => (result.include = 'this value')),
}));

const structureOAuthMetadata_mock = structureOAuthMetadata as jest.MockedFunction<typeof structureOAuthMetadata>;

describe('update auth defaults applier', () => {
  it('calls structureOAuthMetadata', async () => {
    const stubResult = {
      useDefault: 'manual',
      authSelections: 'userPoolOnly',
    } as ServiceQuestionsResult;

    const result = await getUpdateAuthDefaultsApplier({}, 'cognito-defaults.js', {} as ServiceQuestionsResult)(stubResult);
    expect(result).toMatchSnapshot();
    expect(structureOAuthMetadata_mock.mock.calls.length).toBe(1);
  });
});
