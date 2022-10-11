import {
  exitOnNextTick, pathManager, $TSContext, AmplifyError,
} from 'amplify-cli-core';
import { run as runEnvCmd } from '../../commands/env';
import { run as runAddEnvCmd } from '../../commands/env/add';
import * as envList from '../../commands/env/list';

jest.mock('../../commands/env/list');

jest.mock('amplify-cli-core');
const mockExit = jest.fn();
const exitOnNextTickMock = exitOnNextTick as jest.MockedFunction<typeof exitOnNextTick>;
const pathManagerMock = pathManager as jest.Mocked<typeof pathManager>;
exitOnNextTickMock.mockImplementation(mockExit);
pathManagerMock.getAmplifyMetaFilePath.mockReturnValue('test_file_does_not_exist');
pathManagerMock.getAWSCredentialsFilePath.mockReturnValue('test-creds-path');
pathManagerMock.getAWSConfigFilePath.mockReturnValue('test-config-path');

describe('amplify env:', () => {
  beforeEach(() => jest.clearAllMocks());
  it('env run method should exist', () => {
    expect(runEnvCmd).toBeDefined();
  });

  it('env add method should exist', () => {
    expect(runAddEnvCmd).toBeDefined();
  });

  it('env add method should throw if meta file does not exist', async () => {
    await expect(runAddEnvCmd(({} as unknown) as $TSContext)).rejects.toEqual(new AmplifyError('ConfigurationError', {
      // eslint-disable-next-line spellcheck/spell-checker
      message: 'Your workspace is not configured to modify the backend.',
      resolution: 'If you wish to change this configuration, remove your `amplify` directory and pull the project again.',
    }));
  });

  it('env ls is an alias for env list', async () => {
    const mockEnvListRun = jest.spyOn(envList, 'run');
    await runEnvCmd({
      input: {
        subCommands: ['list'],
      },
      parameters: {},
    });
    await runEnvCmd({
      input: {
        subCommands: ['ls'],
      },
      parameters: {},
    });
    expect(mockEnvListRun).toHaveBeenCalledTimes(2);
  });

  it('invalid env subcommand should give a warning', async () => {
    const mockContextInvalidEnvSubcommand = {
      amplify: {
        showHelp: jest.fn(),
      },
      parameters: {},
      input: {
        subCommands: ['test12345'],
      },
      print: {
        warning: jest.fn(),
        info: jest.fn(),
      },
    };
    await runEnvCmd(mockContextInvalidEnvSubcommand);
    expect(mockContextInvalidEnvSubcommand.amplify.showHelp).toBeCalled();
    expect(mockContextInvalidEnvSubcommand.print.warning.mock.calls[0][0]).toMatchInlineSnapshot(
      `"Cannot find command: 'amplify env test12345'"`,
    );
  });
});
