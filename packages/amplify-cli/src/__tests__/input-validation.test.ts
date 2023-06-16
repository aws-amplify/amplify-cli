import { verifyInput } from '../input-manager';
import { PluginPlatform } from '@aws-amplify/amplify-cli-core';
import { CLIInput as CommandLineInput } from '../domain/command-input';

describe('input validation tests', () => {
  it('status -v option should be treated as verbose', () => {
    const input = new CommandLineInput(['status', '-v']);
    input.command = 'status';
    input.options = { v: true };

    verifyInput(new PluginPlatform(), input);
    expect(input?.options?.verbose).toBe(true);
  });
});
