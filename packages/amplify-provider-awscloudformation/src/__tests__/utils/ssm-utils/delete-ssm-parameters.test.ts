import { $TSContext } from '@aws-amplify/amplify-cli-core';
import { SSM } from '../../../aws-utils/aws-ssm';
import { deleteEnvironmentParametersFromService } from '../../../utils/ssm-utils/delete-ssm-parameters';
import {
  getSsmSdkParametersDeleteParameters,
  getSsmSdkParametersGetParametersByPath,
} from '../../../utils/ssm-utils/get-ssm-sdk-parameters';
import { DeleteParametersCommand, GetParametersByPathCommand, GetParametersByPathResult, SSMClient } from '@aws-sdk/client-ssm';
import { mockClient } from 'aws-sdk-client-mock';
import 'aws-sdk-client-mock-jest';

jest.mock('../../../aws-utils/aws-ssm');

const fakeAppId = 'fakeAppId';
const keyPrefix = '/amplify/id/dev/';
let keys: Array<string> = ['AMPLIFY_one', 'AMPLIFY_two', 'toBeIgnored'];
let expectedKeys: Array<string> = ['AMPLIFY_one', 'AMPLIFY_two'];
keys = keys.map((key) => keyPrefix + key);
expectedKeys = expectedKeys.map((key) => keyPrefix + key);
const envName: string = 'dev';
const contextStub = {
  exeInfo: {
    inputParams: {
      amplify: {
        appId: fakeAppId,
      },
    },
  },
};
const mockSSMClient = mockClient(SSMClient);

describe('parameters-delete-handler', () => {
  beforeEach(() => {
    mockSSMClient.reset();
  });
  it('check if returned function is called once with correct paramater', async () => {
    const mockGetParamatersReturnedObject: GetParametersByPathResult = {
      Parameters: keys.map((key) => {
        return { Name: key };
      }),
    };

    const mockSSM = SSM as jest.Mocked<typeof SSM>;
    mockSSM.getInstance = jest.fn().mockResolvedValue({
      client: mockSSMClient as unknown as SSMClient,
    });

    mockSSMClient.on(DeleteParametersCommand).resolvesOnce({});
    mockSSMClient.on(GetParametersByPathCommand).resolvesOnce(mockGetParamatersReturnedObject);

    await deleteEnvironmentParametersFromService(contextStub as unknown as $TSContext, envName);
    expect(mockSSMClient).toHaveReceivedCommandTimes(DeleteParametersCommand, 1);
    const expectedDeleteParamater = getSsmSdkParametersDeleteParameters(expectedKeys);
    expect(mockSSMClient).toHaveReceivedCommandWith(DeleteParametersCommand, expectedDeleteParamater);

    expect(mockSSMClient).toHaveReceivedCommandTimes(GetParametersByPathCommand, 1);
    const expectedGetParamater = getSsmSdkParametersGetParametersByPath(fakeAppId, envName);
    expect(mockSSMClient).toHaveReceivedCommandWith(GetParametersByPathCommand, expectedGetParamater);
  });
});
