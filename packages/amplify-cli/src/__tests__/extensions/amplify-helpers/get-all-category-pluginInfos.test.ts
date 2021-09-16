import { Input } from '../../../domain/input';
import { constructContext } from '../../../context-manager';

import { PluginCollection } from '../../../domain/plugin-collection';
import { constructMockPluginPlatform } from './mock-plugin-platform';

import { getAllCategoryPluginInfo } from '../../../extensions/amplify-helpers/get-all-category-pluginInfos';

test('getAllCategoryPluginInfo', () => {
  const mockPluginPlatform = constructMockPluginPlatform();
  const mockProcessArgv = [
    '/Users/userName/.nvm/versions/node/v12.16.1/bin/node',
    '/Users/userName/.nvm/versions/node/v12.16.1/bin/amplify',
    'hosting',
    'add',
  ];
  const mockInput = new Input(mockProcessArgv);
  const mockContext = constructContext(mockPluginPlatform, mockInput);

  const categoryPluginInfoList = (getAllCategoryPluginInfo(mockContext) as unknown) as PluginCollection;
  expect(categoryPluginInfoList.hosting).toBeDefined();
  expect(Object.keys(categoryPluginInfoList.hosting).length).toEqual(2);
});
