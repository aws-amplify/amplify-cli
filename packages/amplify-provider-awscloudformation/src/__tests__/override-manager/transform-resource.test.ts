import { $TSContext, IAmplifyResource } from '@aws-amplify/amplify-cli-core';
import { printer } from '@aws-amplify/amplify-prompts';
import * as path from 'path';
import { transformResourceWithOverrides } from '../../override-manager/transform-resource';
import CustomOverridePlugin from './mock-plugin/custom-override-plugin';

jest.mock('@aws-amplify/amplify-cli-core');
jest.mock('@aws-amplify/amplify-prompts');
jest.mock('./mock-plugin/custom-override-plugin');

const mockContext: $TSContext = {
  amplify: {
    getCategoryPluginInfo: jest.fn(),
  },
  parameters: {
    options: {},
  },
} as unknown as $TSContext;
const mockGetCategoryPluginInfo = mockContext.amplify.getCategoryPluginInfo as jest.MockedFunction<
  $TSContext['amplify']['getCategoryPluginInfo']
>;

describe('transformResourceWithOverrides', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('can invoke custom plugin transformCategoryStack method', async () => {
    mockGetCategoryPluginInfo.mockImplementation(() => ({
      packageLocation: path.join(__dirname, 'mock-plugin', 'custom-override-plugin'),
    }));
    const resource: IAmplifyResource = {
      category: 'customOverride',
      resourceName: 'custom',
      service: 'Custom',
    };
    await transformResourceWithOverrides(mockContext, resource);

    expect(mockGetCategoryPluginInfo).toBeCalledWith(mockContext, 'customOverride', 'custom');

    expect(CustomOverridePlugin.transformCategoryStack).toBeCalledWith(mockContext, resource);
  });

  it("print info message when custom plugin don't has transformCategoryStack method", async () => {
    mockGetCategoryPluginInfo.mockImplementation(() => ({
      packageLocation: path.join(__dirname, 'mock-plugin', 'custom-non-override-plugin'),
    }));
    const resource: IAmplifyResource = {
      category: 'customNonOverride',
      resourceName: 'custom',
      service: 'Custom',
    };
    await transformResourceWithOverrides(mockContext, resource);

    expect(printer.debug).toBeCalledWith('Overrides functionality is not implemented for this category');
  });
});
