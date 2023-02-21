import { $TSContext } from 'amplify-cli-core';
import { getPlugin } from 'amplify-cli-core/lib/extensions/get-plugin';

describe('getPlugin', () => {
  it('return plugin directory when exists', () => {
    const context_stub = {
      runtime: {
        plugins: [{ name: 'test', directory: true }],
      },
    };
    const result = getPlugin(context_stub as unknown as $TSContext, 'test');
    expect(result).toBe(true);
  });

  it('return undefined when not exists', () => {
    const context_stub = {
      runtime: {
        plugins: [],
      },
    };
    const result = getPlugin(context_stub as unknown as $TSContext, 'test');
    expect(result).toBe(undefined);
  });
});
