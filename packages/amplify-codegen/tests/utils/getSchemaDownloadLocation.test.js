const { join, dirname } = require('path');

const getSchemaDownloadLocation = require('../../src/utils/getSchemaDownloadLocation');
const getAndroidResDir = require('../../src/utils/getAndroidResDir');
const getFrontendHandler = require('../../src/utils/getFrontEndHandler');

jest.mock('../../src/utils/getAndroidResDir');
jest.mock('../../src/utils/getFrontEndHandler');

let mockContext;
const mockProjectConfigDefault = 'MOCK_PROJECT_CONFIG';
const mockProjectConfig = {
  frontend: 'javascript',
  javascript: {
    config: {
      SourceDir: 'web-client/src',
    },
  },
};
const mockResDir = 'MOCK_RES_DIR/Res';
const mockAPIName = 'FooAPI';

const mockgetProjectConfigDefault = jest.fn();
const mockgetProjectConfig = jest.fn();
describe('getSchemaDownloadLocation', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockgetProjectConfigDefault.mockReturnValue(mockProjectConfigDefault);
    mockgetProjectConfig.mockReturnValue(mockProjectConfig);
    getAndroidResDir.mockImplementation(() => {
      throw new Error();
    });
    getFrontendHandler.mockReturnValue('javascript');
  });

  it('should use the src/graphql directory when used in JS frontend', () => {
    mockContext = {
      amplify: {
        getProjectConfig: mockgetProjectConfigDefault,
      },
    };
    const downloadLocation = getSchemaDownloadLocation(mockContext);
    expect(downloadLocation).toEqual(join('src', 'graphql', 'schema.json'));
  });

  it('should use the defined project config directory when used in JS frontend', () => {
    mockContext = {
      amplify: {
        getProjectConfig: mockgetProjectConfig,
      },
    };
    const downloadLocation = getSchemaDownloadLocation(mockContext);
    expect(downloadLocation).toEqual(join('web-client', 'src', 'graphql', 'schema.json'));
  });

  it('should use the graphql directory when used in iOS frontend', () => {
    mockContext = {
      amplify: {
        getProjectConfig: mockgetProjectConfig,
      },
    };
    getFrontendHandler.mockReturnValue('iOS');
    const downloadLocation = getSchemaDownloadLocation(mockContext);
    expect(downloadLocation).toEqual(join('graphql', 'schema.json'));
  });

  it('should use main directory in Android', () => {
    mockContext = {
      amplify: {
        getProjectConfig: mockgetProjectConfig,
      },
    };
    getAndroidResDir.mockReturnValue(mockResDir);
    const downloadLocation = getSchemaDownloadLocation(mockContext);
    expect(downloadLocation).toEqual(join(dirname(mockResDir), 'graphql', 'schema.json'));
  });
});
