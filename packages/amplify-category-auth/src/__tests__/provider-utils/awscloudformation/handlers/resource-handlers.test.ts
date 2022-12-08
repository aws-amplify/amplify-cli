import { $TSContext, stateManager } from 'amplify-cli-core';
import { getUpdateAuthHandler } from '../../../../provider-utils/awscloudformation/handlers/resource-handlers';
import { CognitoConfiguration } from '../../../../provider-utils/awscloudformation/service-walkthrough-types/awsCognito-user-input-types';
import { getSupportedServices } from '../../../../provider-utils/supported-services';
import { getUpdateAuthDefaultsApplier } from '../../../../provider-utils/awscloudformation/utils/auth-defaults-appliers';
import { AuthInputState } from '../../../../provider-utils/awscloudformation/auth-inputs-manager/auth-input-state';
import { getPostUpdateAuthMetaUpdater } from '../../../../provider-utils/awscloudformation/utils/amplify-meta-updaters';
import { getPostUpdateAuthMessagePrinter } from '../../../../provider-utils/awscloudformation/utils/message-printer';
import { removeDeprecatedProps } from '../../../../provider-utils/awscloudformation/utils/synthesize-resources';

jest.mock('../../../../provider-utils/awscloudformation/utils/synthesize-resources');
jest.mock('../../../../provider-utils/awscloudformation/utils/auth-defaults-appliers');
jest.mock('../../../../provider-utils/supported-services');
jest.mock('../../../../provider-utils/awscloudformation/auth-inputs-manager/auth-input-state');
jest.mock('../../../../provider-utils/awscloudformation/utils/generate-auth-stack-template');
jest.mock('../../../../provider-utils/awscloudformation/utils/message-printer');
// eslint-disable-next-line spellcheck/spell-checker
jest.mock('../../../../provider-utils/awscloudformation/utils/amplify-meta-updaters');
jest.mock('../../../../provider-utils/awscloudformation/utils/auth-sms-workflow-helper');
jest.mock('amplify-cli-core');

const getSupportedServicesMock = getSupportedServices as jest.MockedFunction<typeof getSupportedServices>;
getSupportedServicesMock.mockReturnValue({
  test: {
    defaultValuesFilename: 'test',
  },
});

const testConfig = {
  hostedUIProviderCreds: 'testProviderCreds',
};

const getUpdateAuthDefaultsApplierMock = getUpdateAuthDefaultsApplier as jest.MockedFunction<typeof getUpdateAuthDefaultsApplier>;
getUpdateAuthDefaultsApplierMock.mockReturnValue(jest.fn().mockReturnValue({ ...testConfig }));

const stateManagerMock = stateManager as jest.Mocked<typeof stateManager>;
stateManagerMock.getMeta.mockReturnValue({
  auth: {},
});

const getPostUpdateAuthMetaUpdaterMock = getPostUpdateAuthMetaUpdater as jest.MockedFunction<typeof getPostUpdateAuthMetaUpdater>;
getPostUpdateAuthMetaUpdaterMock.mockReturnValue(jest.fn());

const getPostUpdateAuthMessagePrinterMock = getPostUpdateAuthMessagePrinter as jest.MockedFunction<typeof getPostUpdateAuthMessagePrinter>;
getPostUpdateAuthMessagePrinterMock.mockReturnValue(jest.fn());

const removeDeprecatedPropsMock = removeDeprecatedProps as jest.MockedFunction<typeof removeDeprecatedProps>;
removeDeprecatedPropsMock.mockImplementation(input => input);

const AuthInputStateMock = AuthInputState as jest.MockedClass<typeof AuthInputState>;
AuthInputStateMock.mockImplementation(() => ({
  saveCLIInputPayload: jest.fn(),
} as unknown as AuthInputState));

describe('getUpdateAuthHandler', () => {
  it('filters cliInputs on env specific params', async () => {
    const saveParamsFn = jest.fn();
    const contextStub = {
      amplify: {
        saveEnvResourceParameters: saveParamsFn,
      },
    } as unknown as $TSContext;
    const cognitoConfig: CognitoConfiguration = {
      serviceName: 'test',
    } as unknown as CognitoConfiguration;

    await getUpdateAuthHandler(contextStub)(cognitoConfig);
    expect(saveParamsFn.mock.calls[0][3]).toEqual(testConfig);
  });
});
