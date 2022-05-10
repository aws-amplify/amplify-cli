import { $TSContext } from 'amplify-cli-core';
import { AmplifyUserPoolGroupTransform } from '../../../../provider-utils/awscloudformation/auth-stack-builder';

jest.mock('amplify-cli-core', () => ({
  ...(jest.requireActual('amplify-cli-core') as Record<string, unknown>),
  stateManager: {
    getLocalEnvInfo: jest.fn().mockReturnValue('testEnv'),
  },
  pathManager: {
    getBackendDirPath: jest.fn().mockReturnValue('..'),
  },
  JSONUtilities: {
    writeJson: jest.fn(),
    readJson: jest
      .fn()
      .mockReturnValueOnce([
        {
          groupName: 'admin',
          precedence: 1,
        },
      ])
      .mockReturnValueOnce([
        {
          groupName: 'adminMock',
          precedence: 2,
        },
      ]),
  },
  buildOverrideDir: jest.fn().mockResolvedValue(false),
  writeCFNTemplate: jest.fn(),
}));

const getCLIInputPayloadMock = jest.fn().mockReturnValue({
  cognitoConfig: {
    identityPoolName: 'testIdentityPoolName',
    resourceName: 'testAuthResourceName',
  },
});

const isCLIInputsValidMock = jest.fn().mockReturnValue('true');

jest.mock('../../../../provider-utils/awscloudformation/auth-inputs-manager/auth-input-state.ts', () => ({
  AuthInputState: jest.fn().mockImplementation(() => ({
    getCLIInputPayload: getCLIInputPayloadMock,
    isCLIInputsValid: isCLIInputsValidMock,
  })),
}));

const contextStub = {};

const contextStubTyped = contextStub as unknown as $TSContext;
describe('Check UserPool Group Template', () => {
  it('Generated root stack template during Push one group', async () => {
    // CFN transform for UserPool Group stack

    const resourceName = 'mockResource';
    const userPoolTransform = new AmplifyUserPoolGroupTransform(resourceName);
    const mockTemplate = await userPoolTransform.transform(contextStubTyped);
    expect(mockTemplate).toMatchSnapshot();
  });

  it('Generated root stack template during Push with two groups', async () => {
    // CFN transform for UserPool Group stack

    const resourceName = 'mockResource';
    const userPoolTransform = new AmplifyUserPoolGroupTransform(resourceName);
    const mockTemplate = await userPoolTransform.transform(contextStubTyped);
    expect(mockTemplate).toMatchSnapshot();
  });
});
