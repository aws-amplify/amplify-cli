import yargs from 'yargs';
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { TestCommandRunner } from '../../test-utils/command_runner.js';
import { createGen2Command } from './gen2_command_factory.js';

/**
 * Top level generate command's responsibility is to wire subcommands and delegate execution down the command chain.
 * Therefore, testing primarily focuses on help output.
 */
void describe('top level gen2 command', () => {
  const gen2Command = createGen2Command();
  const parser = yargs().command(gen2Command);
  const commandRunner = new TestCommandRunner(parser);

  void it('includes gen2 subcommands in help output', async () => {
    const output = await commandRunner.runCommand('gen2 --help');
    assert.match(output, /Commands:/);
    assert.match(output, /Migrates an Amplify gen1 app to a gen2 app/);
  });

  void it('fails if subcommand is not provided', async () => {
    const output = await commandRunner.runCommand('gen2');
    assert.match(output, /Not enough non-option arguments/);
  });

  void it('should throw if top level command handler is ever called', () => {
    assert.throws(
      () => gen2Command.handler({ $0: '', _: [] }),
      (err: Error) => {
        assert.equal(err.message, 'Top level gen2 handler should never be called');
        return true;
      },
    );
  });
});
