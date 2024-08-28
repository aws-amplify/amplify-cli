import { describe, it } from 'node:test';
import assert from 'node:assert';
import { TestCommandError, TestCommandRunner } from './test-utils/command_runner.js';
import { createMainParser } from './main_parser_factory.js';
import { version } from '#package.json';

void describe('main parser', { concurrency: false }, () => {
  const parser = createMainParser(version);
  const commandRunner = new TestCommandRunner(parser);

  void it('includes gen2 command in help output', async () => {
    const output = await commandRunner.runCommand('--help');
    assert.match(output, /Commands:/);
    assert.match(output, /gen2\s+Migrates an Amplify gen1 app to a gen2 app/);
  });

  void it('shows version', async () => {
    const output = await commandRunner.runCommand('--version');
    assert.equal(output, `${version}\n`);
  });

  void it('prints help if command is not provided', async () => {
    await assert.rejects(
      () => commandRunner.runCommand(''),
      (err) => {
        assert(err instanceof TestCommandError);
        assert.match(err.output, /Commands:/);
        assert.match(err.error.message, /Not enough non-option arguments:/);
        return true;
      },
    );
  });
});
