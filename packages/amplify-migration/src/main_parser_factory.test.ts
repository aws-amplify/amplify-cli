import { createMainParser } from './main_parser_factory';
import { version } from '../package.json';
import assert from 'node:assert';
import { runCommandAsync } from './test-utils/command_runner';

describe('main parser', () => {
  const parser = createMainParser(version);

  it('includes gen2 command in help output', async () => {
    const output = await runCommandAsync(parser, '--help');
    assert.match(output, /Commands:/);
    assert.match(output, /to-gen-2\s+Migrates an Amplify Gen1 app to a Gen2 app/);
  });

  it('shows version', async () => {
    const output = await runCommandAsync(parser, '--version');
    assert.match(output, new RegExp(`${version}`));
  });

  it('fails if command is not provided', async () => {
    await assert.rejects(
      () => runCommandAsync(parser, ''),
      (err: any) => {
        assert.match(err.message, /Not enough non-option arguments:/);
        return true;
      },
    );
  });
});
