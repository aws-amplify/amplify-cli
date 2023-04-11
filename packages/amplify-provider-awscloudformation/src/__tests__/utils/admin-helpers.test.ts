import { prompter } from '@aws-amplify/amplify-prompts';
import { isAmplifyAdminApp } from '../../utils/admin-helpers';
import fetch, { Response } from 'node-fetch';
import { AmplifyFault } from '@aws-amplify/amplify-cli-core';

jest.mock('node-fetch');
jest.mock('@aws-amplify/amplify-prompts');

const prompterMock = prompter as jest.Mocked<typeof prompter>;
const fetchMock = fetch as jest.MockedFunction<typeof fetch>;

describe('isAmplifyAdminApp', () => {
  const testUserPoolId = 'testUserPoolId';
  // the only reason this needs to be a real region is becuase the test uses the region to look up a regional URL. But it does not actually query the URL
  const testRegion = 'eu-south-1';
  it('uses us-east-1 response to determine true region', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({
          appId: '1234',
          region: testRegion,
        }),
      } as unknown as Response)
      .mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          appId: '1234',
          region: testRegion,
          loginAuthConfig: JSON.stringify({ aws_user_pools_id: testUserPoolId }),
        }),
      } as unknown as Response);
    await expect(isAmplifyAdminApp('1234')).resolves.toEqual({ isAdminApp: true, region: testRegion, userPoolID: testUserPoolId });
  });

  it('prompts for fallback region if us-east-1 AppState unavailable', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: false, // simulates us-east-1 AppState unavailable
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({
          appId: '1234',
          region: testRegion,
          loginAuthConfig: JSON.stringify({ aws_user_pools_id: `${testUserPoolId}1` }),
        }),
      } as unknown as Response);
    prompterMock.pick.mockResolvedValueOnce(testRegion);
    await expect(isAmplifyAdminApp('1234')).resolves.toEqual({ isAdminApp: true, region: testRegion, userPoolID: `${testUserPoolId}1` });
  });

  it('throws AmplifyFault if AppState unavailable in supplied region', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: false, // simulates us-east-1 AppState unavailable
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: false, // simulates actual region unavailable
      } as unknown as Response);
    prompterMock.pick.mockResolvedValueOnce(testRegion);
    await expect(isAmplifyAdminApp('1234')).rejects.toMatchInlineSnapshot(
      `[ServiceCallFault: AppState in region eu-south-1 returned status undefined]`,
    );
  });
});
