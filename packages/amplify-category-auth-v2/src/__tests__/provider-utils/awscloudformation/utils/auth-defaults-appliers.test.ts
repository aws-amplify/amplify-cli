import { CognitoCLIInputs } from '../../../../provider-utils/awscloudformation/service-walkthrough-types/cognito-user-input-types';
import { structureOAuthMetadata } from '../../../../provider-utils/awscloudformation/service-walkthroughs/auth-questions';
import {
  getAddAuthDefaultsApplier,
  getUpdateAuthDefaultsApplier,
} from '../../../../provider-utils/awscloudformation/utils/auth-defaults-appliers';

jest.mock(`../../../../provider-utils/awscloudformation/assets/cognito-defaults.js`, () => ({
  functionMap: {
    userPoolOnly: () => ({ some: 'default value' }),
  },
  getAllDefaults: jest.fn(),
  generalDefaults: jest.fn().mockReturnValue({ requiredAttributes: ['email'] }),
}));

jest.mock('../../../../provider-utils/awscloudformation/service-walkthroughs/auth-questions', () => ({
  structureOAuthMetadata: jest.fn(result => (result.include = 'this value')),
}));

jest.mock('amplify-cli-core', () => {
  return {
    FeatureFlags: {
      getBoolean: jest.fn().mockImplementation((name, defaultValue) => {
        if (name === 'auth.enableCaseInsensitivity') {
          return true;
        }
      }),
      getNumber: jest.fn(),
      getObject: jest.fn(),
      getString: jest.fn(),
    },
  };
});

const structureOAuthMetadata_mock = structureOAuthMetadata as jest.MockedFunction<typeof structureOAuthMetadata>;

describe('update auth defaults applier', () => {
  it('calls structureOAuthMetadata', async () => {
    const stubResult = {
      useDefault: 'manual',
      authSelections: 'userPoolOnly',
    } as CognitoCLIInputs;

    const result = await getUpdateAuthDefaultsApplier({}, 'cognito-defaults.js', {} as CognitoCLIInputs)(stubResult);
    expect(result).toMatchSnapshot();
    expect(structureOAuthMetadata_mock.mock.calls.length).toBe(1);
  });

  it('overwrites default parameters', async () => {
    const stubResult = {
      useDefault: 'manual',
      authSelections: 'userPoolOnly',
      requiredAttributes: [] as string[],
    } as CognitoCLIInputs;

    const result = await getUpdateAuthDefaultsApplier({}, 'cognito-defaults.js', {} as CognitoCLIInputs)(stubResult);
    expect(result.requiredAttributes).toEqual([]);
  });
});

describe('add auth defaults applier', () => {
  it('overwrites default parameters', async () => {
    const stubResult: CognitoCLIInputs = {
      useDefault: 'manual',
      authSelections: 'userPoolOnly',
      requiredAttributes: [] as string[],
    } as CognitoCLIInputs;

    const result = await getAddAuthDefaultsApplier({}, 'cognito-defaults.js', 'testProjectName')(stubResult);
    expect(result.requiredAttributes).toEqual([]);
  });
});
