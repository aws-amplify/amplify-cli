import { constructContext } from '../../../context-manager';

import { toolkitExtensions, $TSContext, PluginCollection } from 'amplify-cli-core';
import { constructMockPluginPlatform } from './mock-plugin-platform';

import { CLIInput as CommandLineInput } from '../../../domain/command-input';
const { getAllCategoryPluginInfo } = toolkitExtensions;

test('getAllCategoryPluginInfo', () => {
  const mockPluginPlatform = constructMockPluginPlatform();
  const mockProcessArgv = [
    '/Users/userName/.nvm/versions/node/v12.16.1/bin/node',
    '/Users/userName/.nvm/versions/node/v12.16.1/bin/amplify',
    'hosting',
    'add',
  ];
  const mockInput = new CommandLineInput(mockProcessArgv);
  const mockContext = constructContext(mockPluginPlatform, mockInput);

  const categoryPluginInfoList = getAllCategoryPluginInfo(mockContext as unknown as $TSContext) as unknown as PluginCollection;
  expect(categoryPluginInfoList.hosting).toBeDefined();
  expect(Object.keys(categoryPluginInfoList.hosting).length).toEqual(2);
});
