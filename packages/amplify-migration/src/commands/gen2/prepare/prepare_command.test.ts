import { Gen2PrepareCommand } from './prepare_command';
import { runCommandAsync } from '../../../test-utils/command_runner';
import yargs from 'yargs';

const mockHandler = jest.fn();
jest.mock('../../../command-handlers', () => ({
  ...jest.requireActual('../../../command-handlers'),
  prepare: () => mockHandler(),
}));

describe('PrepareCommand', () => {
  it('should run command successfully', async () => {
    const parser = yargs().command(new Gen2PrepareCommand());
    await runCommandAsync(parser, 'prepare');
    expect(mockHandler).toHaveBeenCalledTimes(1);
  });
});
