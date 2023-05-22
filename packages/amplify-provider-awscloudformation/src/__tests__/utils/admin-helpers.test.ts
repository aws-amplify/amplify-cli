import { prompter } from '@aws-amplify/amplify-prompts';
import { isAmplifyAdminApp } from '../../utils/admin-helpers';
import fetch, { Response } from 'node-fetch';
import { stateManager, AmplifyFault } from '@aws-amplify/amplify-cli-core';

jest.mock('node-fetch');
jest.mock('@aws-amplify/amplify-prompts');
jest.mock('@aws-amplify/amplify-cli-core');

const prompterMock = prompter as jest.Mocked<typeof prompter>;
const fetchMock = fetch as jest.MockedFunction<typeof fetch>;

const stateManagerMock = stateManager as jest.Mocked<typeof stateManager>;

const AmplifyFaultMock = AmplifyFault as jest.MockedClass<typeof AmplifyFault>;

const amplifyFaultMockImpl = { name: 'AmplifyFaultMock' } as unknown as AmplifyFault;
AmplifyFaultMock.mockImplementation(() => amplifyFaultMockImpl);

describe('isAmplifyAdminApp', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  const testUserPoolId = 'testUserPoolId';
  // the only reason this needs to be a real region is becuase the test uses the region to look up a regional URL. But it does not actually query the URL
  const testRegion = 'eu-south-1';
  it('uses us-east-1 response to determine true region', async () => {
    fetchMock
      .mockResolvedValueOnce({
        status: 200,
        json: jest.fn().mockResolvedValue({
          appId: '1234',
          region: testRegion,
        }),
      } as unknown as Response)
      .mockResolvedValue({
        status: 200,
        json: jest.fn().mockResolvedValue({
          appId: '1234',
          region: testRegion,
          loginAuthConfig: JSON.stringify({ aws_user_pools_id: testUserPoolId }),
        }),
      } as unknown as Response);
    await expect(isAmplifyAdminApp('1234')).resolves.toEqual({ isAdminApp: true, region: testRegion, userPoolID: testUserPoolId });
  });

  it('gets fallback region from stateManager if us-east-1 AppState unavailable', async () => {
    fetchMock
      .mockResolvedValueOnce({
        status: 500, // simulates us-east-1 AppState unavailable
      } as unknown as Response)
      .mockResolvedValueOnce({
        status: 200,
        json: jest.fn().mockResolvedValue({
          appId: '1234',
          region: testRegion,
          loginAuthConfig: JSON.stringify({ aws_user_pools_id: `${testUserPoolId}1` }),
        }),
      } as unknown as Response);
    stateManagerMock.getCurrentRegion.mockReturnValueOnce(testRegion);
    await expect(isAmplifyAdminApp('1234')).resolves.toEqual({ isAdminApp: true, region: testRegion, userPoolID: `${testUserPoolId}1` });
    expect(prompterMock.pick).not.toHaveBeenCalled();
  });

  it('prompts for fallback region if us-east-1 AppState unavailable and amplify-meta unavailable', async () => {
    fetchMock
      .mockResolvedValueOnce({
        status: 500, // simulates us-east-1 AppState unavailable
      } as unknown as Response)
      .mockResolvedValueOnce({
        status: 200,
        json: jest.fn().mockResolvedValue({
          appId: '1234',
          region: testRegion,
          loginAuthConfig: JSON.stringify({ aws_user_pools_id: `${testUserPoolId}1` }),
        }),
      } as unknown as Response);
    stateManagerMock.getCurrentRegion.mockImplementationOnce(() => {
      throw new Error('test error');
    });
    prompterMock.pick.mockResolvedValueOnce(testRegion);
    await expect(isAmplifyAdminApp('1234')).resolves.toEqual({ isAdminApp: true, region: testRegion, userPoolID: `${testUserPoolId}1` });
  });

  it('throws AmplifyFault if AppState unavailable in supplied region', async () => {
    fetchMock
      .mockResolvedValueOnce({
        status: 500, // simulates us-east-1 AppState unavailable
      } as unknown as Response)
      .mockResolvedValueOnce({
        status: 500, // simulates actual region unavailable
      } as unknown as Response);
    stateManagerMock.getCurrentRegion.mockImplementationOnce(() => {
      throw new Error('test error');
    });
    prompterMock.pick.mockResolvedValueOnce(testRegion);
    await expect(isAmplifyAdminApp('1234')).rejects.toEqual(amplifyFaultMockImpl);
  });
});
