import { AmplifyUserPoolGroupTransform } from '../../../../provider-utils/awscloudformation/auth-stack-builder';
import { $TSContext } from 'amplify-cli-core';

jest.mock('amplify-cli-core', () => ({
  ...(jest.requireActual('amplify-cli-core') as {}),
  stateManager: {
    getLocalEnvInfo: jest.fn().mockReturnValue('testenv'),
  },
  pathManager: {
    getBackendDirPath: jest.fn().mockReturnValue('..'),
  },
  JSONUtilities: {
    readJson: jest
      .fn()
      .mockReturnValueOnce([
        {
          groupName: 'adin',
          precedence: 1,
        },
      ])
      .mockReturnValueOnce([
        {
          groupName: 'adinmock',
          precedence: 2,
        },
      ]),
  },
  buildOverrideDir: jest.fn().mockResolvedValue(false),
  writeCFNTemplate: jest.fn(),
}));

const getCLIInputPayload_mock = jest.fn().mockReturnValue({
  cognitoConfig: {
    identityPoolName: 'extauth387063394_identitypool_87063394',
    resourceName: 'extauth38706339487063394',
  },
});

const isCLIInputsValid_mock = jest.fn().mockReturnValue('true');

jest.mock('../../../../provider-utils/awscloudformation/auth-inputs-manager/auth-input-state.ts', () => {
  return {
    AuthInputState: jest.fn().mockImplementation(() => {
      return {
        getCLIInputPayload: getCLIInputPayload_mock,
        isCLIInputsValid: isCLIInputsValid_mock,
      };
    }),
  };
});

const context_stub = {};

const context_stub_typed = context_stub as unknown as $TSContext;
describe('Check UserPool Group Template', () => {
  it('Generated rootstack template during Push one group', async () => {
    // CFN transform for UserPool Group stack

    const resourceName = 'mockResource';
    const userPoolTransform = new AmplifyUserPoolGroupTransform(resourceName);
    const mock_template = await userPoolTransform.transform(context_stub_typed);
    expect(mock_template).toMatchSnapshot();
  });

  it('Generated rootstack template during Push with two groups', async () => {
    // CFN transform for UserPool Group stack

    const resourceName = 'mockResource';
    const userPoolTransform = new AmplifyUserPoolGroupTransform(resourceName);
    const mock_template = await userPoolTransform.transform(context_stub_typed);
    expect(mock_template).toMatchSnapshot();
  });
});
