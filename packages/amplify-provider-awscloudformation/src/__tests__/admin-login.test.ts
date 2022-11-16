import { $TSContext } from 'amplify-cli-core';
import { adminLoginFlow } from '../admin-login';
import { AmplifySpinner } from 'amplify-prompts';

jest.mock('amplify-cli-core', () => {
  return {
    open: jest.fn().mockReturnValue(Promise.reject('some spawn error')),
  }
});

jest.mock('../utils/admin-login-server', () => {
  return {
    AdminLoginServer: jest.fn().mockReturnValue({
      startServer: jest.fn().mockImplementation((callback) => {
        callback();
      }),
      shutdown: jest.fn(),
    })
  }
});

describe('adminLoginFlow', () => {
  let contextStub: $TSContext;

  beforeEach(() => {
    jest.clearAllMocks();

    contextStub = ({
      amplify: {
        getEnvInfo: () => {
          return {
            envName: 'dev'
          }
        }
      },
    } as unknown) as $TSContext;
  });

  it('catches errors when fails to launch browser', async () => {
    const appId = 'appid';
    const region = 'us-east-2';

    const spinnerStartMock = jest.spyOn(AmplifySpinner.prototype, 'start');
    const spinnerStopMock = jest.spyOn(AmplifySpinner.prototype, 'stop');

    await adminLoginFlow(contextStub, appId, undefined, region);

    expect(spinnerStartMock).toBeCalledTimes(1);
    expect(spinnerStartMock).toBeCalledWith('Manually enter your CLI login key:\n');

    expect(spinnerStopMock).toBeCalledTimes(1);
    expect(spinnerStopMock).toBeCalledWith("Successfully received Amplify Studio tokens.");
  });
});
