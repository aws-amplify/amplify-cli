import { getPlugin } from '../../../extensions/amplify-helpers/get-plugin';

describe('getPlugin', () => {
  it('return plugin directory when exists', () => {
    const context_stub = {
      runtime: {
        plugins: [{ name: 'test', directory: true }],
      },
    };
    const result = getPlugin(context_stub, 'test');
    expect(result).toBe(true);
  });

  it('return undefined when not exists', () => {
    const context_stub = {
      runtime: {
        plugins: [],
      },
    };
    const result = getPlugin(context_stub, 'test');
    expect(result).toBe(undefined);
  });
});
