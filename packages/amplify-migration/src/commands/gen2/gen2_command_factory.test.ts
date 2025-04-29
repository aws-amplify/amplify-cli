import yargs from 'yargs';
import assert from 'node:assert';
import { createGen2Command } from './gen2_command_factory';
import { runCommandAsync } from '../../test-utils/command_runner';

/**
 * Top level gen2 command's responsibility is to wire subcommands and delegate execution down the command chain.
 * Therefore, testing primarily focuses on help output.
 */
describe('top level gen2 command', () => {
  const gen2Command = createGen2Command();
  const parser = yargs().command(gen2Command);

  it('includes gen2 subcommands in help output', async () => {
    const output = await runCommandAsync(parser, 'to-gen-2 --help');
    assert.match(output, /Commands:/);
    assert.match(output, /Migrates an Amplify Gen1 app to a Gen2 app/);
  });

  it('fails if subcommand is not provided', async () => {
    await assert.rejects(
      () => runCommandAsync(parser, 'to-gen-2'),
      (err: Error) => {
        assert.match(err.message, /Top level gen2 handler should never be called/);
        return true;
      },
    );
  });

  it('should throw if top level command handler is ever called', () => {
    assert.throws(
      () => gen2Command.handler({ $0: '', _: [] }),
      (err: Error) => {
        assert.equal(err.message, 'Top level gen2 handler should never be called');
        return true;
      },
    );
  });
});
