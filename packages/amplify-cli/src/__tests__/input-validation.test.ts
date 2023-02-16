import { verifyInput } from '../input-manager';
import { PluginPlatform, CommandLineInput } from 'amplify-cli-core';

describe('input validation tests', () => {
  it('status -v option should be treated as verbose', () => {
    const input = new CommandLineInput(['status', '-v']);
    input.command = 'status';
    input.options = { v: true };

    verifyInput(new PluginPlatform(), input);
    expect(input?.options?.verbose).toBe(true);
  });
});
