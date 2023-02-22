import { $TSContext, getPluginInstance } from '../..';
import * as path from 'path';

describe('get-plugin-instance', () => {
  it('returns instance when plugin exists', () => {
    const context = {
      pluginPlatform: {
        plugins: {
          test: [
            {
              packageLocation: path.join(__dirname, '../../../__mocks__/faked-plugin'),
            },
          ],
        },
      },
    } as unknown as $TSContext;
    const plugin = getPluginInstance(context, 'test');
    expect(plugin).toBeDefined();
  });

  it('returns undefined when no plugin exists', () => {
    const context = {
      pluginPlatform: {
        plugins: {},
      },
    } as unknown as $TSContext;
    const plugin = getPluginInstance(context, 'test');
    expect(plugin).toBeUndefined();
  });
});
