import { Input } from 'amplify-cli-core';
import { verifyInput } from '../input-manager';
import { PluginPlatform } from 'amplify-cli-core';

describe('input validation tests', () => {
  it('status -v option should be treated as verbose', () => {
    const input = new Input(['status', '-v']);
    input.command = 'status';
    input.options = { v: true };

    verifyInput(new PluginPlatform(), input);
    expect(input?.options?.verbose).toBe(true);
  });
});
