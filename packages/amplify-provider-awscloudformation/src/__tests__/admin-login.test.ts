import { $TSContext, $TSAny } from '@aws-amplify/amplify-cli-core';
import * as adminLogin from '../admin-login';
import { AmplifySpinner } from '@aws-amplify/amplify-prompts';

jest.mock('@aws-amplify/amplify-cli-core', () => {
  return {
    open: jest.fn().mockReturnValue(Promise.reject('some spawn error')),
  };
});

jest.mock('../utils/admin-login-server', () => {
  return {
    AdminLoginServer: jest.fn().mockReturnValue({
      startServer: jest.fn().mockImplementation((callback) => {
        callback();
      }),
      shutdown: jest.fn(),
    }),
  };
});

describe('adminLoginFlow', () => {
  let contextStub: $TSContext;

  beforeEach(() => {
    jest.clearAllMocks();

    contextStub = {
      amplify: {
        getEnvInfo: () => {
          return {
            envName: 'dev',
          };
        },
      },
    } as unknown as $TSContext;
  });

  it('catches errors when fails to launch browser', async () => {
    const appId = 'appid';
    const region = 'us-east-2';

    const spinnerStartMock = jest.spyOn(AmplifySpinner.prototype, 'start');
    const spinnerStopMock = jest.spyOn(AmplifySpinner.prototype, 'stop');

    await adminLogin.adminLoginFlow(contextStub, appId, undefined, region);

    expect(spinnerStartMock).toBeCalledTimes(1);
    expect(spinnerStartMock).toBeCalledWith('Manually enter your CLI login key:\n');

    expect(spinnerStopMock).toBeCalledTimes(1);
    expect(spinnerStopMock).toBeCalledWith('Successfully received Amplify Studio tokens.');
  });

  it('should call closeReadline', async () => {
    const appId = 'appid';
    const region = 'us-east-2';

    const closeReadlineSpy = jest.spyOn(adminLogin as $TSAny, 'closeReadline');
    await adminLogin.adminLoginFlow(contextStub, appId, undefined, region);
    expect(closeReadlineSpy).toBeCalledTimes(1);
    closeReadlineSpy.mockRestore();
  });
});
