import { $TSContext, exitOnNextTick } from 'amplify-cli-core';
import runBuildCommand from '../../utils/run-build-command';
import { sync } from 'execa';

jest.mock('execa', () => ({
  sync: jest.fn(),
}));

jest.mock('amplify-cli-core', () => ({
  ...jest.requireActual('amplify-cli-core'),
  spinner: {
    start: jest.fn(),
    succeed: jest.fn(),
    fail: jest.fn(),
  },
  exitOnNextTick: jest.fn(),
}));

describe('run-build-command', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('runs build command on js projects when enabled', () => {
    const context = {
      exeInfo: {
        inputParams: {
          runBuildCommand: true,
        },
        projectConfig: {
          frontend: 'javascript',
          javascript: {
            config: {
              BuildCommand: 'npm run-script build',
            },
          },
        },
      },
    } as $TSContext;

    runBuildCommand(context);
    expect(sync).toHaveBeenCalledWith('npm', ['run-script', 'build'], { stdio: 'inherit' });
  });

  it('does not run build command for non js projects', () => {
    const context = {
      exeInfo: {
        inputParams: {
          runBuildCommand: true,
        },
        projectConfig: {
          frontend: 'android',
        },
      },
    } as $TSContext;

    runBuildCommand(context);
    expect(sync).not.toHaveBeenCalled();
  });

  it('does not run build command when not enabled', () => {
    const context = {
      exeInfo: {
        inputParams: {},
        projectConfig: {
          frontend: 'javascript',
          javascript: {
            config: {
              BuildCommand: 'npm run-script build',
            },
          },
        },
      },
    } as $TSContext;

    runBuildCommand(context);
    expect(sync).not.toHaveBeenCalled();
  });

  it('does not run build command when build command is not set', () => {
    const context = {
      exeInfo: {
        inputParams: {
          runBuildCommand: true,
        },
        projectConfig: {
          frontend: 'javascript',
          javascript: {
            config: {
              BuildCommand: '',
            },
          },
        },
      },
    } as $TSContext;

    runBuildCommand(context);
    expect(sync).not.toHaveBeenCalled();
  });

  it('should exit when build command fails', () => {
    const context = {
      exeInfo: {
        inputParams: {
          runBuildCommand: true,
        },
        projectConfig: {
          frontend: 'javascript',
          javascript: {
            config: {
              BuildCommand: 'npm run-script build',
            },
          },
        },
      },
    } as $TSContext;

    (sync as jest.Mock).mockImplementation(() => {
      throw new Error('failed');
    });
    runBuildCommand(context);
    expect(exitOnNextTick).toHaveBeenCalledWith(1);
  });
});
