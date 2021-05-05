import { getPluginInstance } from '../../../extensions/amplify-helpers/get-plugin-instance';
import path from 'path';

describe('get-plugin-instance', () => {
  it('returns instance when plugin exists', () => {
    const context = {
      pluginPlatform: {
        plugins: {
          test: [
            {
              packageLocation: path.join(__dirname, '../../../../__mocks__/faked-plugin'),
            },
          ],
        },
      },
    };
    const plugin = getPluginInstance(context, 'test');
    expect(plugin).toBeDefined();
  });

  it('returns undefined when no plugin exists', () => {
    const context = {
      pluginPlatform: {
        plugins: {},
      },
    };
    const plugin = getPluginInstance(context, 'test');
    expect(plugin).toBeUndefined();
  });
});
