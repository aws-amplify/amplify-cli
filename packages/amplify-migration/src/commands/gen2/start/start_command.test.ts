import { Gen2StartCommand } from './start_command';
import { runCommandAsync } from '../../../test-utils/command_runner';
import yargs from 'yargs';

jest.mock('ora');
const mockHandler = jest.fn();
jest.mock('../../../command-handlers', () => ({
  ...jest.requireActual('../../../command-handlers'),
  execute: () => mockHandler(),
}));

describe('StartCommand', () => {
  it('should run command successfully', async () => {
    const parser = yargs().command(new Gen2StartCommand());
    await runCommandAsync(parser, 'prepare');
    expect(mockHandler).toHaveBeenCalledTimes(1);
  });
});
