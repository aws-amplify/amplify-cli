import { CommandLineInput } from 'amplify-cli-core';
import { constructMockPluginPlatform } from './mock-plugin-platform';
import { constructContext } from '../../../context-manager';
import { getCategoryPluginInfo } from '../../../extensions/amplify-helpers/get-category-pluginInfo';
import { $TSContext } from 'amplify-cli-core';

test('getCategoryPluginInfo returns the first pluginInfo to match category', () => {
  const mockPluginPlatform = constructMockPluginPlatform();
  const mockProcessArgv = [
    '/Users/userName/.nvm/versions/node/v12.16.1/bin/node',
    '/Users/userName/.nvm/versions/node/v12.16.1/bin/amplify',
    'hosting',
    'add',
  ];

  const mockInput = new CommandLineInput(mockProcessArgv);
  const mockContext = (constructContext(mockPluginPlatform, mockInput) as unknown) as $TSContext;
  const hostingPluginInfo = getCategoryPluginInfo(mockContext, 'hosting');
  expect(hostingPluginInfo).toBeDefined();
});

test('getCategoryPluginInfo returns pluginInfo when plugin matches category and service', () => {
  const mockPluginPlatform = constructMockPluginPlatform();
  const mockProcessArgv = [
    '/Users/userName/.nvm/versions/node/v12.16.1/bin/node',
    '/Users/userName/.nvm/versions/node/v12.16.1/bin/amplify',
    'hosting',
    'add',
  ];

  const mockInput = new CommandLineInput(mockProcessArgv);
  const mockContext = (constructContext(mockPluginPlatform, mockInput) as unknown) as $TSContext;
  const hostingAmplifyhostingPluginInfo = getCategoryPluginInfo(mockContext, 'hosting', 'amplifyhosting');
  expect(hostingAmplifyhostingPluginInfo).toBeDefined();
});

test('getCategoryPluginInfo returns the first pluginInfo to match only category when no service match exists', () => {
  const mockPluginPlatform = constructMockPluginPlatform();
  const mockProcessArgv = [
    '/Users/userName/.nvm/versions/node/v12.16.1/bin/node',
    '/Users/userName/.nvm/versions/node/v12.16.1/bin/amplify',
    'hosting',
    'add',
  ];

  const mockInput = new CommandLineInput(mockProcessArgv);
  const mockContext = (constructContext(mockPluginPlatform, mockInput) as unknown) as $TSContext;
  const hostingPluginInfo = getCategoryPluginInfo(mockContext, 'hosting', 'S3');
  expect(hostingPluginInfo).toBeDefined();
});
