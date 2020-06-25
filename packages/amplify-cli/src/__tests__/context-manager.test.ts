import { Input } from '../domain/input';
import { PluginPlatform } from '../domain/plugin-platform';

import { constructContext } from '../context-manager';

test('constructContext', () => {
  const mockProcessArgv = [
    '/Users/userName/.nvm/versions/node/v8.11.4/bin/node',
    '/Users/userName/.nvm/versions/node/v8.11.4/bin/amplify',
    'status',
  ];
  const mockPluginPlatform = new PluginPlatform();
  const mockInput = new Input(mockProcessArgv);
  const context = constructContext(mockPluginPlatform, mockInput);
  expect(context).toBeDefined();
  expect(context.amplify).toBeDefined();
  expect(context.pluginPlatform).toEqual(mockPluginPlatform);
  expect(context.input).toEqual(mockInput);
});
