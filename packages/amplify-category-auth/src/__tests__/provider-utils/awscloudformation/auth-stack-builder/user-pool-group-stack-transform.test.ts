import { $TSContext } from '@aws-amplify/amplify-cli-core';
import { AmplifyUserPoolGroupTransform } from '../../../../provider-utils/awscloudformation/auth-stack-builder';

jest.mock('@aws-amplify/amplify-cli-core', () => ({
  ...(jest.requireActual('@aws-amplify/amplify-cli-core') as Record<string, unknown>),
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
          customPolicies: [
            {
              PolicyName: 'analytics-pinpoint-policy',
              PolicyDocument: {
                Version: '2012-10-17',
                Statement: [
                  {
                    Effect: 'Allow',
                    Action: ['mockActions'],
                    Resource: ['mockArn'],
                  },
                ],
              },
            },
          ],
        },
      ]),
    stringify: jest.fn().mockImplementation(JSON.stringify),
    parse: jest.fn().mockImplementation(JSON.parse),
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
  it('Generated userpool group stack template during Push one group', async () => {
    // CFN transform for UserPool Group stack

    const resourceName = 'mockResource';
    const userPoolTransform = new AmplifyUserPoolGroupTransform(resourceName);
    const mockTemplate = await userPoolTransform.transform(contextStubTyped);
    expect(mockTemplate).toMatchSnapshot();
  });

  it('Generated userpool group stack template during Push with two groups', async () => {
    // CFN transform for UserPool Group stack

    const resourceName = 'mockResource';
    const userPoolTransform = new AmplifyUserPoolGroupTransform(resourceName);
    const mockTemplate = await userPoolTransform.transform(contextStubTyped);
    expect(mockTemplate).toMatchSnapshot();
  });
});
