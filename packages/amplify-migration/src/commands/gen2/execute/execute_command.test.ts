import { Gen2ExecuteCommand } from './execute_command';
import { runCommandAsync } from '../../../test-utils/command_runner';
import yargs, { CommandModule } from 'yargs';
import assert from 'node:assert';

const mockHandler = jest.fn();
jest.mock('../../../command-handlers', () => ({
  ...jest.requireActual('../../../command-handlers'),
  executeStackRefactor: (from: string, to: string) => mockHandler(from, to),
}));

describe('Gen2ExecuteCommand', () => {
  it('should run command successfully', async () => {
    const parser = yargs().command(new Gen2ExecuteCommand() as unknown as CommandModule);
    await runCommandAsync(parser, 'execute --from foo --to bar');
    expect(mockHandler).toHaveBeenCalledTimes(1);
    expect(mockHandler).toHaveBeenCalledWith('foo', 'bar');
  });

  it('should fail command when arguments are not provided', async () => {
    const parser = yargs().command(new Gen2ExecuteCommand() as unknown as CommandModule);
    await assert.rejects(
      () => runCommandAsync(parser, 'execute'),
      (err: Error) => {
        assert.equal(err.message, 'Missing required arguments: from, to');
        return true;
      },
    );
  });
});
