import { Input } from '../../../domain/input';
import { constructMockPluginPlatform } from './mock-plugin-platform';
import { constructContext } from '../../../context-manager';
import { getCategoryPluginInfo } from '../../../extensions/amplify-helpers/get-category-pluginInfo';

test('getCategoryPluginInfo return first pluginInfo to match category', () => {
  const mockPluginPlatform = constructMockPluginPlatform();
  const mockProcessArgv = [
    '/Users/userName/.nvm/versions/node/v12.16.1/bin/node',
    '/Users/userName/.nvm/versions/node/v12.16.1/bin/amplify',
    'hosting',
    'add',
  ];

  const mockInput = new Input(mockProcessArgv);
  const mockContext = constructContext(mockPluginPlatform, mockInput);
  const hostingPluginInfo = getCategoryPluginInfo(mockContext, 'hosting');
  expect(hostingPluginInfo).toBeDefined();
});

test('getCategoryPluginInfo return pluginInfo when plugin exists  to match category and service', () => {
  const mockPluginPlatform = constructMockPluginPlatform();
  const mockProcessArgv = [
    '/Users/userName/.nvm/versions/node/v12.16.1/bin/node',
    '/Users/userName/.nvm/versions/node/v12.16.1/bin/amplify',
    'hosting',
    'add',
  ];

  const mockInput = new Input(mockProcessArgv);
  const mockContext = constructContext(mockPluginPlatform, mockInput);
  const hostingAmplifyhostingPluginInfo = getCategoryPluginInfo(mockContext, 'hosting', 'amplifyhosting');
  expect(hostingAmplifyhostingPluginInfo).toBeDefined();
});

test('getCategoryPluginInfo return first pluginInfo to match only category when match service not exists', () => {
  const mockPluginPlatform = constructMockPluginPlatform();
  const mockProcessArgv = [
    '/Users/userName/.nvm/versions/node/v12.16.1/bin/node',
    '/Users/userName/.nvm/versions/node/v12.16.1/bin/amplify',
    'hosting',
    'add',
  ];

  const mockInput = new Input(mockProcessArgv);
  const mockContext = constructContext(mockPluginPlatform, mockInput);
  const hostingPluginInfo = getCategoryPluginInfo(mockContext, 'hosting', 'S3');
  expect(hostingPluginInfo).toBeDefined();
});
