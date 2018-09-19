const { join, dirname } = require('path');

const getSchemaDownloadLocation = require('../../src/utils/getSchemaDownloadLocation');
const getAndroidResDir = require('../../src/utils/getAndroidResDir');
const getFrontendHandler = require('../../src/utils/getFrontEndHandler');

jest.mock('../../src/utils/getAndroidResDir');
jest.mock('../../src/utils/getFrontEndHandler');

let mockContext;
const mockBackEndPath = 'MOCK_BACKEND_DIR';
const mockResDir = 'MOCK_RES_DIR/Res';
const mockAPIName = 'FooAPI';
const mockGetBackendDirPath = jest.fn();
describe('getSchemaDownloadLocation', () => {
  beforeEach(() => {
    jest.resetAllMocks();

    mockGetBackendDirPath.mockReturnValue(mockBackEndPath);

    getAndroidResDir.mockImplementation(() => {
      throw new Error();
    });
    getFrontendHandler.mockReturnValue('javascript');
    mockContext = {
      amplify: {
        pathManager: {
          getBackendDirPath: mockGetBackendDirPath,
        },
      },
    };
  });

  it('should use the src/graphql directory when used in JS frontend', () => {
    const downloadLocation = getSchemaDownloadLocation(mockContext, mockAPIName);
    expect(downloadLocation).toEqual(join('src', 'graphql', 'schema.json'));
  });

  it('should use the graphql directory when used in iOS frontend', () => {
    getFrontendHandler.mockReturnValue('iOS');
    const downloadLocation = getSchemaDownloadLocation(mockContext, mockAPIName);
    expect(downloadLocation).toEqual(join('graphql', 'schema.json'));
  });

  it('should use main directory in Android', () => {
    getAndroidResDir.mockReturnValue(mockResDir);
    const downloadLocation = getSchemaDownloadLocation(mockContext, mockAPIName);
    expect(downloadLocation).toEqual(join(dirname(mockResDir), 'graphql', 'schema.json'));
  });
});
