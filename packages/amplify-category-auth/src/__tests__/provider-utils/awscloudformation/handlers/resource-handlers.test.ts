import { stateManager } from '@aws-amplify/amplify-cli-core';
import { getUpdateAuthHandler } from '../../../../provider-utils/awscloudformation/handlers/resource-handlers';
import { getSupportedServices } from '../../../../provider-utils/supported-services';
import { getUpdateAuthDefaultsApplier } from '../../../../provider-utils/awscloudformation/utils/auth-defaults-appliers';
import { AuthInputState } from '../../../../provider-utils/awscloudformation/auth-inputs-manager/auth-input-state';
import { getPostUpdateAuthMetaUpdater } from '../../../../provider-utils/awscloudformation/utils/amplify-meta-updaters';
import { getPostUpdateAuthMessagePrinter } from '../../../../provider-utils/awscloudformation/utils/message-printer';
import { removeDeprecatedProps } from '../../../../provider-utils/awscloudformation/utils/synthesize-resources';
import { ENV_SPECIFIC_PARAMS } from '../../../../provider-utils/awscloudformation/constants';
import { AuthContext, CognitoConfiguration } from '../../../../context';

jest.mock('../../../../provider-utils/awscloudformation/utils/synthesize-resources');
jest.mock('../../../../provider-utils/awscloudformation/utils/auth-defaults-appliers');
jest.mock('../../../../provider-utils/supported-services');
jest.mock('../../../../provider-utils/awscloudformation/auth-inputs-manager/auth-input-state');
jest.mock('../../../../provider-utils/awscloudformation/utils/generate-auth-stack-template');
jest.mock('../../../../provider-utils/awscloudformation/utils/message-printer');
// eslint-disable-next-line spellcheck/spell-checker
jest.mock('../../../../provider-utils/awscloudformation/utils/amplify-meta-updaters');
jest.mock('../../../../provider-utils/awscloudformation/utils/auth-sms-workflow-helper');
jest.mock('@aws-amplify/amplify-cli-core');

const getSupportedServicesMock = getSupportedServices as jest.MockedFunction<typeof getSupportedServices>;
getSupportedServicesMock.mockReturnValue({
  test: {
    defaultValuesFilename: 'test',
  },
});

const testConfig = ENV_SPECIFIC_PARAMS.reduce((acc, it) => ({ ...acc, [it]: 'test' }), {} as Record<string, string>);
testConfig.nonEnvSpecificParam = 'something';

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
removeDeprecatedPropsMock.mockImplementation((input) => input);

const AuthInputStateMock = AuthInputState as jest.MockedClass<typeof AuthInputState>;
const saveCLIInputPayloadMock = jest.fn();
AuthInputStateMock.mockImplementation(
  () =>
    ({
      saveCLIInputPayload: saveCLIInputPayloadMock,
    } as unknown as AuthInputState),
);

describe('getUpdateAuthHandler', () => {
  it('filters cliInputs on env specific params', async () => {
    const saveParamsFn = jest.fn();
    const contextStub = {
      amplify: {
        saveEnvResourceParameters: saveParamsFn,
      },
    } as unknown as AuthContext;
    const cognitoConfig: CognitoConfiguration = {
      serviceName: 'test',
    } as unknown as CognitoConfiguration;

    await getUpdateAuthHandler(contextStub)(cognitoConfig);
    const { cognitoConfig: actualCliInputsFileContent } = saveCLIInputPayloadMock.mock.calls[0][0];
    expect(Object.keys(actualCliInputsFileContent).some((key) => ENV_SPECIFIC_PARAMS.includes(key))).toBe(false);
    expect(actualCliInputsFileContent.nonEnvSpecificParam).toBe('something');
  });
});
