import { Gen2RevertCommand } from './revert_command';
import { runCommandAsync } from '../../../test-utils/command_runner';
import yargs, { CommandModule } from 'yargs';
import assert from 'node:assert';
import { revertGen2Migration } from '../../../command-handlers';

const mockHandler = jest.fn();
jest.mock('../../../command-handlers', () => ({
  ...jest.requireActual('../../../command-handlers'),
  revertGen2Migration: (from: string, to: string) => mockHandler(from, to),
}));

describe('Gen2RevertCommand', () => {
  it('should run command successfully', async () => {
    const parser = yargs().command(new Gen2RevertCommand() as unknown as CommandModule);
    await runCommandAsync(parser, 'revert --from foo --to bar');
    expect(mockHandler).toHaveBeenCalledTimes(1);
    expect(mockHandler).toHaveBeenCalledWith('foo', 'bar');
  });

  it('should fail command when arguments are not provided', async () => {
    const parser = yargs().command(new Gen2RevertCommand() as unknown as CommandModule);
    await assert.rejects(
      () => runCommandAsync(parser, 'revert'),
      (err: Error) => {
        assert.equal(err.message, 'Missing required arguments: from, to');
        return true;
      },
    );
  });
});
