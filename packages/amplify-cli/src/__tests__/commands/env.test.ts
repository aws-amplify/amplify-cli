import { $TSContext, AmplifyError } from '@aws-amplify/amplify-cli-core';
jest.mock('../../commands/init');
jest.mock('@aws-amplify/amplify-cli-core');
import { run as runEnvCmd } from '../../commands/env';
import { run as runAddEnvCmd } from '../../commands/env/add';
import * as envList from '../../commands/env/list';

const AmplifyErrorMock = AmplifyError as jest.MockedClass<typeof AmplifyError>;

AmplifyErrorMock.mockImplementation(() => new Error('test error') as AmplifyError);

describe('amplify env: ', () => {
  it('env run method should exist', () => {
    expect(runEnvCmd).toBeDefined();
  });

  it('env add method should exist', () => {
    expect(runAddEnvCmd).toBeDefined();
  });

  it('env add method should throw if meta file does not exist', async () => {
    await expect(runAddEnvCmd({} as $TSContext)).rejects.toThrow();
  });

  it('env ls is an alias for env list', async () => {
    const mockEnvListRun = jest.spyOn(envList, 'run');
    const mockContext = {
      print: {
        table: jest.fn(),
      },
      amplify: {
        getAllEnvs: jest.fn().mockReturnValue(['testa', 'testb']),
        getEnvInfo: jest.fn().mockReturnValue({ envName: 'testa' }),
      },
      input: {
        subCommands: ['list'],
      },
      parameters: {},
    };
    await runEnvCmd(mockContext);
    mockContext.input.subCommands = ['ls'];
    await runEnvCmd(mockContext);
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
